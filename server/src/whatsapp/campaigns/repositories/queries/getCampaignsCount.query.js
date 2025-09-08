import Campaign from "../../campaign.model.js";
import mongoose from "mongoose";

export const getCampaignsCount = async (userId, query = {}) => {
  try {
    const userObjId = new mongoose.Types.ObjectId(userId);

    // Build match conditions based on filters
    const matchConditions = { userId: userObjId };

    // Apply the same filters as getCampaigns
    if (query.status && query.status !== "all") {
      matchConditions.status = query.status;
    }

    if (query.campaignType && query.campaignType !== "all") {
      matchConditions.campaignType = query.campaignType;
    }

    if (query.strategyMode && query.strategyMode !== "all") {
      matchConditions["strategy.mode"] = query.strategyMode;
    }

    if (query.scheduleType && query.scheduleType !== "all") {
      matchConditions.scheduleType = query.scheduleType;
    }

    if (query.startDate || query.endDate) {
      matchConditions.createdAt = {};
      if (query.startDate) {
        matchConditions.createdAt.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        matchConditions.createdAt.$lte = new Date(query.endDate);
      }
    }

    if (query.minRecipients || query.maxRecipients) {
      matchConditions["metrics.totalRecipients"] = {};
      if (query.minRecipients) {
        matchConditions["metrics.totalRecipients"].$gte = parseInt(
          query.minRecipients
        );
      }
      if (query.maxRecipients) {
        matchConditions["metrics.totalRecipients"].$lte = parseInt(
          query.maxRecipients
        );
      }
    }

    if (query.minMetrics || query.maxMetrics) {
      const metricFields = ["sent", "delivered", "read", "failed"];
      metricFields.forEach((field) => {
        if (query.minMetrics?.[field] || query.maxMetrics?.[field]) {
          matchConditions[`metrics.${field}`] = {};
          if (query.minMetrics?.[field]) {
            matchConditions[`metrics.${field}`].$gte = parseInt(
              query.minMetrics[field]
            );
          }
          if (query.maxMetrics?.[field]) {
            matchConditions[`metrics.${field}`].$lte = parseInt(
              query.maxMetrics[field]
            );
          }
        }
      });
    }

    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), "i");
      matchConditions.$or = [
        { name: searchRegex },
        { description: searchRegex },
      ];
    }

    // Aggregate to get counts by type and total in one query
    const result = await Campaign.aggregate([
      { $match: matchConditions },
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
