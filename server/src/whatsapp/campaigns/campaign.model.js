import mongoose from "mongoose";

const { Schema } = mongoose;

/** Per-recipient delivery state (per variant) */
const RecipientSchema = new Schema(
  {
    phone: { type: String, required: true },
    name: { type: String },
    variables: { type: Map, of: String }, // dynamic placeholders per recipient

    status: {
      type: String,
      enum: ["pending", "sent", "delivered", "read", "failed"],
      default: "pending",
      index: true,
    },
    lastError: { type: String },
    sentAt: { type: Date },
    deliveredAt: { type: Date },
    readAt: { type: Date },
    retries: { type: Number, default: 0 },

    response: { type: Schema.Types.Mixed }, // WA API response
    reply: { type: Schema.Types.Mixed }, // Reply from the recipient
  },
  { _id: false }
);

const MediaSchema = new Schema(
  {
    url: { type: String },
    type: { type: String, enum: ["image", "video", "audio", "document"] },
    caption: { type: String },
    fileName: { type: String },
    mimeType: { type: String },
  },
  { _id: false }
);

/** A single message variant (A/B or single) */
const MessageVariantSchema = new Schema(
  {
    variantName: { type: String, required: true, default: "Single" }, // e.g., "A", "B" (or "Single" when not A/B)
    type: {
      type: String,
      enum: ["text", "media", "template", "mixed"],
      required: true,
    },

    // content (use what’s relevant given `type`)
    message: { type: String }, // for text/mixed
    media: MediaSchema, // for media/mixed
    templateId: { type: Schema.Types.ObjectId, ref: "Template" }, // when using template
    templateParams: { type: Map, of: String }, // optional global params

    // recipients assigned to this variant at creation time
    recipients: [RecipientSchema],

    // per-variant metrics
    metrics: {
      totalRecipients: { type: Number, required: true },
      sent: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      read: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
    },

    // optional throttling overrides per variant
    rateLimit: {
      messagesPerMinute: { type: Number },
      maxRetries: { type: Number },
      randomDelay: { type: Boolean },
    },
  },
  { _id: false }
);

/** Campaign-level schema */
const CampaignSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: { type: String, required: true },
    description: { type: String },
    campaignType: {
      type: String,
      enum: ["marketing", "transactional", "notification", "reminder", "other"],
      default: "marketing",
      required: true,
    },

    /**
     * Strategy defines whether we’re doing single message or A/B,
     * how to split traffic, when/how to pick a winner, etc.
     */
    strategy: {
      mode: {
        type: String,
        enum: ["single", "ab", "multivariate"],
        default: "single",
        required: true,
      },

      // how to allocate recipients when `mode` = "ab"
      allocation: {
        type: String,
        enum: ["uniform", "weighted", "round_robin", "deterministicHash"],
      },

      // only used when allocation = "weighted"
      weights: [
        {
          variantName: { type: String, required: true },
          weight: { type: Number, required: true, min: 0 },
          _id: false,
        },
      ],

      // % of total audience to use for initial test (then promote winner)
      sampleSizePercent: { type: Number, min: 1, max: 100 },

      // how to pick a winner automatically (optional)
      winningCriteria: {
        type: String,
        enum: [
          "highestDelivered",
          "highestRead",
          "highestReply",
          "lowestFail",
          "custom",
        ],
      },
      evaluationWindowMinutes: { type: Number, default: 60 }, // wait time in minutes before choosing winner
      autoPromoteWinner: { type: Boolean, default: false }, // send winner to remaining audience

      // gradual sending/ramp-up to avoid flags (optional)
      rampUp: {
        enabled: { type: Boolean, default: false },
        plan: [
          {
            atPercentSent: { type: Number, min: 0, max: 100, required: true },
            delayMinutes: { type: Number, min: 0, required: true },
            _id: false,
          },
        ],
        delayType: {
          type: String,
          enum: ["random", "exponential"],
          default: "random",
        },
        delayValue: { type: Number, default: 0 }, // delay in minutes
      },
    },

    /**
     * Variants array:
     *  - For single-mode, include exactly one variant (e.g., variantName "Single" or "A")
     *  - For A/B, include 2+ variants with recipients pre-assigned at creation time
     */
    messageVariants: {
      type: [MessageVariantSchema],
      validate: {
        validator(arr) {
          if (!Array.isArray(arr) || arr.length === 0) return false;
          const mode = this?.strategy?.mode || "single";
          if (mode === "single") return arr.length === 1;
          if (mode === "ab") return arr.length >= 2;
          return true;
        },
        message:
          "messageVariants must have exactly 1 variant when strategy.mode='single', or at least 2 when 'ab'.",
      },
    },

    // Optional: reference to an Audience used as the source list (for audit)
    existingAudienceId: { type: Schema.Types.ObjectId, ref: "Audience" },

    // Scheduling
    scheduleType: {
      type: String,
      enum: ["immediate", "scheduled", "delayed"],
      default: "immediate",
    },
    scheduledDate: { type: String }, // when to start (if scheduled) - stored as local time string
    timeZone: { type: String, default: "IST" },
    customDelay: { type: Number, default: 0 },
    delayUnit: {
      type: String,
      enum: ["minutes", "hours", "days"],
      default: "minutes",
    },

    // Campaign status
    status: {
      type: String,
      enum: ["draft", "scheduled", "running", "paused", "completed", "failed"],
      default: "draft",
      index: true,
    },

    // Campaign-level default throttling (variants can override)
    rateLimit: {
      messagesPerMinute: { type: Number, default: 20 },
      maxRetries: { type: Number, default: 3 },
      randomDelay: { type: Boolean, default: true },
    },

    // Rollup metrics (sum of variants)
    metrics: {
      totalRecipients: { type: Number, default: 0 },
      sent: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      read: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
    },

    // Audit
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

/** Useful indexes */
CampaignSchema.index({ userId: 1, status: 1, createdAt: -1 });

/**
 * Pre-save hook to set metrics.totalRecipients as the sum of all messageVariants' metrics.totalRecipients
 */
CampaignSchema.pre("save", function (next) {
  if (Array.isArray(this.messageVariants)) {
    const sum = this.messageVariants.reduce((acc, variant) => {
      // Defensive: handle missing metrics or totalRecipients
      const variantTotal = variant?.metrics?.totalRecipients || 0;
      return acc + variantTotal;
    }, 0);
    if (!this.metrics) this.metrics = {};
    this.metrics.totalRecipients = sum;
  }
  next();
});

export default mongoose.model("Campaign", CampaignSchema);
