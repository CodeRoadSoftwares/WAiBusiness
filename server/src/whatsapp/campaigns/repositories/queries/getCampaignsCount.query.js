import Campaign from "../../campaign.model.js";
import mongoose from "mongoose";

export const getCampaignsCount = async (userId) => {
  try {
    const userObjId = new mongoose.Types.ObjectId(userId);

    // Aggregate to get counts by type and total in one query
    const result = await Campaign.aggregate([
      { $match: { userId: userObjId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          draft: {
            $sum: {
              $cond: [{ $eq: ["$status", "draft"] }, 1, 0],
            },
          },
          scheduled: {
            $sum: {
              $cond: [{ $eq: ["$status", "scheduled"] }, 1, 0],
            },
          },
          running: {
            $sum: {
              $cond: [{ $eq: ["$status", "running"] }, 1, 0],
            },
          },
          paused: {
            $sum: {
              $cond: [{ $eq: ["$status", "paused"] }, 1, 0],
            },
          },
          completed: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
            },
          },
        },
      },
    ]);

    console.log("campaigns count result", result);

    // If no campaigns, return zeros
    if (!result.length) {
      return {
        total: 0,
        draft: 0,
        scheduled: 0,
        running: 0,
        paused: 0,
        completed: 0,
      };
    }

    const { total, draft, scheduled, running, paused, completed } = result[0];
    return { total, draft, scheduled, running, paused, completed };
  } catch (error) {
    throw new Error(`Failed to get campaigns count: ${error.message}`);
  }
};
