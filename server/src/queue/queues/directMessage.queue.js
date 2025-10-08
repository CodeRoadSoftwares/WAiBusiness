import { Queue } from "bullmq";
import redis from "../../../config/redis.js";

export const directMessageQueue = new Queue("directMessageQueue", {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  },
  settings: {
    stalledInterval: 15000,
    maxStalledCount: 2,
  },
});
