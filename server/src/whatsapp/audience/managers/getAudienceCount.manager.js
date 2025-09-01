import { AudienceRepository } from "../repositories/audience.repository.js";

const getAudienceCountManager = async (userId) => {
  try {
    const audienceCount = await AudienceRepository.getAudienceCount(userId);
    return audienceCount;
  } catch (error) {
    throw new Error(`Failed to get audience count: ${error.message}`);
  }
};

export default getAudienceCountManager;
