import DirectMessage from "../directMessage.model.js";
import { sendMessage } from "./messageSender.service.js";
import { whatsappRateLimiter } from "../../../utils/whatsappRateLimiter.util.js";
import { sessionHealthService } from "../../sessions/services/sessionHealth.service.js";
import { directMessageQueue } from "../../../queue/queues/directMessage.queue.js";
import mongoose from "mongoose";

/**
 * Service for handling direct messages via API
 */
export class DirectMessageService {
  /**
   * Create a direct message
   * @param {Object} messageData - Message data
   * @param {string} userId - User ID
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Created message
   */
  static async createMessage(messageData, userId, options = {}) {
    try {
      // Calculate optimal rate limits for this user
      const user = await import("../../../users/user.model.js").then((m) =>
        m.default.findById(userId)
      );
      const rateLimits = await this.calculateUserRateLimits(user, messageData);

      // Create message with rate limiting context
      const message = new DirectMessage({
        userId,
        phone: messageData.phone,
        name: messageData.name,
        type: messageData.type,
        messageType: messageData.messageType || "notification", // Default to notification
        message: messageData.message,
        media: messageData.media,
        templateId: messageData.templateId,
        templateParams: messageData.templateParams,
        priority: messageData.priority || "normal",
        requestId: messageData.requestId,
        source: messageData.source || "api",
        rateLimitContext: {
          messagesPerMinute: rateLimits.messagesPerMinute,
          delayBetweenMessages: rateLimits.delayBetweenMessages,
          randomDelay: rateLimits.randomDelay,
        },
        maxRetries: rateLimits.maxRetries,
        delayMs: this.calculateDelay(rateLimits, messageData.priority),
      });

      await message.save();

      // Queue the message for processing
      await this.queueMessage(message);

      return {
        success: true,
        messageId: message._id,
        status: message.status,
        scheduledFor: message.scheduledFor,
        estimatedDelivery: message.scheduledFor,
        rateLimits: {
          messagesPerMinute: rateLimits.messagesPerMinute,
          delayBetweenMessages: rateLimits.delayBetweenMessages,
        },
      };
    } catch (error) {
      console.error("Failed to create direct message:", error);
      throw new Error(`Failed to create message: ${error.message}`);
    }
  }

  /**
   * Calculate optimal rate limits for user
   * @param {Object} user - User object
   * @param {Object} messageData - Message data
   * @returns {Promise<Object>} Rate limits
   */
  static async calculateUserRateLimits(user, messageData) {
    try {
      // Create a temporary campaign-like object for rate limit calculation
      const tempCampaign = {
        _id: "direct_message",
        totalRecipients: 1,
        campaignType: messageData.messageType || "notification", // Use messageType for rate limiting
        messageVariants: [
          {
            type: messageData.type,
            variantName: "Direct",
          },
        ],
      };

      const rateLimits = await whatsappRateLimiter.calculateOptimalRateLimits(
        tempCampaign,
        user,
        {
          audienceSize: 1,
          messageType: messageData.type,
          messageClassification: messageData.messageType || "notification",
          isDirectMessage: true,
        }
      );

      return rateLimits;
    } catch (error) {
      console.error("Failed to calculate rate limits:", error);
      // Return conservative defaults
      return {
        messagesPerMinute: 5,
        maxRetries: 2,
        randomDelay: true,
        delayBetweenMessages: 3000,
      };
    }
  }

  /**
   * Calculate delay for message based on priority
   * @param {Object} rateLimits - Rate limits
   * @param {string} priority - Message priority
   * @returns {number} Delay in milliseconds
   */
  static calculateDelay(rateLimits, priority = "normal") {
    // No delay for urgent and high priority messages
    if (priority === "urgent" || priority === "high") {
      return 0;
    }

    const baseDelay = rateLimits.delayBetweenMessages || 2000;
    const randomDelay = rateLimits.randomDelay
      ? Math.random() * baseDelay * 0.5
      : 0;
    return baseDelay + randomDelay;
  }

  /**
   * Queue message for processing
   * @param {Object} message - Message object
   * @returns {Promise<void>}
   */
  static async queueMessage(message) {
    try {
      const rawDelay = message.delayMs;
      const delay =
        Number.isFinite(Number(rawDelay)) && Number(rawDelay) >= 0
          ? Number(rawDelay)
          : 0;
      const rawAttempts = (message.maxRetries ?? 3) + 1;
      const attempts = Math.max(
        1,
        Number.isFinite(Number(rawAttempts)) ? Number(rawAttempts) : 4
      );
      const backoffDelay = 5000;
      const priorityValue = this.getPriorityValue(message.priority);
      const priority = Number.isFinite(Number(priorityValue))
        ? Number(priorityValue)
        : 1;

      await directMessageQueue.add(
        "send-direct-message",
        {
          messageId: message._id.toString(),
          userId: message.userId.toString(),
          phone: message.phone,
          type: message.type,
          message: message.message,
          media: message.media,
          templateId: message.templateId,
          templateParams: message.templateParams,
          priority: message.priority,
          rateLimitContext: message.rateLimitContext,
        },
        {
          delay,
          attempts,
          backoff: { type: "exponential", delay: backoffDelay },
          removeOnComplete: 100,
          removeOnFail: 50,
          priority,
        }
      );
    } catch (error) {
      console.error("Failed to queue message:", error);
      throw error;
    }
  }

