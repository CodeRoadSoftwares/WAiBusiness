import { CampaignManager } from "./managers/campaign.manager.js";
import { launchCampaign } from "./services/launchCampaign.service.js";

const createCampaign = async (req, res) => {
  try {
    // validate required fields
    if (
      !req.body.name ||
      !req.body.campaignType ||
      (req.body.audienceType === "upload" && !req.files?.audienceFile) ||
      (req.body.audienceType === "existing" && !req.body.existingAudienceId) ||
      (req.body.audienceType === "manual" &&
        !req.body.manualPhoneNumbers?.trim()) ||
      (req.body.messageType === "text" && !req.body.messageContent) ||
      (req.body.messageType === "media" && !req.files?.mediaFile) ||
      (req.body.messageType === "template" && !req.body.templateId) ||
      (req.body.messageType === "mixed" &&
        (!req.body.messageContent || !req.files?.mediaFile))
    ) {
      return res.status(400).json({
        error: "Missing required fields",
        details: {
          name: !req.body.name,
          campaignType: !req.body.campaignType,
          audienceFile:
            req.body.audienceType === "upload" && !req.files?.audienceFile,
          existingAudienceId:
            req.body.audienceType === "existing" &&
            !req.body.existingAudienceId,
          manualPhoneNumbers:
            req.body.audienceType === "manual" &&
            !req.body.manualPhoneNumbers?.trim(),
          messageContent:
            (req.body.messageType === "text" ||
              req.body.messageType === "mixed") &&
            !req.body.messageContent,
          mediaFile:
            (req.body.messageType === "media" ||
              req.body.messageType === "mixed") &&
            !req.files?.mediaFile,
          templateId:
            req.body.messageType === "template" && !req.body.templateId,
        },
      });
    }

    console.log("req.body:", req.body);

    // Create campaign with files
    const result = await CampaignManager.createCampaignManager(
      req.user.id,
      req.body,
      req.files
    );

    await launchCampaign(result.campaign._id);

    res.status(201).json({
      success: true,
      message: "Campaign created successfully",
      data: result,
    });
  } catch (error) {
    console.error("Campaign creation error:", error);
    res.status(500).json({
      error: "Failed to create campaign",
      message: error.message,
    });
  }
};

const getCampaigns = async (req, res) => {
  try {
    // Extract query parameters with defaults
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
    } = req.query;

    // Validate and parse numeric parameters
    const parsedPage = Math.max(1, parseInt(page) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit) || 10));

    // Parse metrics filters
    let parsedMinMetrics, parsedMaxMetrics;
    if (minMetrics) {
      try {
        parsedMinMetrics =
          typeof minMetrics === "string" ? JSON.parse(minMetrics) : minMetrics;
      } catch (e) {
        return res.status(400).json({
          error: "Invalid minMetrics format. Expected JSON object.",
          message:
            "minMetrics should be a valid JSON object with fields like: {sent: 10, delivered: 5}",
        });
      }
    }

    if (maxMetrics) {
      try {
        parsedMaxMetrics =
          typeof maxMetrics === "string" ? JSON.parse(maxMetrics) : maxMetrics;
      } catch (e) {
        return res.status(400).json({
          error: "Invalid maxMetrics format. Expected JSON object.",
          message:
            "maxMetrics should be a valid JSON object with fields like: {sent: 100, delivered: 50}",
        });
      }
    }

    const query = {
      page: parsedPage,
      limit: parsedLimit,
      search: search.trim(),
      status,
      campaignType,
      strategyMode,
      scheduleType,
      sortBy,
      sortOrder: sortOrder.toLowerCase(),
      startDate,
      endDate,
      minRecipients: minRecipients ? parseInt(minRecipients) : undefined,
      maxRecipients: maxRecipients ? parseInt(maxRecipients) : undefined,
      minMetrics: parsedMinMetrics,
      maxMetrics: parsedMaxMetrics,
    };

    // Get campaigns with filters
    const campaigns = await CampaignManager.getCampaignsManager(
      req.user.id,
      query
    );

    // Get filtered count for pagination
    const countResult = await CampaignManager.getCampaignsCountManager(
      req.user.id,
      query
    );

    // Calculate pagination info
    const totalPages = Math.ceil(countResult.filtered / parsedLimit);
    const hasNextPage = parsedPage < totalPages;
    const hasPrevPage = parsedPage > 1;

    res.status(200).json({
      success: true,
      message: "Campaigns fetched successfully",
      data: {
        campaigns,
        pagination: {
          currentPage: parsedPage,
          totalPages,
          totalItems: countResult.filtered,
          itemsPerPage: parsedLimit,
          hasNextPage,
          hasPrevPage,
        },
        filters: {
          applied: query,
          available: {
            statuses: [
              "draft",
              "scheduled",
              "running",
              "paused",
              "completed",
              "failed",
            ],
            campaignTypes: [
              "marketing",
              "transactional",
              "notification",
              "reminder",
              "other",
            ],
            strategyModes: ["single", "ab", "multivariate"],
            scheduleTypes: ["immediate", "scheduled", "delayed"],
            sortableFields: [
              "name",
              "createdAt",
              "updatedAt",
              "scheduledDate",
              "metrics.totalRecipients",
              "metrics.sent",
              "metrics.delivered",
              "metrics.read",
              "metrics.failed",
            ],
          },
        },
        counts: countResult,
      },
    });
  } catch (error) {
    console.error("Get campaigns error:", error);
    res.status(500).json({
      error: "Failed to get campaigns",
      message: error.message,
    });
  }
};

const getCampaignsCount = async (req, res) => {
  try {
    const campaignsCount = await CampaignManager.getCampaignsCountManager(
      req.user.id
    );
    res.status(200).json({
      success: true,
      data: campaignsCount,
    });
  } catch (error) {
    console.error("Campaigns count error:", error);
    res.status(500).json({
      error: "Failed to get campaigns count",
      message: error.message,
    });
  }
};

export const CampaignController = {
  createCampaign,
  getCampaigns,
  getCampaignsCount,
};
