import { createCampaign } from "./mutations/createCampaign.repository.js";
import { getCampaignById } from "./queries/getCampaignById.repository.js";

export const CampaignRepository = {
  createCampaign,
  getCampaignById,
};
