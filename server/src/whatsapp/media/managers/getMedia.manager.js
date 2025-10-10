import { MediaRepository } from "../repositories/media.repository.js";

const getMediaManager = async (userId, query = {}) => {
  try {
    const result = await MediaRepository.getMedia(userId, query);
    return result;
  } catch (error) {
    throw new Error(`Failed to get media: ${error.message}`);
  }
};

export default getMediaManager;
