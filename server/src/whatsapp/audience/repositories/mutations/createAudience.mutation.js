import Audience from "../../audience.model.js";

export const createAudience = async (audienceData, session = null) => {
  try {
    if (session) {
      const audience = await Audience.create([audienceData], { session });
      return audience[0];
    } else {
      const audience = await Audience.create(audienceData);
      return audience;
    }
  } catch (error) {
    throw new Error(`Failed to create audience: ${error.message}`);
  }
};