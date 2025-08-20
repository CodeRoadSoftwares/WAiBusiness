import express from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import WhatsappController from "./whatsapp.controller.js";

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

export default router;
