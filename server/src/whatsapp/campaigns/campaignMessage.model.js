import mongoose from "mongoose";

const CampaignMessageSchema = new mongoose.Schema(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    variantName: {
      type: String,
      required: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      index: true,
    },
    name: { type: String },
    variables: { type: Map, of: String },
    status: {
      type: String,
      enum: ["pending", "processing", "sent", "delivered", "read", "failed", "skipped"],
      default: "pending",
      index: true,
    },
    lastError: { type: String },
    sentAt: { type: Date, index: true },
    deliveredAt: { type: Date },
    readAt: { type: Date },
    retries: { type: Number, default: 0 },
    response: { type: mongoose.Schema.Types.Mixed },
    reply: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Compound indexes for efficient queries
CampaignMessageSchema.index({ campaignId: 1, phone: 1 });
CampaignMessageSchema.index({ campaignId: 1, status: 1 });
CampaignMessageSchema.index({ userId: 1, status: 1 });
CampaignMessageSchema.index({ phone: 1, status: 1 });

export default mongoose.model("CampaignMessage", CampaignMessageSchema);
