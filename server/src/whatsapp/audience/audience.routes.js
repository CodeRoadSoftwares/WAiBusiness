import express from "express";
import { AudienceController } from "./audience.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", requireAuth, AudienceController.getAudience);
router.get("/count", requireAuth, AudienceController.getAudienceCount);

export default router;
