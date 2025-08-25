import { AudienceRepository } from "../repositories/audience.repository.js";
import { TransactionManager } from "../../../utils/transaction.util.js";

const getAudienceManager = async (userId, query = {}) => {
  try {
    const audience = await TransactionManager.executeTransaction(
      async (session) => {
        const audience = await AudienceRepository.getAudience(
          userId,
          query,
          session
        );
        return audience;
      }
    );

    return audience;
  } catch (error) {
    throw new Error(`Failed to get audience: ${error.message}`);
  }
};

export default getAudienceManager;
