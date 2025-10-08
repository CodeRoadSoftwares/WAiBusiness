import { Worker } from "bullmq";
import redis from "../../../config/redis.js";
import mongoose from "mongoose";
import Campaign from "../../whatsapp/campaigns/campaign.model.js";
import { sendMessage } from "../../whatsapp/messages/services/messageSender.service.js";
import { campaignQueue } from "../queues/campaign.queue.js";
import { sessionHealthService } from "../../whatsapp/sessions/services/sessionHealth.service.js";
import { CampaignMessageService } from "../../whatsapp/campaigns/services/campaignMessage.service.js";

// Database connection is handled by the main app in index.js

// More Efficient Approach - Batch Processing
export const campaignWorker = new Worker(
  "campaignQueue",
  async (job) => {
    if (job.name === "start-campaign") {
      const { campaignId } = job.data;

      try {
        console.log(`🚀 Starting campaign ${campaignId}...`);

        // Convert string ID to ObjectId
        const campaignObjectId = new mongoose.Types.ObjectId(campaignId);
        const campaign = await Campaign.findById(campaignObjectId);
        if (!campaign) {
          console.error(`❌ Campaign ${campaignId} not found in database`);
          console.log("📊 Available campaigns:");
          const allCampaigns = await Campaign.find({}).select(
            "_id name status"
          );
          allCampaigns.forEach((c) =>
            console.log(`  - ${c._id}: ${c.name} (${c.status})`)
          );
          throw new Error(`Campaign ${campaignId} not found`);
        }

        console.log(`📊 Campaign found: ${campaign.name}`);
        console.log(`📊 Variants: ${campaign.messageVariants.length}`);

        // Calculate total recipients across all variants
        const totalRecipients = campaign.messageVariants.reduce(
          (sum, variant) => sum + variant.recipients.length,
          0
        );

        console.log(`📊 Total recipients: ${totalRecipients}`);

        campaign.status = "running";
        campaign.totalRecipients = totalRecipients;
        campaign.processedRecipients = 0; // Reset in case of retry
        await campaign.save();

        console.log(`✅ Campaign status updated to running`);

        // Use fixed batch size (dynamic config removed)
        const batchSize = 20;

        console.log(
          `📊 Using adaptive batch size: ${batchSize} for campaign ${campaignId}`
        );

        let totalBatchesCreated = 0;

        for (let variant of campaign.messageVariants) {
          const recipients = variant.recipients;
          console.log(
            `📊 Processing variant ${variant.variantName} with ${recipients.length} recipients`
          );

          // Create campaign messages in bulk for efficient tracking
          console.log(
            `📝 Creating campaign messages for variant ${variant.variantName}...`
          );
          const createdMessages = await CampaignMessageService.createMessages(
            campaignId,
            campaign.userId.toString(),
            variant.variantName,
            recipients
          );
          console.log(`✅ Created ${createdMessages.length} campaign messages`);

          // Split recipients into adaptive batches with unique job IDs
          const batches = [];
          for (let i = 0; i < recipients.length; i += batchSize) {
            const batch = recipients.slice(i, i + batchSize);
            const batchId = `${campaignId}_${variant.variantName}_${i}`;
            batches.push({ batch, batchId, delay: i * 500 }); // Reduced from 2000ms to 500ms
          }

          console.log(
            `📦 Creating ${batches.length} batches for variant ${variant.variantName}`
          );

          for (const { batch, batchId, delay } of batches) {
            await campaignQueue.add(
              "send-batch",
              {
                campaignId,
                userId: campaign.userId.toString(),
                variantName: variant.variantName,
                recipients: batch,
                batchId, // Add unique batch identifier
                message: {
                  type: variant.type,
                  text: variant.message,
                  media: variant.media,
                  templateId: variant.templateId,
                },
              },
              {
                jobId: batchId, // Use unique job ID to prevent duplicates
                delay: delay, // 2 second delay between batches
                attempts: 3,
                backoff: { type: "exponential", delay: 2000 },
                removeOnComplete: 10, // Keep only 10 completed jobs
                removeOnFail: 5, // Keep only 5 failed jobs
              }
            );
            totalBatchesCreated++;
          }
        }

        console.log(
          `🎉 Campaign ${campaignId} setup complete! Created ${totalBatchesCreated} batches`
        );
      } catch (error) {
        console.error(
          `❌ Error in start-campaign job for ${campaignId}:`,
          error
        );
        throw error;
      }
    }

    if (job.name === "send-batch") {
      const { campaignId, userId, recipients, message, variantName, batchId } =
        job.data;

      // Generate batchId if not present (for existing jobs)
      const effectiveBatchId =
        batchId || `${campaignId}_${variantName}_${job.id}`;

      try {
        // Add job heartbeat to prevent stalling
        await job.updateProgress(0);

        // Check session health before processing batch
        const sessionResult = await sessionHealthService.getHealthySession(
          userId,
          3
        );

        if (!sessionResult.isHealthy) {
          console.warn(
            `⚠️ Session unhealthy for user ${userId}, requeuing batch ${effectiveBatchId}`
          );
          await sessionHealthService.requeueJobDueToSessionFailure(
            job,
            `Session unhealthy: ${sessionResult.error}`,
            60000 // 1 minute delay
          );
          return { requeuedDueToSessionFailure: true };
        }

        // First, check if campaign exists
        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
          console.error(
            `❌ Campaign ${campaignId} not found, removing job ${effectiveBatchId}`
          );
          return { skipped: true, reason: "Campaign not found" };
        }

        // Atomically claim this batch's phones to avoid double processing across batches
        const batchPhones = recipients.map((r) => r.phone);
        const claimedPhones = await CampaignMessageService.claimPendingByPhones(
          campaignId,
          variantName,
          batchPhones
        );

        const claimedSet = new Set(claimedPhones);
        const pendingRecipients = recipients.filter((r) =>
          claimedSet.has(r.phone)
        );

        console.log("claimedPhones:", claimedPhones);
        console.log("pendingRecipients:", pendingRecipients);

        if (pendingRecipients.length === 0) {
          console.log(
            `⚠️ All recipients in batch ${effectiveBatchId} already sent, skipping...`
          );

          // Check if this was the last batch and cancel remaining jobs
          const remainingPending =
            await CampaignMessageService.getPendingMessages(
              campaignId,
              variantName,
              1
            );

          if (remainingPending.length === 0) {
            console.log(
              `🎉 All messages for variant ${variantName} completed!`
            );

            // Cancel remaining delayed jobs for this campaign
            const delayedJobs = await campaignQueue.getDelayed();
            const campaignJobs = delayedJobs.filter(
              (job) => job.data.campaignId === campaignId
            );

            if (campaignJobs.length > 0) {
              console.log(
                `🧹 Cancelling ${campaignJobs.length} remaining delayed jobs for completed campaign ${campaignId}`
              );
              for (const job of campaignJobs) {
                await job.remove();
              }
            }
          }

          return { skipped: true, reason: "All recipients already sent" };
        }

        console.log(
          `📦 Processing batch ${effectiveBatchId}: ${pendingRecipients.length}/${recipients.length} pending recipients`
        );

        // Process batch with memory-efficient streaming
        const results = [];
        const updateOps = [];
        const totalRecipients = pendingRecipients.length;

        for (let i = 0; i < pendingRecipients.length; i++) {
          const recipient = pendingRecipients[i];

          // Update job progress to prevent stalling
          await job.updateProgress(Math.round((i / totalRecipients) * 100));

          try {
            console.log(
              `📤 Attempting to send message to ${recipient.phone} for user ${userId}`
            );
            console.log(
              `📤 Message type: ${
                message.type
              }, content: ${message.text?.substring(0, 100)}...`
            );

            await sendMessage(
              userId,
              recipient.phone,
              message,
              recipient.variables || {}
            );

            console.log(
              `📤 Recipient ${recipient.phone} exists on WhatsApp: true`
            );
            console.log(
              `📤 Sending message to JID: ${recipient.phone}@s.whatsapp.net`
            );

            // Small delay between messages to prevent overwhelming WhatsApp
            if (i < pendingRecipients.length - 1) {
              await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms delay
            }

            // Add to bulk update operations: mark as sent (previously set to processing)
            updateOps.push({
              updateOne: {
                filter: {
                  campaignId: new mongoose.Types.ObjectId(campaignId),
                  variantName,
                  phone: recipient.phone,
                },
                update: {
                  $set: {
                    status: "sent",
                    sentAt: new Date(),
                  },
                },
              },
            });

            results.push({
              phone: recipient.phone,
              status: "sent",
              sentAt: new Date(),
            });
          } catch (error) {
            console.error(`❌ sendMessage error: ${error.message}`);
            console.error(
              `❌ Failed to send to ${recipient.phone}: Message send failed: ${error.message}`
            );

            // Add to bulk update operations: mark as failed
            updateOps.push({
              updateOne: {
                filter: {
                  campaignId: new mongoose.Types.ObjectId(campaignId),
                  variantName,
                  phone: recipient.phone,
                },
                update: {
                  $set: {
                    status: "failed",
                    lastError: error.message,
                  },
                },
              },
            });

            results.push({
              phone: recipient.phone,
              status: "failed",
              error: error.message,
            });
          }
        }

        // Single bulk database update for the entire batch using CampaignMessageService
        if (updateOps.length > 0) {
          try {
            await CampaignMessageService.updateMessagesBulk(updateOps);
            console.log("✅ Messages updated in bulk");
          } catch (error) {
            console.error("Failed to update message status in bulk:", error);
            // Continue processing even if bulk update fails
          }
        }

        // Update campaign metrics in single operation
        const sentCount = results.filter((r) => r.status === "sent").length;
        const failedCount = results.filter((r) => r.status === "failed").length;

        try {
          await Campaign.updateOne(
            { _id: campaignId },
            {
              $inc: {
                "metrics.sent": sentCount,
                "metrics.failed": failedCount,
                [`messageVariants.$[v].metrics.sent`]: sentCount,
                [`messageVariants.$[v].metrics.failed`]: failedCount,
              },
            },
            { arrayFilters: [{ "v.variantName": variantName }] }
          );
          console.log("✅ Campaign metrics updated");
        } catch (error) {
          console.error("Failed to update campaign metrics:", error);
          // Continue processing even if metrics update fails
        }

        console.log(
          `✅ Batch ${effectiveBatchId} completed: ${sentCount} sent, ${failedCount} failed`
        );

        // ✅ ATOMIC COMPLETION CHECK — COUNTER BASED
        if (results.length > 0) {
          const updatedCampaign = await Campaign.findOneAndUpdate(
            { _id: campaignId },
            {
              $inc: { processedRecipients: results.length },
              $set: { updatedAt: new Date() },
            },
            { new: true }
          );
          console.log("✅ Campaign updated");
          // Check if all recipients processed
          if (
            updatedCampaign.processedRecipients >=
            updatedCampaign.totalRecipients
          ) {
            const completionResult = await Campaign.updateOne(
              {
                _id: campaignId,
                status: { $ne: "completed" }, // Prevent race condition
              },
              {
                $set: {
                  status: "completed",
                  completedAt: new Date(),
                },
              }
            );
            console.log("✅ Campaign marked as completed");
            if (completionResult.modifiedCount > 0) {
              console.log(`✅ Campaign ${campaignId} marked as completed`);
            } else {
              console.log(
                `ℹ️ Campaign ${campaignId} already completed by another job`
              );
            }
          } else {
            console.log(
              `📊 Progress: ${updatedCampaign.processedRecipients}/${
                updatedCampaign.totalRecipients
              } (${Math.round(
                (updatedCampaign.processedRecipients /
                  updatedCampaign.totalRecipients) *
                  100
              )}%)`
            );
          }
        }
      } catch (error) {
        console.error(
          `❌ Batch processing error for user ${userId}:`,
          error.message
        );

        // Check if it's a session-related error
        if (
          error.message?.includes("Session") ||
          error.message?.includes("WhatsApp") ||
          error.message?.includes("client")
        ) {
          console.warn(
            `⚠️ Session error in batch ${effectiveBatchId}, requeuing...`
          );
          await sessionHealthService.requeueJobDueToSessionFailure(
            job,
            `Session error: ${error.message}`,
            30000 // 30 second delay
          );
          return { requeuedDueToSessionFailure: true };
        }

        // For other errors, let the job fail and retry
        console.error(`💥 Campaign worker error: ${error.message}`);
        throw error;
      }
    }

    if (job.name === "send-message") {
      const { campaignId, userId, recipient, message, variantName } = job.data;

      try {
        // Check session health before processing
        const sessionResult = await sessionHealthService.getHealthySession(
          userId,
          3
        );

        if (!sessionResult.isHealthy) {
          console.warn(
            `⚠️ Session unhealthy for user ${userId}, requeuing message`
          );
          await sessionHealthService.requeueJobDueToSessionFailure(
            job,
            `Session unhealthy: ${sessionResult.error}`,
            30000 // 30 second delay
          );
          return { requeuedDueToSessionFailure: true };
        }

        // Check if message was already sent to this phone number in any variant
        const existingCampaign = await Campaign.findById(campaignId);
        const alreadySent = existingCampaign.messageVariants.some((variant) =>
          variant.recipients.some(
            (rec) =>
              rec.phone === recipient.phone &&
              (rec.status === "sent" ||
                rec.status === "delivered" ||
                rec.status === "read")
          )
        );

        if (alreadySent) {
          console.log(
            `⚠️ Message already sent to ${recipient.phone}, skipping...`
          );

          // Update this specific recipient status to skipped
          await Campaign.updateOne(
            {
              _id: campaignId,
              "messageVariants.variantName": variantName,
              "messageVariants.recipients.phone": recipient.phone,
            },
            {
              $set: {
                "messageVariants.$[v].recipients.$[r].status": "skipped",
                "messageVariants.$[v].recipients.$[r].lastError":
                  "Already sent to this number",
              },
            },
            {
              arrayFilters: [
                { "v.variantName": variantName },
                { "r.phone": recipient.phone },
              ],
            }
          );
          return; // Skip sending
        }

        // Rate limiting disabled

        // Add retry logic with exponential backoff
        let retryCount = 0;
        const maxRetries = 3;
        let lastError = null;

        while (retryCount < maxRetries) {
          try {
            console.log(
              `📤 Sending message to ${recipient.phone} (attempt ${
                retryCount + 1
              }/${maxRetries})`
            );
            const result = await sendMessage(
              userId,
              recipient.phone,
              message,
              recipient.variables || {}
            );
            console.log(
              `✅ Message sent successfully to ${recipient.phone}:`,
              result
            );
            break; // Success, exit retry loop
          } catch (error) {
            lastError = error;
            retryCount++;

            if (
              error.message?.includes("Failed to restore WhatsApp client") ||
              error.message?.includes("conflict") ||
              error.message?.includes("Timed Out")
            ) {
              console.log(
                `⚠️ Connection issue for user ${userId}, retry ${retryCount}/${maxRetries}`
              );

              if (retryCount < maxRetries) {
                // Exponential backoff: wait 2^retryCount seconds
                const backoffTime = Math.pow(2, retryCount) * 1000;
                console.log(`⏳ Waiting ${backoffTime}ms before retry...`);
                await new Promise((resolve) =>
                  setTimeout(resolve, backoffTime)
                );
                continue;
              }
            }

            // For other errors, don't retry
            throw error;
          }
        }

        if (retryCount >= maxRetries && lastError) {
          throw lastError;
        }

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

        // ✅ ATOMIC COMPLETION CHECK — COUNTER BASED
        const updatedCampaign = await Campaign.findOneAndUpdate(
          { _id: campaignId },
          {
            $inc: { processedRecipients: 1 },
            $set: { updatedAt: new Date() },
          },
          { new: true }
        );
        console.log("✅ Campaign updated");
        if (
          updatedCampaign.processedRecipients >= updatedCampaign.totalRecipients
        ) {
          const completionResult = await Campaign.updateOne(
            {
              _id: campaignId,
              status: { $ne: "completed" },
            },
            {
              $set: {
                status: "completed",
                completedAt: new Date(),
              },
            }
          );
          console.log("✅ Campaign marked as completed");
          if (completionResult.modifiedCount > 0) {
            console.log(`✅ Campaign ${campaignId} marked as completed`);
          } else {
            console.log(
              `ℹ️ Campaign ${campaignId} already completed by another job`
            );
          }
        } else {
          console.log(
            `📊 Progress: ${updatedCampaign.processedRecipients}/${
              updatedCampaign.totalRecipients
            } (${Math.round(
              (updatedCampaign.processedRecipients /
                updatedCampaign.totalRecipients) *
                100
            )}%)`
          );
        }
      } catch (err) {
        console.error(
          `❌ Failed to send message to ${recipient.phone}:`,
          err.message
        );

        // Check if it's a session-related error
        if (
          err.message?.includes("Session") ||
          err.message?.includes("WhatsApp") ||
          err.message?.includes("client") ||
          err.message?.includes("Failed to restore")
        ) {
          console.warn(
            `⚠️ Session error detected, requeuing message for ${recipient.phone}`
          );
          await sessionHealthService.requeueJobDueToSessionFailure(
            job,
            `Session error: ${err.message}`,
            30000 // 30 second delay
          );
          return { requeuedDueToSessionFailure: true };
        }

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

        // ✅ Still increment processed counter on failure (we processed it, even if unsuccessfully)
        const updatedCampaign = await Campaign.findOneAndUpdate(
          { _id: campaignId },
          {
            $inc: { processedRecipients: 1 },
            $set: { updatedAt: new Date() },
          },
          { new: true }
        );

        if (
          updatedCampaign.processedRecipients >= updatedCampaign.totalRecipients
        ) {
          const completionResult = await Campaign.updateOne(
            {
              _id: campaignId,
              status: { $ne: "completed" },
            },
            {
              $set: {
                status: "completed",
                completedAt: new Date(),
              },
            }
          );

          if (completionResult.modifiedCount > 0) {
            console.log(`✅ Campaign ${campaignId} marked as completed`);
          } else {
            console.log(
              `ℹ️ Campaign ${campaignId} already completed by another job`
            );
          }
        }
      }
    }
  },
  {
    connection: redis,
    concurrency: 5, // Increased from 2 to 5 for faster processing
    removeOnComplete: 10, // Reduced to prevent Redis memory issues
    removeOnFail: 5, // Reduced to prevent Redis memory issues
    stalledInterval: 30000, // Increased from 15s to 30s to prevent false stalls
    maxStalledCount: 3, // Allow more stalled jobs before failing
    lockDuration: 120000, // Reduced from 5 minutes to 2 minutes
    lockRenewTime: 15000, // Reduced from 30s to 15s for faster lock renewal
  }
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
