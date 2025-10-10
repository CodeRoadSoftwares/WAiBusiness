import express from "express";
import { uploadMultiple } from "../../services/s3.service.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import {
  uploadMediaController,
  getMediaController,
} from "./media.controller.js";

const router = express.Router();

// GET /media - Fetch media with pagination
router.get("/", requireAuth, getMediaController);

// POST /media/upload - Upload media files
router.post(
  "/upload",
  requireAuth,
  (req, res, next) => {
    uploadMultiple(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message || "Upload failed" });
      }
      next();
    });
  },
  uploadMediaController
);

export default router;