  /**
   * Get priority value for queue
   * @param {string} priority - Priority level
   * @returns {number} Priority value
   */
  static getPriorityValue(priority) {
    const priorities = {
      urgent: 1,
      high: 2,
      normal: 3,
      low: 4,
    };
    return priorities[priority] || 3;
  }

  /**
   * Process a direct message
   * @param {Object} job - BullMQ job
   * @returns {Promise<Object>} Processing result
   */
  static async processMessage(job) {
    const {
      messageId,
      userId,
      phone,
      type,
      message,
      media,
      templateId,
      templateParams,
      rateLimitContext,
    } = job.data;

    try {
      // Check session health
      const sessionResult = await sessionHealthService.getHealthySession(
        userId,
        3
      );
      if (!sessionResult.isHealthy) {
        console.warn(
          `⚠️ Session unhealthy for user ${userId}, requeuing message`
        );
        await sessionHealthService.requeueJobDueToSessionFailure(
          job,
          `Session unhealthy: ${sessionResult.error}`,
          60000 // 1 minute delay
        );
        return { requeuedDueToSessionFailure: true };
      }

      // Check rate limit
      const rateLimiter = new (
        await import("../../../utils/rateLimiter.util.js")
      ).RateLimiter({
        windowSize: 60000, // 1 minute
        maxRequests: rateLimitContext.messagesPerMinute,
        keyPrefix: `direct_msg_rate_limit_${userId}`,
      });

      const rateLimitResult = await rateLimiter.checkAndConsume(userId, 1);
      if (!rateLimitResult.allowed) {
        console.log(
          `⏳ Rate limit reached for user ${userId}, requeuing message`
        );
        await directMessageQueue.add("send-direct-message", job.data, {
          delay: rateLimitResult.waitTime,
          attempts: Math.max(1, (job.opts.attempts ?? 3) - job.attempts + 1),
          backoff: { type: "exponential", delay: 5000 },
          removeOnComplete: false,
          removeOnFail: false,
        });
        return { requeuedDueToRateLimit: true };
      }

      // Add delay between messages (skip for high priority messages)
      const priority = job.data.priority || "normal";
      if (
        priority !== "urgent" &&
        priority !== "high" &&
        rateLimitContext.delayBetweenMessages > 0
      ) {
        const randomDelay = rateLimitContext.randomDelay
          ? Math.random() * rateLimitContext.delayBetweenMessages * 0.5
          : 0;
        await new Promise((resolve) =>
          setTimeout(
            resolve,
            rateLimitContext.delayBetweenMessages + randomDelay
          )
        );
      }

      // Handle template messages - fetch template and replace variables
      let finalMessage = message;
      let finalMedia = media;
      let finalType = type;

      if (type === "template" && templateId) {
        try {
          // Import Template model
          const Template = (await import("../../template/template.model.js"))
            .default;

          // Fetch template from database
          const template = await Template.findOne({
            _id: templateId,
            userId: userId,
          });

          if (!template) {
            throw new Error(`Template with ID ${templateId} not found`);
          }

          // Replace variables in template content
          if (template.text) {
            finalMessage = this.replaceTemplateVariables(
              template.text,
              templateParams
            );
          }

          // Handle media in template
          if (template.media) {
            finalMedia = {
              ...template.media.toObject(),
              caption: template.media.caption
                ? this.replaceTemplateVariables(
                    template.media.caption,
                    templateParams
                  )
                : template.media.caption,
            };
          }

          // Determine final message type
          if (template.type === "text") {
            finalType = "text";
          } else if (template.type === "media") {
            finalType = "media";
          } else if (template.type === "mixed") {
            finalType = "mixed";
          }

          console.log(`📝 Using template: ${template.name} (${template.type})`);
          console.log(`📝 Final message: ${finalMessage}`);
          if (finalMedia) {
            console.log(`📝 Final media: ${JSON.stringify(finalMedia)}`);
          }
        } catch (error) {
          console.error(`❌ Template processing error:`, error.message);
          throw new Error(`Template processing failed: ${error.message}`);
        }
      }

      // Send the message
      const messageContent = {
        type: finalType,
        text: finalMessage,
        media: finalMedia,
      };

      const result = await sendMessage(
        userId,
        phone,
        messageContent,
        {},
        {
          priority: priority,
          usePresence: true,
        }
      );

      // Update message status
      await DirectMessage.findByIdAndUpdate(messageId, {
        $set: {
          status: "sent",
          sentAt: new Date(),
          response: result,
        },
        $inc: { retries: 1 },
      });

      console.log(`✅ Direct message sent successfully to ${phone}`);
      return { success: true, messageId, result };
    } catch (error) {
      console.error(
        `❌ Failed to send direct message to ${phone}:`,
        error.message
      );

      // Update message status
      await DirectMessage.findByIdAndUpdate(messageId, {
        $set: {
          status: "failed",
          lastError: error.message,
        },
        $inc: { retries: 1 },
      });

      // Requeue if session error
      if (
        error.message?.includes("Session") ||
        error.message?.includes("WhatsApp") ||
        error.message?.includes("client")
      ) {
        await sessionHealthService.requeueJobDueToSessionFailure(
          job,
          `Session error: ${error.message}`,
          30000 // 30 second delay
        );
        return { requeuedDueToSessionFailure: true };
      }

      throw error;
    }
  }

