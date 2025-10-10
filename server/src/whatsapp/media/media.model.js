import mongoose from "mongoose";

const MediaSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    url: { type: String },
    s3Key: { type: String },
    type: { type: String, enum: ["image", "video", "audio", "document"] },
    caption: { type: String },
    fileName: { type: String },
    mimeType: { type: String },
  },
  { timestamps: true }
);

MediaSchema.index({ url: 1, s3Key: 1 });

export default mongoose.model("Media", MediaSchema);
