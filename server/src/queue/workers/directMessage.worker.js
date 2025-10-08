import { Worker } from "bullmq";
import redis from "../../../config/redis.js";
import { sessionHealthService } from "../../whatsapp/sessions/services/sessionHealth.service.js";
import { DirectMessageService } from "../../whatsapp/messages/services/directMessage.service.js";

export const directMessageWorker = new Worker(
  "directMessageQueue",
  async (job) => {
    if (job.name === "send-direct-message") {
      try {
        const { messageId, userId, priority } = job.data;

        // Process the direct message
        await DirectMessageService.processMessage(job);

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

export const getDirectMessageQueueStatus = async () => {
  try {
    const waiting = await directMessageQueue.getWaiting();
    const active = await directMessageQueue.getActive();
    const delayed = await directMessageQueue.getDelayed();
    const completed = await directMessageQueue.getCompleted();
    const failed = await directMessageQueue.getFailed();

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
          `   - Job ${job.id}: ${job.name} (${job.data.messageId}) - Delay: ${job.delay}ms`
        );
      });
    }

    return { waiting, active, delayed, completed, failed };
  } catch (error) {
    console.error(`❌ Error getting direct message queue status:`, error);
    return null;
  }
};
