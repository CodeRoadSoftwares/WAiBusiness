import { Worker } from "bullmq";
import redis from "../../../config/redis.js";
import { directMessageQueue } from "../queues/directMessage.queue.js";
import { sendMessage } from "../../whatsapp/messages/services/messageSender.service.js";
import { defaultRateLimiter } from "../../utils/rateLimiter.util.js";
import { sessionHealthService } from "../../whatsapp/sessions/services/sessionHealth.service.js";
import { DirectMessageService } from "../../whatsapp/messages/services/directMessage.service.js";

export const directMessageWorker = new Worker(
  "directMessageQueue",
  async (job) => {
    if (job.name === "send-direct-message") {
      try {
        const { messageId, userId, priority } = job.data;

        // Check session health before processing
        const sessionResult = await sessionHealthService.getHealthySession(
          userId,
          3
        );

        if (!sessionResult.success) {
          console.log(
            `⚠️ No healthy session for user ${userId}, requeuing direct message`
          );
          throw new Error("No healthy session available");
        }

        // Check rate limits
        const rateLimitResult = await defaultRateLimiter.checkAndConsume(
          userId,
          1
        );

        if (!rateLimitResult.allowed) {
          console.log(
            `⏳ Rate limit reached for user ${userId}, requeuing direct message with ${rateLimitResult.waitTime}ms delay`
          );

          // Requeue the direct message with delay
          await directMessageQueue.add("send-direct-message", job.data, {
            delay: Math.max(0, Number(rateLimitResult.waitTime) || 0),
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

          return;
        }

        // Process the direct message
        await DirectMessageService.processMessage(messageId);

        console.log(`✅ Direct message ${messageId} processed successfully`);
      } catch (error) {
        console.error(`❌ Error processing direct message:`, error.message);
        throw error;
      }
    }
  },
  {
    connection: redis,
    concurrency: 2,
    removeOnComplete: false,
    removeOnFail: false,
    stalledInterval: 30000,
    maxStalledCount: 1,
  }
);

directMessageWorker.on("completed", (job) =>
  console.log(`✅ Direct message job ${job.id} completed`)
);
directMessageWorker.on("failed", (job, err) =>
  console.error(`❌ Direct message job ${job.id} failed: ${err.message}`)
);
directMessageWorker.on("error", (err) =>
  console.error(`💥 Direct message worker error: ${err.message}`)
);
directMessageWorker.on("stalled", (jobId) =>
  console.warn(`⚠️ Direct message job ${jobId} stalled`)
);

console.log("🚀 Direct message worker started and listening for jobs");
