import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import express from "express";
import { campaignQueue } from "./src/queue/queues/campaign.queue.js";

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [new BullMQAdapter(campaignQueue)],
  serverAdapter: serverAdapter,
});

const app = express();

// Add the Bull Board UI
app.use("/admin/queues", serverAdapter.getRouter());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const PORT = 3001;

app.listen(PORT, () => {
  console.log(
    `🖥️  BullMQ Dashboard running at: http://localhost:${PORT}/admin/queues`
  );
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`\n🎯 Available actions:`);
  console.log(`   - View all jobs (waiting, active, completed, failed)`);
  console.log(`   - Clean individual job types`);
  console.log(`   - Retry failed jobs`);
  console.log(`   - Remove specific jobs`);
  console.log(`   - View job details and logs`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down BullMQ Dashboard...");
  process.exit(0);
});
