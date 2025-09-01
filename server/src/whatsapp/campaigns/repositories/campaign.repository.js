import { createCampaign } from "./mutations/createCampaign.repository.js";
import { getCampaignById } from "./queries/getCampaignById.repository.js";
import { getCampaignsCount } from "./queries/getCampaignsCount.query.js";

export const CampaignRepository = {
  createCampaign,
  getCampaignById,
  getCampaignsCount,
};
