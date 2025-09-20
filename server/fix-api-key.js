import mongoose from "mongoose";
import User from "./src/users/user.model.js";
import crypto from "crypto";

async function fixAPIKey() {
  try {
    await mongoose.connect("mongodb://localhost:27017/waibusiness");
    console.log("✅ Connected to MongoDB");

    // Generate a 32-character API key
    const apiKey = crypto.randomBytes(16).toString("hex");
    console.log("🔑 Generated API key:", apiKey);
    console.log("📏 API key length:", apiKey.length);

    // Update the user
    const user = await User.findOne({ email: "mouzinmonis@gmail.com" });
    if (user) {
      user.apiKey = apiKey;
      await user.save();
      console.log("✅ User updated with new API key");
      console.log("👤 User ID:", user._id);
    } else {
      console.log("❌ User not found");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

fixAPIKey();
