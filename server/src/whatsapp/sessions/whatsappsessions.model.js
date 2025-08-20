// File: whatsappsessions.model.js

import { Schema, model } from "mongoose";

const whatsappSessionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    sessionCreds: { type: Object, default: null },
    sessionKeys: { type: Object, default: {} },
    phoneNumber: {
      type: String,
      index: true,
    },
    status: {
      type: String,
      enum: ["pairing", "connected", "disconnected", "timeout", "error"],
      default: "disconnected",
      index: true,
    },
    lastConnected: {
      type: Date,
      default: Date.now,
    },
    errorReason: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const WhatsappSession = model("WhatsappSession", whatsappSessionSchema);

export default WhatsappSession;
