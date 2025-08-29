import { CampaignRepository } from "../repositories/campaign.repository.js";

const getCampaignByIdManager = async (campaignId) => {
  try {
    const campaign = await CampaignRepository.getCampaignById(campaignId);
    return campaign;
  } catch (error) {
    throw new Error(`Failed to get campaign by id: ${error.message}`);
  }
};

export default getCampaignByIdManager;
