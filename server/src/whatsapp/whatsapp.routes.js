import express from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import multer from "multer";
import WhatsappController from "./whatsapp.controller.js";
import { CampaignController } from "./campaigns/campaign.controller.js";
import {
  uploadCampaignFiles,
  uploadMedia,
} from "../middlewares/fileUpload.middleware.js";

const router = express.Router();

// Get current WhatsApp session status
router.get("/status", requireAuth, async (req, res) => {
  try {
    const session = await WhatsappController.getWhatsappSession(req.user.id);
    if (!session) {
      return res.json({ status: "disconnected" });
    }

    return res.json({
      status: session.status,
      phoneNumber: session.phoneNumber,
      name: session.sessionCreds?.me?.name,
      lastConnected: session.lastConnected,
      isActive: session.isActive,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Get all user's WhatsApp sessions (for future multi-session support)
router.get("/sessions", requireAuth, async (req, res) => {
  try {
    const sessions = await WhatsappController.getWhatsappSession(req.user.id);
    return res.json({ sessions: sessions ? [sessions] : [] });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Deactivate WhatsApp session
router.delete("/session", requireAuth, async (req, res) => {
  try {
    await WhatsappController.deactivateWhatsappSession(req.user.id);
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

//? /////////////////////////////////////////////////////////////////////
//? /////////////////////////////////////////////////////////////////////
//? /////////////////////////////////////////////////////////////////////
//? CAMPAIGN ROUTES
router.post(
  "/campaigns/create",
  requireAuth,
  // Handle both media files and audience files with correct storage
  uploadCampaignFiles.fields([
    { name: "mediaFile", maxCount: 1 },
    { name: "audienceFile", maxCount: 1 },
  ]),
  // Debug middleware to check what's received
  (req, res, next) => {
    if (req.files) {
      let totalFiles = 0;
      Object.keys(req.files).forEach((fieldName) => {
        const files = req.files[fieldName];
        totalFiles += files.length;
      });
    }
    next();
  },
  // Error handling middleware for multer
  (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      console.error("Multer error:", err);
      if (err.code === "LIMIT_FILE_COUNT") {
        return res.status(400).json({
          error: "Too many files",
          message: `Expected maximum 2 files, received ${err.message}`,
          details: {
            code: err.code,
            field: err.field,
            limit: err.limit,
          },
        });
      }
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          error: "File too large",
          message: `File size exceeds limit: ${err.message}`,
          details: {
            code: err.code,
            field: err.field,
            limit: err.limit,
          },
        });
      }
      return res.status(400).json({
        error: "File upload error",
        message: err.message,
        code: err.code,
      });
    }
    next();
  },
  CampaignController.createCampaign
);

// Get campaigns count
router.get(
  "/campaigns/count",
  requireAuth,
  CampaignController.getCampaignsCount
);

// Get campaigns with advanced filtering, searching, and sorting
router.get("/campaigns", requireAuth, CampaignController.getCampaigns);

export default router;
