import express from "express";
import {
  getPresenceStates,
  forceUserOffline,
} from "../controllers/presenceDebug.controller.js";
import { flexibleAuth } from "../../../middlewares/apiAuth.middleware.js";

const router = express.Router();

// Debug routes (protected by authentication)
router.get("/presence/states", flexibleAuth, getPresenceStates);
router.post("/presence/force-offline/:userId", flexibleAuth, forceUserOffline);

export default router;
