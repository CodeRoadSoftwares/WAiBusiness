import { CampaignManager } from "./managers/campaign.manager.js";

const createCampaign = async (req, res) => {
  try {
    const campaign = await CampaignManager.createCampaignManager(req.body);
    res.status(201).json(campaign);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const CampaignController = {
  createCampaign,
};
