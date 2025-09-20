import { DirectMessageService } from "../services/directMessage.service.js";
import {
  validateDirectMessage,
  validateTemplateMessage,
} from "../validators/directMessage.validator.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Detect media type from URL
 */
function detectMediaTypeFromUrl(url) {
  const lowerUrl = url.toLowerCase();

  // Check for image extensions
  if (
    lowerUrl.includes(".jpg") ||
    lowerUrl.includes(".jpeg") ||
    lowerUrl.includes(".png") ||
    lowerUrl.includes(".gif") ||
    lowerUrl.includes(".webp") ||
    lowerUrl.includes(".bmp") ||
    lowerUrl.includes(".svg")
  ) {
    return "image";
  }

  // Check for video extensions
  if (
    lowerUrl.includes(".mp4") ||
    lowerUrl.includes(".avi") ||
    lowerUrl.includes(".mov") ||
    lowerUrl.includes(".webm") ||
    lowerUrl.includes(".mkv") ||
    lowerUrl.includes(".flv")
  ) {
    return "video";
  }

  // Check for audio extensions
  if (
    lowerUrl.includes(".mp3") ||
    lowerUrl.includes(".wav") ||
    lowerUrl.includes(".ogg") ||
    lowerUrl.includes(".m4a") ||
    lowerUrl.includes(".aac") ||
    lowerUrl.includes(".flac")
  ) {
    return "audio";
  }

  // Check for document extensions
  if (
    lowerUrl.includes(".pdf") ||
    lowerUrl.includes(".doc") ||
    lowerUrl.includes(".docx") ||
    lowerUrl.includes(".txt") ||
    lowerUrl.includes(".csv") ||
    lowerUrl.includes(".xls") ||
    lowerUrl.includes(".xlsx") ||
    lowerUrl.includes(".ppt") ||
    lowerUrl.includes(".pptx")
  ) {
    return "document";
  }

  // Check for common image hosting services (default to image)
  if (
    lowerUrl.includes("picsum.photos") ||
    lowerUrl.includes("unsplash.com") ||
    lowerUrl.includes("images.unsplash.com") ||
    lowerUrl.includes("imgur.com") ||
    lowerUrl.includes("cloudinary.com") ||
    lowerUrl.includes("amazonaws.com/s3")
  ) {
    return "image";
  }

  // Default to image for URLs without clear extensions
  return "image";
}

/**
 * Get MIME type from URL and media type
 */
function getMimeTypeFromUrl(url, mediaType) {
  const extension = url.split(".").pop()?.toLowerCase();

  const mimeTypes = {
    image: {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      bmp: "image/bmp",
      svg: "image/svg+xml",
    },
    video: {
      mp4: "video/mp4",
      avi: "video/x-msvideo",
      mov: "video/quicktime",
      webm: "video/webm",
      mkv: "video/x-matroska",
    },
    audio: {
      mp3: "audio/mpeg",
      wav: "audio/wav",
      ogg: "audio/ogg",
      m4a: "audio/mp4",
      aac: "audio/aac",
    },
    document: {
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      txt: "text/plain",
      csv: "text/csv",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  };

  return mimeTypes[mediaType]?.[extension] || "application/octet-stream";
}

/**
 * Send a direct text/media message
 */
export const sendDirectMessage = async (req, res) => {
  try {
    const {
      phone,
      type,
      message,
      media,
      mediaType,
      caption,
      name,
      messageType,
      priority,
    } = req.body;
    const userId = req.user._id;

    // Validate request
    const validation = validateDirectMessage(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validation.errors,
        code: "VALIDATION_ERROR",
      });
    }

    // Process media - handle both URL string and media object formats
    let processedMedia = null;
    if (media) {
      if (typeof media === "string") {
        // URL string format - convert to media object
        const detectedType = mediaType || detectMediaTypeFromUrl(media);

        processedMedia = {
          url: media,
          type: detectedType,
          caption: caption || null,
          fileName: media.split("/").pop() || "media",
          mimeType: getMimeTypeFromUrl(media, detectedType),
        };
      } else {
        // Media object format - use as is
        processedMedia = media;
      }
    }

    // Create message data
    const messageData = {
      phone,
      type,
      message,
      media: processedMedia,
      name,
      messageType: messageType || "notification", // Default to notification
      priority: priority || "normal",
      requestId: uuidv4(),
      source: req.authType === "api_key" ? "api" : "web",
    };

    // Create and queue message
    const result = await DirectMessageService.createMessage(
      messageData,
      userId
    );

    res.status(202).json({
      success: true,
      message: "Message queued for sending",
      data: result,
    });
  } catch (error) {
    console.error("Send direct message error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: "SEND_MESSAGE_ERROR",
    });
  }
};

