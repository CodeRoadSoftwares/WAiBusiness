import mongoose from "mongoose";

const RecipientSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true },
    name: { type: String },
    tags: { type: [String] },
    variables: { type: Map, of: String },
  },
  { _id: false }
);

const AudienceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    description: { type: String },
    recipients: [RecipientSchema],
    count: { type: Number, default: 0 }, // Add count field
    lastUsed: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Pre-save hook to set the count field based on recipients length
AudienceSchema.pre("save", function (next) {
  if (Array.isArray(this.recipients)) {
    this.count = this.recipients.length;
  } else {
    this.count = 0;
  }
  next();
});

export default mongoose.model("Audience", AudienceSchema);