  /**
   * Get message status
   * @param {string} messageId - Message ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Message status
   */
  static async getMessageStatus(messageId, userId) {
    try {
      const message = await DirectMessage.findOne({
        _id: messageId,
        userId: userId,
      }).select("-__v");

      if (!message) {
        throw new Error("Message not found");
      }

      return {
        success: true,
        message: {
          id: message._id,
          phone: message.phone,
          type: message.type,
          status: message.status,
          sentAt: message.sentAt,
          deliveredAt: message.deliveredAt,
          readAt: message.readAt,
          lastError: message.lastError,
          retries: message.retries,
          response: message.response,
        },
      };
    } catch (error) {
      console.error("Failed to get message status:", error);
      throw new Error(`Failed to get message status: ${error.message}`);
    }
  }

  /**
   * Get user's message history
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Message history
   */
  static async getMessageHistory(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        status,
        type,
        phone,
        startDate,
        endDate,
      } = options;

      const query = { userId };

      if (status) query.status = status;
      if (type) query.type = type;
      if (phone) query.phone = { $regex: phone, $options: "i" };
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const skip = (page - 1) * limit;

      const [messages, total] = await Promise.all([
        DirectMessage.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .select("-__v"),
        DirectMessage.countDocuments(query),
      ]);

      return {
        success: true,
        messages,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error("Failed to get message history:", error);
      throw new Error(`Failed to get message history: ${error.message}`);
    }
  }

  /**
   * Replace template variables with actual values
   * @param {string} templateText - Template text with variables like {{name}}
   * @param {Map|Object} variables - Variables to replace
   * @returns {string} Text with variables replaced
   */
  static replaceTemplateVariables(templateText, variables) {
    if (!templateText || !variables) {
      return templateText;
    }

    let result = templateText;

    // Convert Map to Object if needed
    const vars =
      variables instanceof Map ? Object.fromEntries(variables) : variables;

    // Replace variables in format {{variableName}}
    Object.entries(vars).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      result = result.replace(regex, value || "");
    });

    return result;
  }

  /**
   * Get message statistics by type
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Message statistics by type
   */
  static async getMessageStatsByType(userId, options = {}) {
    try {
      const { startDate, endDate } = options;

      const matchQuery = { userId };
      if (startDate || endDate) {
        matchQuery.createdAt = {};
        if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
        if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
      }

      const stats = await DirectMessage.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: {
              messageType: "$messageType",
              status: "$status",
            },
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: "$_id.messageType",
            statuses: {
              $push: {
                status: "$_id.status",
                count: "$count",
              },
            },
            total: { $sum: "$count" },
          },
        },
      ]);

      const result = {};
      stats.forEach((stat) => {
        result[stat._id] = {
          total: stat.total,
          statuses: {},
        };
        stat.statuses.forEach((status) => {
          result[stat._id].statuses[status.status] = status.count;
        });
      });

      return {
        success: true,
        stats: result,
      };
    } catch (error) {
      console.error("Failed to get message stats by type:", error);
      throw new Error(`Failed to get message stats by type: ${error.message}`);
    }
  }

  /**
   * Get message statistics
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Message statistics
   */
  static async getMessageStats(userId, options = {}) {
    try {
      const { startDate, endDate } = options;

      const matchQuery = { userId };
      if (startDate || endDate) {
        matchQuery.createdAt = {};
        if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
        if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
      }

      const stats = await DirectMessage.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);

      const result = {
        total: 0,
        pending: 0,
        sent: 0,
        delivered: 0,
        read: 0,
        failed: 0,
        skipped: 0,
      };

      stats.forEach((stat) => {
        result[stat._id] = stat.count;
        result.total += stat.count;
      });

      return {
        success: true,
        stats: result,
      };
    } catch (error) {
      console.error("Failed to get message stats:", error);
      throw new Error(`Failed to get message stats: ${error.message}`);
    }
  }
}
