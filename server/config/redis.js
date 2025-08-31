import { Redis } from "ioredis";

const redisConnection = new Redis({
  host: "127.0.0.1",
  port: 6379,
  maxRetriesPerRequest: null, // REQUIRED by BullMQ
  enableReadyCheck: false, // Good for small servers
});

redisConnection.on("connect", () => {
  console.log("🔗 Redis connected successfully");
});

redisConnection.on("ready", () => {
  console.log("✅ Redis ready to accept commands");
});

redisConnection.on("error", (err) => {
  console.error("❌ Redis connection error:", err);
});

redisConnection.on("close", () => {
  console.warn("⚠️ Redis connection closed");
});

redisConnection.on("reconnecting", () => {
  console.log("🔄 Redis reconnecting...");
});

export default redisConnection;
