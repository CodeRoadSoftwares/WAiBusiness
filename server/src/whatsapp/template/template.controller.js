import { TemplateManager } from "./managers/template.manager.js";

const createTemplate = async (req, res) => {
  try {
    console.log("req.body:", req.body);
    console.log("req.file:", req.file);
    console.log("req.files:", req.files);

    // Extract file information if uploaded
    let mediaData = null;
    if (req.file) {
      mediaData = {
        url: `/uploads/media/${req.file.filename}`, // Public URL
        type: (() => {
          const mime = req.file.mimetype;
          if (mime.startsWith("image/")) return "image";
          if (mime.startsWith("video/")) return "video";
          if (mime.startsWith("audio/")) return "audio";
          if (
            mime === "application/pdf" ||
            mime.startsWith("application/") ||
            mime.startsWith("text/")
          )
            return "document";
          // fallback
          return "document";
        })(),
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
      };
      console.log("Media file received:", mediaData);
    }

    // Prepare template data
    const templateData = {
      ...req.body,
      media: mediaData, // Include media data if file was uploaded
    };

    console.log("Final template data:", templateData);

    const template = await TemplateManager.createTemplateManager(
      req.user.id,
      templateData
    );
    res.status(201).json({
      success: true,
      message: "Template created successfully",
      data: template,
    });
  } catch (error) {
    console.error("Template creation error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getTemplates = async (req, res) => {
  try {
    const { search = "", limit = 20, skip = 0 } = req.query;

    const result = await TemplateManager.getTemplatesManager(req.user.id, {
      search,
      limit: parseInt(limit),
      skip: parseInt(skip),
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get templates error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getTemplatesCount = async (req, res) => {
  try {
    const templatesCount = await TemplateManager.getTemplatesCountManager(
      req.user.id
    );
    res.status(200).json({
      success: true,
      data: templatesCount,
    });
  } catch (error) {
    console.error("Get templates count error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const TemplateController = {
  createTemplate,
  getTemplates,
  getTemplatesCount,
};
