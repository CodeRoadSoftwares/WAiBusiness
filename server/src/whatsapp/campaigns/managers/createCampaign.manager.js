import { CampaignRepository } from "../repositories/campaign.repository.js";
import { TransactionManager } from "../../../utils/transaction.util.js";

const createCampaignManager = async (campaignData) => {
  try {
    const campaign = await TransactionManager.executeTransaction(
      async (session) => {
        // validate campaign data
        if (!campaignData.name || !campaignData.type) {
          throw new Error("Missing required fields");
        }

        // validate message data
        if (campaignData.type === "text" && !campaignData.message) {
          throw new Error("Message is required for text type");
        } else if (campaignData.type === "media" && !campaignData.media) {
          throw new Error("Media is required for media type");
        } else if (
          campaignData.type === "template" &&
          !campaignData.templateId
        ) {
          throw new Error("Template ID is required for template type");
        }

        const campaign = await CampaignRepository.createCampaign(
          campaignData,
          session
        );

        return campaign;
      }
    );

    return campaign;
  } catch (error) {
    throw new Error(`Failed to create campaign: ${error.message}`);
  }
};

export default createCampaignManager;
