import Audience from "../../audience.model.js";

export const getAudienceById = async (userId, audienceId, session = null) => {
  try {
    let audienceQuery;
    if (session) {
      audienceQuery = Audience.findOne({ userId, _id: audienceId }).session(
        session
      );
    } else {
      audienceQuery = Audience.findOne({ userId, _id: audienceId });
    }

    const audience = await audienceQuery;
    return audience;
  } catch (error) {
    throw new Error(`Failed to get audience by id: ${error.message}`);
  }
};
