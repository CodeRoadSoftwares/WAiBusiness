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

const getAudienceCount = async (req, res) => {
  try {
    const audienceCount = await AudienceManager.getAudienceCountManager(
      req.user.id
    );
    res.status(200).json({
      success: true,
      message: "Audience count fetched successfully",
      data: audienceCount,
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
  getAudienceCount,
};
