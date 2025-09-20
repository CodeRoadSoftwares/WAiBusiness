import { Queue } from "bullmq";
import redis from "../../../config/redis.js";

export const directMessageQueue = new Queue("directMessageQueue", {
  connection: redis,
});
