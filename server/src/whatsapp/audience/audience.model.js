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

// Pre-update hook to handle findOneAndUpdate, findByIdAndUpdate, etc.
AudienceSchema.pre(
  ["updateOne", "updateMany", "findOneAndUpdate", "findByIdAndUpdate"],
  function (next) {
    // Get the recipients array from the update operation
    const update = this.getUpdate();

    // If recipients are being updated, calculate the new count
    if (update.recipients !== undefined) {
      if (Array.isArray(update.recipients)) {
        update.count = update.recipients.length;
      } else {
        update.count = 0;
      }
    }

    // If using $push or $pull on recipients, we need to handle this differently
    if (update.$push && update.$push.recipients) {
      // For $push operations, we'll need to handle this in the post-update hook
      this.recipientsUpdated = true;
    }

    if (update.$pull && update.$pull.recipients) {
      // For $pull operations, we'll need to handle this in the post-update hook
      this.recipientsUpdated = true;
    }

    next();
  }
);

// Post-update hook to recalculate count after $push/$pull operations
AudienceSchema.post(
  ["updateOne", "updateMany", "findOneAndUpdate", "findByIdAndUpdate"],
  async function (result) {
    if (this.recipientsUpdated && result) {
      try {
        // Get the document ID from the result
        let docId;
        if (result._id) {
          docId = result._id;
        } else if (this._conditions && this._conditions._id) {
          docId = this._conditions._id;
        }

        if (docId) {
          // Fetch the updated document and recalculate count
          const updatedDoc = await this.model.findById(docId);
          if (updatedDoc) {
            updatedDoc.count = Array.isArray(updatedDoc.recipients)
              ? updatedDoc.recipients.length
              : 0;
            await updatedDoc.save();
          }
        }
      } catch (error) {
        console.error(
          "Error updating count after recipients modification:",
          error
        );
      }
    }
  }
);

export default mongoose.model("Audience", AudienceSchema);
