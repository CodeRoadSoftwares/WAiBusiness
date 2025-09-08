import Campaign from "../../campaign.model.js";

export const getCampaignById = async (campaignId) => {
  try {
    const campaign = await Campaign.findById(campaignId);
    return campaign;
  } catch (error) {
    throw new Error(`Failed to get campaign by id: ${error.message}`);
  }
};
