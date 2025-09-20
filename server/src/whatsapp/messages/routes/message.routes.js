import express from "express";
import { requireAuth } from "../../../middlewares/auth.middleware";
import { MessageController } from "../controllers/message.controller";

const router = express.Router();

router.get("/sent-number", requireAuth, MessageController.getNumOfSentMessages);

export default router;
