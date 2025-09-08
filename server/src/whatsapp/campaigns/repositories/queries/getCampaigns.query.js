import Campaign from "../../campaign.model.js";
import mongoose from "mongoose";

export const getCampaigns = async (userId, query = {}, session = null) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status,
      campaignType,
      strategyMode,
      scheduleType,
      sortBy = "createdAt",
      sortOrder = "desc",
      startDate,
      endDate,
      minRecipients,
      maxRecipients,
      minMetrics,
      maxMetrics,
    } = query;

    // Build match conditions
    const matchConditions = { userId: new mongoose.Types.ObjectId(userId) };

    // Status filter
    if (status && status !== "all") {
      matchConditions.status = status;
    }

    // Campaign type filter
    if (campaignType && campaignType !== "all") {
      matchConditions.campaignType = campaignType;
    }

    // Strategy mode filter
    if (strategyMode && strategyMode !== "all") {
      matchConditions["strategy.mode"] = strategyMode;
    }

    // Schedule type filter
    if (scheduleType && scheduleType !== "all") {
      matchConditions.scheduleType = scheduleType;
    }

    // Date range filter
    if (startDate || endDate) {
      matchConditions.createdAt = {};
      if (startDate) {
        matchConditions.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        matchConditions.createdAt.$lte = new Date(endDate);
      }
    }

    // Recipients count filter
    if (minRecipients || maxRecipients) {
      matchConditions["metrics.totalRecipients"] = {};
      if (minRecipients) {
        matchConditions["metrics.totalRecipients"].$gte =
          parseInt(minRecipients);
      }
      if (maxRecipients) {
        matchConditions["metrics.totalRecipients"].$lte =
          parseInt(maxRecipients);
      }
    }

    // Metrics filter (for sent, delivered, read, failed)
    if (minMetrics || maxMetrics) {
      const metricFields = ["sent", "delivered", "read", "failed"];
      metricFields.forEach((field) => {
        if (minMetrics?.[field] || maxMetrics?.[field]) {
          matchConditions[`metrics.${field}`] = {};
          if (minMetrics?.[field]) {
            matchConditions[`metrics.${field}`].$gte = parseInt(
              minMetrics[field]
            );
          }
          if (maxMetrics?.[field]) {
            matchConditions[`metrics.${field}`].$lte = parseInt(
              maxMetrics[field]
            );
          }
        }
      });
    }

    // Search in name and description
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      matchConditions.$or = [
        { name: searchRegex },
        { description: searchRegex },
      ];
    }

    // Build sort conditions
    const sortConditions = {};

    // Validate sortable fields
    const sortableFields = [
      "name",
      "createdAt",
      "updatedAt",
      "metrics.totalRecipients",
      "metrics.sent",
      "metrics.delivered",
      "metrics.read",
      "metrics.failed",
    ];

    if (sortableFields.includes(sortBy)) {
      sortConditions[sortBy] = sortOrder === "asc" ? 1 : -1;
    } else {
      // Default sort by createdAt
      sortConditions.createdAt = -1;
    }

    // Calculate skip value
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build aggregation pipeline
    const pipeline = [
      { $match: matchConditions },

      // Add computed fields for better sorting
      {
        $addFields: {
          // Calculate success rate for sorting
          successRate: {
            $cond: {
              if: { $gt: ["$metrics.totalRecipients", 0] },
              then: {
                $multiply: [
                  {
                    $divide: ["$metrics.delivered", "$metrics.totalRecipients"],
                  },
                  100,
                ],
              },
              else: 0,
            },
          },
        },
      },

      // Sort
      { $sort: sortConditions },

      // Pagination
      { $skip: skip },
      { $limit: parseInt(limit) },

      // Project final fields (exclude messageVariants for performance)
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          campaignType: 1,
          strategy: 1,
          status: 1,
          scheduleType: 1,
          scheduledDate: 1,
          timeZone: 1,
          metrics: 1,
          createdAt: 1,
          updatedAt: 1,
          // Include variant count and basic info
          variantCount: { $size: "$messageVariants" },
          firstVariantType: { $arrayElemAt: ["$messageVariants.type", 0] },
        },
      },
    ];

    // Execute aggregation with or without session
    const options = session ? { session } : {};
    const campaigns = await Campaign.aggregate(pipeline, options);

    return campaigns;
  } catch (error) {
    throw new Error(`Failed to get campaigns: ${error.message}`);
  }
};
