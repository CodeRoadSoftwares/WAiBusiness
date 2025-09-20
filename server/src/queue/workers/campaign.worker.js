import { Worker } from "bullmq";
import redis from "../../../config/redis.js";
import mongoose from "mongoose";
import Campaign from "../../whatsapp/campaigns/campaign.model.js";
import { sendMessage } from "../../whatsapp/messages/services/messageSender.service.js";
import { campaignQueue } from "../queues/campaign.queue.js";
import { defaultRateLimiter } from "../../utils/rateLimiter.util.js";
import { sessionHealthService } from "../../whatsapp/sessions/services/sessionHealth.service.js";
import { CampaignMessageService } from "../../whatsapp/campaigns/services/campaignMessage.service.js";
import { dynamicConfigService } from "../../utils/dynamicConfig.util.js";
import { whatsappRateLimiter } from "../../utils/whatsappRateLimiter.util.js";
import { DirectMessageService } from "../../whatsapp/messages/services/directMessage.service.js";

// More Efficient Approach - Batch Processing
export const campaignWorker = new Worker(
  "campaignQueue",
  async (job) => {
    if (job.name === "start-campaign") {
      const { campaignId } = job.data;
      const campaign = await Campaign.findById(campaignId);

      // Calculate total recipients across all variants
      const totalRecipients = campaign.messageVariants.reduce(
        (sum, variant) => sum + variant.recipients.length,
        0
      );

      campaign.status = "running";
      campaign.totalRecipients = totalRecipients;
      campaign.processedRecipients = 0; // Reset in case of retry
      await campaign.save();

      // Get adaptive batch size based on message type and system load
      const systemMetrics = await dynamicConfigService.getSystemMetrics();
      const batchSize = await dynamicConfigService.getAdaptiveBatchSize(
        campaign.messageVariants[0]?.type || "text",
        systemMetrics
      );

      console.log(
        `📊 Using adaptive batch size: ${batchSize} for campaign ${campaignId}`
      );

      for (let variant of campaign.messageVariants) {
        const recipients = variant.recipients;

        // Create campaign messages in bulk for efficient tracking
        await CampaignMessageService.createMessages(
          campaignId,
          campaign.userId.toString(),
          variant.variantName,
          recipients
        );

        // Split recipients into adaptive batches
        for (let i = 0; i < recipients.length; i += batchSize) {
          const batch = recipients.slice(i, i + batchSize);

          await campaignQueue.add(
            "send-batch",
            {
              campaignId,
              userId: campaign.userId.toString(),
              variantName: variant.variantName,
              recipients: batch,
              message: {
                type: variant.type,
                text: variant.message,
                media: variant.media,
                templateId: variant.templateId,
              },
            },
            {
              delay: Math.max(0, Number(i * 2000) || 0), // 2 second delay between batches
              attempts: 3,
              backoff: { type: "exponential", delay: 2000 },
            }
          );
        }
      }
    }

    if (job.name === "send-batch") {
      const { campaignId, userId, recipients, message, variantName } = job.data;

      try {
        // Check session health before processing batch
        const sessionResult = await sessionHealthService.getHealthySession(
          userId,
          3
        );

        if (!sessionResult.isHealthy) {
          console.warn(
            `⚠️ Session unhealthy for user ${userId}, requeuing batch`
          );
          await sessionHealthService.requeueJobDueToSessionFailure(
            job,
            `Session unhealthy: ${sessionResult.error}`,
            60000 // 1 minute delay
          );
          return { requeuedDueToSessionFailure: true };
        }

        // Get pending messages efficiently using the new service
        const pendingMessages = await CampaignMessageService.getPendingMessages(
          campaignId,
          variantName,
          recipients.length
        );

        // Create a set of pending phone numbers for quick lookup
        const pendingPhones = new Set(pendingMessages.map((msg) => msg.phone));

        // Filter out already sent recipients
        const pendingRecipients = recipients.filter((rec) =>
          pendingPhones.has(rec.phone)
        );

        if (pendingRecipients.length === 0) {
          console.log(`⚠️ All recipients in batch already sent, skipping...`);
          return;
        }

        // Get campaign-specific rate limits
        const campaign = await Campaign.findById(campaignId);
        const campaignRateLimit = campaign?.rateLimit?.messagesPerMinute || 20;

        // Create a campaign-specific rate limiter
        const campaignRateLimiter = new (
          await import("../../utils/rateLimiter.util.js")
        ).RateLimiter({
          windowSize: 60000, // 1 minute
          maxRequests: campaignRateLimit,
          keyPrefix: `campaign_rate_limit_${campaignId}`,
        });

        // Check rate limit using campaign-specific limiter
        const batchRateLimitResult = await campaignRateLimiter.checkAndConsume(
          userId,
          1
        );

        if (!batchRateLimitResult.allowed) {
          console.log(
            `⏳ Rate limit reached for user ${userId}, requeuing batch with ${batchRateLimitResult.waitTime}ms delay`
          );

          // Requeue the entire batch with delay instead of blocking
          await campaignQueue.add(
            "send-batch",
            {
              campaignId,
              userId,
              variantName,
              recipients: pendingRecipients, // All recipients
              message,
            },
            {
              delay: Math.max(0, Number(batchRateLimitResult.waitTime) || 0),
              attempts: Math.max(
                1,
                Number.isFinite(
                  Number((job.opts.attempts ?? 3) - job.attempts + 1)
                )
                  ? (job.opts.attempts ?? 3) - job.attempts + 1
                  : 3
              ),
              backoff: { type: "exponential", delay: 5000 },
              removeOnComplete: false,
              removeOnFail: false,
            }
          );

          return { requeuedDueToRateLimit: true };
        }

        // Process batch with memory-efficient streaming
        const results = [];
        const updateOps = [];

        for (const recipient of pendingRecipients) {
          // Add dynamic delay between messages based on campaign settings
          const delayBetweenMessages =
            campaign?.rateLimit?.delayBetweenMessages || 2000;
          const randomDelay = campaign?.rateLimit?.randomDelay
            ? Math.random() * delayBetweenMessages * 0.5
            : 0; // Add up to 50% random delay

          if (delayBetweenMessages > 0) {
            await new Promise((resolve) =>
              setTimeout(resolve, delayBetweenMessages + randomDelay)
            );
          }

          try {
            await sendMessage(
              userId,
              recipient.phone,
              message,
              recipient.variables || {}
            );

            // Add to bulk update operations instead of accumulating in memory
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
            console.error(
              `❌ Failed to send to ${recipient.phone}: ${error.message}`
            );

            // Add to bulk update operations
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
        } catch (error) {
          console.error("Failed to update campaign metrics:", error);
          // Continue processing even if metrics update fails
        }

        console.log(
          `✅ Batch completed: ${sentCount} sent, ${failedCount} failed`
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
          await sessionHealthService.requeueJobDueToSessionFailure(
            job,
            `Session error: ${error.message}`,
            30000 // 30 second delay
          );
          return { requeuedDueToSessionFailure: true };
        }

        // For other errors, let the job fail and retry
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

        // Check rate limit
        const messageRateLimitResult = await defaultRateLimiter.checkAndConsume(
          userId,
          1
        );

        if (!messageRateLimitResult.allowed) {
          console.log(
            `⏳ Rate limit reached for user ${userId}, requeuing message with ${messageRateLimitResult.waitTime}ms delay`
          );

          // Requeue the message with delay
          await campaignQueue.add("send-message", job.data, {
            delay: Math.max(0, Number(messageRateLimitResult.waitTime) || 0),
            attempts: Math.max(
              1,
              Number.isFinite(
                Number((job.opts.attempts ?? 3) - job.attempts + 1)
              )
                ? (job.opts.attempts ?? 3) - job.attempts + 1
                : 3
            ),
            backoff: { type: "exponential", delay: 5000 },
          });

          return { requeuedDueToRateLimit: true };
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

        // Check rate limit before sending
        const singleMessageRateLimitResult =
          await defaultRateLimiter.checkAndConsume(userId, 1);

        if (!singleMessageRateLimitResult.allowed) {
          console.log(
            `⏳ Rate limit reached for user ${userId}, requeuing message with ${singleMessageRateLimitResult.waitTime}ms delay`
          );

          // Requeue the message with delay
          await campaignQueue.add("send-message", job.data, {
            delay: singleMessageRateLimitResult.waitTime,
            attempts: job.opts.attempts - job.attempts + 1,
            backoff: { type: "exponential", delay: 5000 },
          });

          return { requeuedDueToRateLimit: true };
        }

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
    concurrency: 1, // Start with lower concurrency
    removeOnComplete: false, // Keep completed jobs for debugging
    removeOnFail: false, // Keep failed jobs for debugging
    stalledInterval: 30000,
    maxStalledCount: 1,
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

// Check queue status every 30 seconds
setInterval(getQueueStatus, 30000);

// Dynamic concurrency adjustment every 2 minutes
setInterval(async () => {
  try {
    const systemMetrics = await dynamicConfigService.getSystemMetrics();
    const adaptiveConcurrency =
      await dynamicConfigService.getAdaptiveConcurrency(systemMetrics);

    if (adaptiveConcurrency !== campaignWorker.opts.concurrency) {
      console.log(
        `🔄 Adjusting worker concurrency from ${campaignWorker.opts.concurrency} to ${adaptiveConcurrency}`
      );
      campaignWorker.opts.concurrency = adaptiveConcurrency;
    }
  } catch (error) {
    console.error("Failed to adjust worker concurrency:", error);
  }
}, 120000); // 2 minutes
