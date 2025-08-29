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

export const CampaignController = {
  createCampaign,
};
