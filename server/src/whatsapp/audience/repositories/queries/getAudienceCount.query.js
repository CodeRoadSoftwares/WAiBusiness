import Audience from "../../audience.model.js";
import mongoose from "mongoose";

export const getAudienceCount = async (userId) => {
  try {
    // Convert userId to ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Use a single aggregation to get both audience count and total contacts
    const result = await Audience.aggregate([
      { $match: { userId: userObjectId } },
      {
        $group: {
          _id: null,
          audienceCount: { $sum: 1 },
          totalContacts: { $sum: "$count" },
        },
      },
    ]);

    const audienceCount = result.length > 0 ? result[0].audienceCount : 0;
    const totalContacts = result.length > 0 ? result[0].totalContacts : 0;

    return {
      audienceCount,
      totalContacts,
    };
  } catch (error) {
    throw new Error(
      `Failed to get audience and contact count: ${error.message}`
    );
  }
};