/**
 * Send a template message
 */
export const sendTemplateMessage = async (req, res) => {
  try {
    const { phone, templateId } = req.params;
    const { variables, messageType, priority } = req.body;
    const userId = req.user._id;

    // Validate request
    const validation = validateTemplateMessage({
      phone,
      templateId,
      variables,
      messageType,
    });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validation.errors,
        code: "VALIDATION_ERROR",
      });
    }

    // Create message data
    const messageData = {
      phone,
      type: "template",
      messageType: messageType || "notification", // Default to notification
      templateId,
      templateParams: new Map(Object.entries(variables || {})),
      priority: priority || "normal",
      requestId: uuidv4(),
      source: req.authType === "api_key" ? "api" : "web",
    };

    // Create and queue message
    const result = await DirectMessageService.createMessage(
      messageData,
      userId
    );

    res.status(202).json({
      success: true,
      message: "Template message queued for sending",
      data: result,
    });
  } catch (error) {
    console.error("Send template message error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: "SEND_TEMPLATE_ERROR",
    });
  }
};

/**
 * Get message status
 */
export const getMessageStatus = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const result = await DirectMessageService.getMessageStatus(
      messageId,
      userId
    );

    res.json(result);
  } catch (error) {
    console.error("Get message status error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: "GET_STATUS_ERROR",
    });
  }
};

/**
 * Get message history
 */
export const getMessageHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: Math.min(parseInt(req.query.limit) || 50, 100),
      status: req.query.status,
      type: req.query.type,
      phone: req.query.phone,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const result = await DirectMessageService.getMessageHistory(
      userId,
      options
    );

    res.json(result);
  } catch (error) {
    console.error("Get message history error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: "GET_HISTORY_ERROR",
    });
  }
};

/**
 * Get message statistics
 */
export const getMessageStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const options = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const result = await DirectMessageService.getMessageStats(userId, options);

    res.json(result);
  } catch (error) {
    console.error("Get message stats error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: "GET_STATS_ERROR",
    });
  }
};

/**
 * Get message statistics by type
 */
export const getMessageStatsByType = async (req, res) => {
  try {
    const userId = req.user._id;
    const options = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const result = await DirectMessageService.getMessageStatsByType(
      userId,
      options
    );

    res.json(result);
  } catch (error) {
    console.error("Get message stats by type error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: "GET_STATS_BY_TYPE_ERROR",
    });
  }
};

/**
 * Send bulk direct messages
 */
export const sendBulkMessages = async (req, res) => {
  try {
    const { messages } = req.body;
    const userId = req.user._id;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Messages array is required",
        code: "INVALID_MESSAGES",
      });
    }

    if (messages.length > 100) {
      return res.status(400).json({
        success: false,
        error: "Maximum 100 messages per request",
        code: "TOO_MANY_MESSAGES",
      });
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < messages.length; i++) {
      try {
        const message = messages[i];
        const validation = validateDirectMessage(message);

        if (!validation.isValid) {
          errors.push({
            index: i,
            error: "Validation failed",
            details: validation.errors,
          });
          continue;
        }

        // Process media for bulk messages too
        let processedMedia = null;
        if (message.media) {
          if (typeof message.media === "string") {
            const detectedType =
              message.mediaType || detectMediaTypeFromUrl(message.media);

            processedMedia = {
              url: message.media,
              type: detectedType,
              caption: message.caption || null,
              fileName: message.media.split("/").pop() || "media",
              mimeType: getMimeTypeFromUrl(message.media, detectedType),
            };
          } else {
            processedMedia = message.media;
          }
        }

        const messageData = {
          ...message,
          media: processedMedia,
          messageType: message.messageType || "notification", // Default to notification
          priority: message.priority || "normal",
          requestId: uuidv4(),
          source: req.authType === "api_key" ? "api" : "web",
        };

        const result = await DirectMessageService.createMessage(
          messageData,
          userId
        );
        results.push({
          index: i,
          messageId: result.messageId,
          status: result.status,
        });
      } catch (error) {
        errors.push({
          index: i,
          error: error.message,
        });
      }
    }

    res.status(202).json({
      success: true,
      message: `Processed ${messages.length} messages`,
      data: {
        results,
        errors,
        totalProcessed: results.length,
        totalErrors: errors.length,
      },
    });
  } catch (error) {
    console.error("Send bulk messages error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: "BULK_SEND_ERROR",
    });
  }
};
