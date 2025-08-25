import mongoose from "mongoose";

const MediaSchema = new mongoose.Schema(
  {
    url: { type: String },
    type: { type: String, enum: ["image", "video", "audio", "document"] },
    caption: { type: String },
    fileName: { type: String },
    mimeType: { type: String },
  },
  { _id: false }
);

const TemplateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: { type: String, required: true },
  description: { type: String },
  type: {
    type: String,
    enum: ["text", "media", "template", "mixed"],
    required: true,
  },
  text: { type: String },
  media: { type: MediaSchema },
  variables: { type: [String], default: [] },
  lastUsed: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

TemplateSchema.index({ userId: 1, name: 1 });

export default mongoose.model("Template", TemplateSchema);
