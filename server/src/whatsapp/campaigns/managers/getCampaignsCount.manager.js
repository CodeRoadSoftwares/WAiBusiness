import { CampaignRepository } from "../repositories/campaign.repository.js";

const getCampaignsCountManager = async (userId) => {
  try {
    const campaignsCount = await CampaignRepository.getCampaignsCount(userId);
    return campaignsCount;
  } catch (error) {
    throw new Error(`Failed to get campaigns count: ${error.message}`);
  }
};

export default getCampaignsCountManager;
