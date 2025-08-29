import { Redis } from "ioredis";

const redisConnection = new Redis({
  host: "127.0.0.1",
  port: 6379,
  maxRetriesPerRequest: null, // REQUIRED by BullMQ
  enableReadyCheck: false, // Good for small servers
});

export default redisConnection;
