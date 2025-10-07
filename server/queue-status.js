import { campaignQueue } from "./src/queue/queues/campaign.queue.js";

async function checkQueueStatus() {
  try {
    console.log("📊 Campaign Queue Status:");
    console.log("=".repeat(40));

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      campaignQueue.getWaiting(),
      campaignQueue.getActive(),
      campaignQueue.getCompleted(),
      campaignQueue.getFailed(),
      campaignQueue.getDelayed(),
    ]);

    console.log(`⏳ Waiting: ${waiting.length}`);
    console.log(`🔄 Active: ${active.length}`);
    console.log(`✅ Completed: ${completed.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    console.log(`⏰ Delayed: ${delayed.length}`);

    if (active.length > 0) {
      console.log("\n🔄 Active Jobs:");
      active.forEach((job, index) => {
        console.log(`   ${index + 1}. Job ${job.id}: ${job.name}`);
        console.log(`      Data: ${JSON.stringify(job.data, null, 2)}`);
        console.log(`      Progress: ${job.progress}%`);
      });
    }

    if (failed.length > 0) {
      console.log("\n❌ Failed Jobs:");
      failed.forEach((job, index) => {
        console.log(`   ${index + 1}. Job ${job.id}: ${job.name}`);
        console.log(`      Error: ${job.failedReason}`);
        console.log(`      Attempts: ${job.attemptsMade}/${job.opts.attempts}`);
      });
    }

    if (delayed.length > 0) {
      console.log("\n⏰ Delayed Jobs:");
      delayed.forEach((job, index) => {
        const delayMs = job.delay;
        const delaySeconds = Math.round(delayMs / 1000);
        console.log(
          `   ${index + 1}. Job ${job.id}: ${job.name} (${delaySeconds}s delay)`
        );
      });
    }
  } catch (error) {
    console.error("❌ Error checking queue status:", error);
  } finally {
    process.exit(0);
  }
}

checkQueueStatus();
