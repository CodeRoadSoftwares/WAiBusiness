import Template from "../../template.model.js";
import mongoose from "mongoose";

export const getTemplateCount = async (userId) => {
  try {
    const userObjId = new mongoose.Types.ObjectId(userId);

    // Aggregate to get counts by type and total in one query
    const result = await Template.aggregate([
      { $match: { userId: userObjId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          text: {
            $sum: {
              $cond: [{ $eq: ["$type", "text"] }, 1, 0],
            },
          },
          media: {
            $sum: {
              $cond: [{ $eq: ["$type", "media"] }, 1, 0],
            },
          },
          mixed: {
            $sum: {
              $cond: [{ $eq: ["$type", "mixed"] }, 1, 0],
            },
          },
        },
      },
    ]);

    console.log("template count result", result);

    // If no templates, return zeros
    if (!result.length) {
      return { total: 0, text: 0, media: 0, mixed: 0 };
    }

    const { total, text, media, mixed } = result[0];
    return { total, text, media, mixed };
  } catch (error) {
    throw new Error(`Failed to get template count: ${error.message}`);
  }
};
