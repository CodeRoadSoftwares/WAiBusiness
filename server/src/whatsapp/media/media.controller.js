import { MediaManager } from "./managers/media.manager.js";
import getMediaManager from "./managers/getMedia.manager.js";

export const uploadMediaController = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const created = await MediaManager.addMediaManager(
      req.user?.id,
      req.files,
      {
        type: req.body?.type,
        caption: req.body?.caption,
      }
    );

    return res.status(201).json({ success: true, data: created });
  } catch (error) {
    console.error("uploadMediaController error:", error);
    return res.status(500).json({ error: error.message || "Upload failed" });
  }
};

export const getMediaController = async (req, res) => {
  try {
    const { page, limit, type } = req.query;
    const query = {};

    // Add type filter if provided (supports comma-separated values)
    if (type) {
      if (typeof type === "string" && type.includes(",")) {
        query.type = {
          $in: type
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        };
      } else if (Array.isArray(type)) {
        query.type = { $in: type.filter(Boolean) };
      } else {
        query.type = type;
      }
    }

    // Parse pagination parameters
    const paginationParams = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 0,
      ...query,
    };

    const result = await getMediaManager(req.user?.id, paginationParams);

    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("getMediaController error:", error);
    return res
      .status(500)
      .json({ error: error.message || "Failed to fetch media" });
  }
};

export const MediaController = {
  uploadMediaController,
  getMediaController,
};
