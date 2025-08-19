import { Schema, model } from "mongoose";

const whatsappSessionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    deviceId: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    sessionId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "active",
        "disconnected",
        "banned",
        "suspended",
        "expired",
        "blocked",
      ],
      default: "disconnected",
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    lastConnected: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const whatsappSessionModel = model("WhatsappSession", whatsappSessionSchema);

export default whatsappSessionModel;
