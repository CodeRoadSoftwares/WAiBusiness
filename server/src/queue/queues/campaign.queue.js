import { Queue } from "bullmq";
import redis from "../../../config/redis.js";

export const campaignQueue = new Queue("campaignQueue", { connection: redis });
