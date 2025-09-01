import express from "express";
import { TemplateController } from "./template.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { uploadMedia } from "../../middlewares/fileUpload.middleware.js";

const router = express.Router();

router.get("/", requireAuth, TemplateController.getTemplates);
router.get("/count", requireAuth, TemplateController.getTemplatesCount);
router.post(
  "/create",
  requireAuth,
  // Handle media file uploads for templates using existing middleware
  uploadMedia.single("mediaFile"),
  TemplateController.createTemplate
);

export default router;
