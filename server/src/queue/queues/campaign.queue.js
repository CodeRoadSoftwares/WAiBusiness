import { Queue } from "bullmq";
import redis from "../../../config/redis.js";

export const campaignQueue = new Queue("campaignQueue", {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 5,
    removeOnFail: 3,
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
