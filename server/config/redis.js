import { Redis } from "ioredis";

const isProduction = process.env.NODE_ENV === "production";

// Read host, port, password from environment variables
const REDIS_HOST = process.env.REDIS_HOST || "127.0.0.1";
const REDIS_PORT = process.env.REDIS_PORT
  ? parseInt(process.env.REDIS_PORT, 10)
  : 6379;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

const redisOptions = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: null, // REQUIRED by BullMQ
  enableReadyCheck: false, // Good for small servers
};

// Only set password if it exists (common in production)
if (isProduction && REDIS_PASSWORD) {
  redisOptions.password = REDIS_PASSWORD;
}

const redisConnection = new Redis(redisOptions);

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
