import CampaignMessage from "../../campaignMessage.model.js";

export const getNumOfSentMessages = async (userId) => {
  const campaignMessages = await CampaignMessage.countDocuments({
    userId,
    status: { $ne: "pending" },
  });
  return campaignMessages;
};
