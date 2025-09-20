import { createCampaign } from "./mutations/createCampaign.mutation.js";
import { getCampaignById } from "./queries/getCampaignById.query.js";
import { getCampaignsCount } from "./queries/getCampaignsCount.query.js";
import { getCampaigns } from "./queries/getCampaigns.query.js";
import { getNumOfSentMessages } from "./queries/getNumOfSentMessages.query.js";

export const CampaignRepository = {
  createCampaign,
  getCampaignById,
  getCampaignsCount,
  getCampaigns,
  getNumOfSentMessages,
};
