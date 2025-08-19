import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
    },
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    plan: {
      type: String,
      enum: ["free", "premium", "enterprise", "admin"],
      default: "free",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (this.isModified("passwordHash")) {
    try {
      const saltRounds = 10;
      this.passwordHash = await bcrypt.hash(this.passwordHash, saltRounds);
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  // bcrypt stores the salt in the hash, so we don't need to save it separately
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

const User = model("User", userSchema);

export default User;
