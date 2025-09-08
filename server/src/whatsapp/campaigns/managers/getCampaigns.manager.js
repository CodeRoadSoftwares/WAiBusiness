import { CampaignRepository } from "../repositories/campaign.repository.js";
import { TransactionManager } from "../../../utils/transaction.util.js";

const getCampaignsManager = async (userId, query = {}) => {
  try {
    const campaigns = await TransactionManager.executeTransaction(
      async (session) => {
        const campaigns = await CampaignRepository.getCampaigns(
          userId,
          query,
          session
        );
        return campaigns;
      }
    );

    return campaigns;
  } catch (error) {
    throw new Error(`Failed to get campaigns: ${error.message}`);
  }
};

export default getCampaignsManager;
