import { Worker } from "bullmq";
import redis from "../../../config/redis.js";
import Campaign from "../../whatsapp/campaigns/campaign.model.js";
import { sendMessage } from "../../whatsapp/messages/services/messageSender.service.js";
import { campaignQueue } from "../queues/campaign.queue.js";

export const campaignWorker = new Worker(
  "campaignQueue",
  async (job) => {
    if (job.name === "start-campaign") {
      // Launch campaign messages
      const { campaignId } = job.data;
      const campaign = await Campaign.findById(campaignId);
      campaign.status = "running";
      await campaign.save();

      for (let variant of campaign.messageVariants) {
        for (let recipient of variant.recipients) {
          await campaignQueue.add("send-message", {
            campaignId,
            userId: campaign.userId.toString(),
            variantName: variant.variantName,
            recipient,
            message: {
              type: variant.type,
              text: variant.message,
              media: variant.media,
              templateId: variant.templateId,
            },
          });
        }
      }
    }

    if (job.name === "send-message") {
      const { campaignId, userId, recipient, message, variantName } = job.data;

      try {
        await sendMessage(
          userId,
          recipient.phone,
          message,
          recipient.variables || {}
        );

        console.log(`📝 Updating recipient status to 'sent'`);
        const updateResult = await Campaign.updateOne(
          {
            _id: campaignId,
            "messageVariants.variantName": variantName,
            "messageVariants.recipients.phone": recipient.phone,
          },
          {
            $set: {
              "messageVariants.$[v].recipients.$[r].status": "sent",
              "messageVariants.$[v].recipients.$[r].sentAt": new Date(),
            },
          },
          {
            arrayFilters: [
              { "v.variantName": variantName },
              { "r.phone": recipient.phone },
            ],
          }
        );
        console.log(`📝 Update result:`, updateResult);

        // Also update campaign metrics
        await Campaign.updateOne(
          { _id: campaignId },
          {
            $inc: {
              "metrics.sent": 1,
              [`messageVariants.$[v].metrics.sent`]: 1,
            },
          },
          {
            arrayFilters: [{ "v.variantName": variantName }],
          }
        );
        console.log(`📊 Campaign metrics updated`);
      } catch (err) {
        console.error(
          `❌ Failed to send message to ${recipient.phone}:`,
          err.message
        );
        await Campaign.updateOne(
          {
            _id: campaignId,
            "messageVariants.variantName": variantName,
            "messageVariants.recipients.phone": recipient.phone,
          },
          {
            $set: {
              "messageVariants.$[v].recipients.$[r].status": "failed",
              "messageVariants.$[v].recipients.$[r].lastError": err.message,
            },
          },
          {
            arrayFilters: [
              { "v.variantName": variantName },
              { "r.phone": recipient.phone },
            ],
          }
        );

        // Update campaign metrics for failed messages
        await Campaign.updateOne(
          { _id: campaignId },
          {
            $inc: {
              "metrics.failed": 1,
              [`messageVariants.$[v].metrics.failed`]: 1,
            },
          },
          {
            arrayFilters: [{ "v.variantName": variantName }],
          }
        );
      }

      // check if campaign is done
      const campaign = await Campaign.findById(campaignId);
      const anyPending = campaign.messageVariants.some((v) =>
        v.recipients.some((r) => r.status === "pending")
      );
      if (!anyPending) {
        campaign.status = "completed";
        await campaign.save();
      }
    }
  },
  { connection: redis }
);

campaignWorker.on("completed", (job) =>
  console.log(`✅ Job ${job.id} (${job.name}) completed`)
);
campaignWorker.on("failed", (job, err) =>
  console.error(`❌ Job ${job.id} (${job.name}) failed: ${err.message}`)
);
campaignWorker.on("error", (err) =>
  console.error(`💥 Campaign worker error: ${err.message}`)
);
campaignWorker.on("stalled", (jobId) =>
  console.warn(`⚠️ Job ${jobId} stalled`)
);

console.log("🚀 Campaign worker started and listening for jobs");

// Function to check queue status
export const getQueueStatus = async () => {
  try {
    const waiting = await campaignQueue.getWaiting();
    const active = await campaignQueue.getActive();
    const delayed = await campaignQueue.getDelayed();
    const completed = await campaignQueue.getCompleted();
    const failed = await campaignQueue.getFailed();

    console.log(`📊 Queue Status:`);
    console.log(`   Waiting: ${waiting.length}`);
    console.log(`   Active: ${active.length}`);
    console.log(`   Delayed: ${delayed.length}`);
    console.log(`   Completed: ${completed.length}`);
    console.log(`   Failed: ${failed.length}`);

    if (delayed.length > 0) {
      console.log(`⏰ Delayed jobs:`);
      delayed.forEach((job) => {
        console.log(
          `   - Job ${job.id}: ${job.name} (${job.data.campaignId}) - Delay: ${job.delay}ms`
        );
      });
    }

    return { waiting, active, delayed, completed, failed };
  } catch (error) {
    console.error(`❌ Error getting queue status:`, error);
    return null;
  }
};

// Check queue status every 30 seconds
setInterval(getQueueStatus, 30000);
