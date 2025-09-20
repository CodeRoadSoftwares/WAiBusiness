/**
 * Validate direct message request
 * @param {Object} data - Message data
 * @returns {Object} Validation result
 */
export const validateDirectMessage = (data) => {
  const errors = [];

  // Required fields
  if (!data.phone) {
    errors.push("Phone number is required");
  } else if (!/^\+?[1-9]\d{1,14}$/.test(data.phone.replace(/\s/g, ""))) {
    errors.push("Invalid phone number format");
  }

  if (!data.type) {
    errors.push("Message type is required");
  } else if (!["text", "media", "mixed"].includes(data.type)) {
    errors.push("Invalid message type. Must be 'text', 'media', or 'mixed'");
  }

  // Type-specific validation
  if (data.type === "text" || data.type === "mixed") {
    if (!data.message || data.message.trim().length === 0) {
      errors.push("Message content is required for text/mixed messages");
    } else if (data.message.length > 4096) {
      errors.push("Message content too long (max 4096 characters)");
    }
  }

  if (data.type === "media" || data.type === "mixed") {
    if (!data.media) {
      errors.push("Media is required for media/mixed messages");
    } else {
      // Handle both URL string and media object formats
      if (typeof data.media === "string") {
        // URL string format - validate URL
        if (!data.media.trim()) {
          errors.push("Media URL cannot be empty");
        }
        // Auto-detect media type from URL if not provided
        if (!data.mediaType) {
          const url = data.media.toLowerCase();
          if (
            url.includes(".jpg") ||
            url.includes(".jpeg") ||
            url.includes(".png") ||
            url.includes(".gif") ||
            url.includes(".webp")
          ) {
            data.mediaType = "image";
          } else if (
            url.includes(".mp4") ||
            url.includes(".avi") ||
            url.includes(".mov") ||
            url.includes(".webm")
          ) {
            data.mediaType = "video";
          } else if (
            url.includes(".mp3") ||
            url.includes(".wav") ||
            url.includes(".ogg") ||
            url.includes(".m4a")
          ) {
            data.mediaType = "audio";
          } else {
            data.mediaType = "document";
          }
        }
      } else if (typeof data.media === "object") {
        // Media object format - validate object structure
        if (!data.media.url) {
          errors.push("Media URL is required");
        }
        if (!data.media.type) {
          errors.push("Media type is required");
        } else if (
          !["image", "video", "audio", "document"].includes(data.media.type)
        ) {
          errors.push(
            "Invalid media type. Must be 'image', 'video', 'audio', or 'document'"
          );
        }
        if (data.media.caption && data.media.caption.length > 1024) {
          errors.push("Media caption too long (max 1024 characters)");
        }
      } else {
        errors.push("Media must be a URL string or media object");
      }
    }
  }

  // Optional fields validation
  if (data.name && data.name.length > 100) {
    errors.push("Name too long (max 100 characters)");
  }

  if (
    data.priority &&
    !["low", "normal", "high", "urgent"].includes(data.priority)
  ) {
    errors.push(
      "Invalid priority. Must be 'low', 'normal', 'high', or 'urgent'"
    );
  }

  if (
    data.messageType &&
    ![
      "notification",
      "transactional",
      "reminder",
      "promotional",
      "alert",
      "update",
    ].includes(data.messageType)
  ) {
    errors.push(
      "Invalid message type. Must be 'notification', 'transactional', 'reminder', 'promotional', 'alert', or 'update'"
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate template message request
 * @param {Object} data - Template message data
 * @returns {Object} Validation result
 */
export const validateTemplateMessage = (data) => {
  const errors = [];

  // Required fields
  if (!data.phone) {
    errors.push("Phone number is required");
  } else if (!/^\+?[1-9]\d{1,14}$/.test(data.phone.replace(/\s/g, ""))) {
    errors.push("Invalid phone number format");
  }

  if (!data.templateId) {
    errors.push("Template ID is required");
  } else if (
    typeof data.templateId !== "string" ||
    data.templateId.length === 0
  ) {
    errors.push("Invalid template ID");
  }

  // Variables validation
  if (data.variables) {
    if (typeof data.variables !== "object" || Array.isArray(data.variables)) {
      errors.push("Variables must be an object");
    } else {
      const variableKeys = Object.keys(data.variables);
      if (variableKeys.length > 10) {
        errors.push("Too many variables (max 10)");
      }

      for (const [key, value] of Object.entries(data.variables)) {
        if (typeof key !== "string" || key.length === 0) {
          errors.push("Variable keys must be non-empty strings");
        }
        if (typeof value !== "string" || value.length === 0) {
          errors.push("Variable values must be non-empty strings");
        }
        if (value.length > 100) {
          errors.push(`Variable '${key}' value too long (max 100 characters)`);
        }
      }
    }
  }

  // Message type validation
  if (
    data.messageType &&
    ![
      "notification",
      "transactional",
      "reminder",
      "promotional",
      "alert",
      "update",
    ].includes(data.messageType)
  ) {
    errors.push(
      "Invalid message type. Must be 'notification', 'transactional', 'reminder', 'promotional', 'alert', or 'update'"
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate bulk messages request
 * @param {Object} data - Bulk messages data
 * @returns {Object} Validation result
 */
export const validateBulkMessages = (data) => {
  const errors = [];

  if (!Array.isArray(data.messages)) {
    errors.push("Messages must be an array");
    return { isValid: false, errors };
  }

  if (data.messages.length === 0) {
    errors.push("At least one message is required");
  }

  if (data.messages.length > 100) {
    errors.push("Maximum 100 messages per request");
  }

  // Validate each message
  data.messages.forEach((message, index) => {
    const messageValidation = validateDirectMessage(message);
    if (!messageValidation.isValid) {
      errors.push(
        `Message ${index + 1}: ${messageValidation.errors.join(", ")}`
      );
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};
