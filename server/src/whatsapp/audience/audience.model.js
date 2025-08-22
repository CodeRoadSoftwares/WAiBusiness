import mongoose from "mongoose";

const RecipientSchema = new mongoose.Schema(
  {
    phoneNumber: { type: String, required: true },
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
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("Audience", AudienceSchema);
