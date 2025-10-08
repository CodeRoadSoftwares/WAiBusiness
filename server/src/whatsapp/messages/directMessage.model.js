import mongoose from "mongoose";

const { Schema } = mongoose;

const MediaSchema = new Schema(
  {
    url: { type: String, required: true },
    type: {
      type: String,
      enum: ["image", "video", "audio", "document"],
      required: true,
    },
    caption: { type: String },
    fileName: { type: String },
    mimeType: { type: String },
  },
  { _id: false }
);

const DirectMessageSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Message details
    phone: {
      type: String,
      required: true,
      index: true,
    },
    name: { type: String },

    // Message type and content
    type: {
      type: String,
      enum: ["text", "media", "template", "mixed"],
      required: true,
      index: true,
    },

    // Message classification for analytics and rate limiting
    messageType: {
      type: String,
      enum: [
        "notification",
        "transactional",
        "reminder",
        "promotional",
        "alert",
        "update",
      ],
      default: "notification",
      index: true,
    },

    // Content based on type
    message: { type: String }, // for text/mixed
    media: MediaSchema, // for media/mixed
    templateId: { type: Schema.Types.ObjectId, ref: "Template" }, // for template
    templateParams: { type: Map, of: String }, // for template variables

    // Message status
    status: {
      type: String,
      enum: ["pending", "sent", "delivered", "read", "failed", "skipped"],
      default: "pending",
      index: true,
    },

    // Error handling
    lastError: { type: String },
    retries: { type: Number, default: 0 },
    maxRetries: { type: Number, default: 3 },

    // Timing
    sentAt: { type: Date, index: true },
    deliveredAt: { type: Date },
    readAt: { type: Date },

    // WhatsApp response
    response: { type: Schema.Types.Mixed }, // WA API response
    reply: { type: Schema.Types.Mixed }, // Reply from recipient

    // Rate limiting and scheduling
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
      index: true,
    },
    scheduledFor: { type: Date, index: true },
    delayMs: { type: Number, default: 0 },

    // API request tracking
    requestId: { type: String, index: true }, // For tracking API requests
    source: {
      type: String,
      enum: ["api", "web", "webhook"],
      default: "api",
      index: true,
    },

    // Rate limiting context
    rateLimitContext: {
      messagesPerMinute: { type: Number, default: 20 },
      delayBetweenMessages: { type: Number, default: 2000 },
      randomDelay: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

// Indexes for efficient queries
DirectMessageSchema.index({ userId: 1, status: 1, createdAt: -1 });
DirectMessageSchema.index({ phone: 1, status: 1 });
DirectMessageSchema.index({ scheduledFor: 1, status: 1 });
DirectMessageSchema.index({ priority: 1, createdAt: 1 });
DirectMessageSchema.index({ requestId: 1 });
DirectMessageSchema.index({ messageType: 1, createdAt: -1 }); // For analytics by message type
DirectMessageSchema.index({ userId: 1, messageType: 1, status: 1 }); // For user analytics

// Pre-save hook to set scheduledFor if not provided
DirectMessageSchema.pre("save", function (next) {
  if (!this.scheduledFor && this.delayMs > 0) {
    this.scheduledFor = new Date(Date.now() + this.delayMs);
  }
  next();
});

export default mongoose.model("DirectMessage", DirectMessageSchema);
