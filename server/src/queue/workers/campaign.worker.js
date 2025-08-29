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

        await Campaign.updateOne(
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
      } catch (err) {
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

campaignWorker.on("completed", (job) => console.log(`Job ${job.id} completed`));
campaignWorker.on("failed", (job, err) =>
  console.error(`Job ${job.id} failed: ${err.message}`)
);

console.log("[worker] Campaign worker started");
