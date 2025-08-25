import { AudienceManager } from "./managers/audience.manager.js";

const getAudience = async (req, res) => {
  try {
    const { search, limit, skip } = req.query;
    const audience = await AudienceManager.getAudienceManager(req.user.id, {
      search,
      limit,
      skip,
    });
    res.status(200).json({
      success: true,
      message: "Audience fetched successfully",
      data: audience,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const AudienceController = {
  getAudience,
};
