import Campaign from "../../campaign.model.js";

export const createCampaign = async (campaignData, session = null) => {
  try {
    if (session) {
      const campaign = await Campaign.create([campaignData], { session });

      if (campaign && campaign.length > 0) {
        return campaign[0];
      } else {
        throw new Error("Failed to create campaign");
      }
    } else {
      const campaign = await Campaign.create(campaignData);
      return campaign;
    }
  } catch (error) {
    throw new Error(`Failed to create campaign: ${error.message}`);
  }
};
