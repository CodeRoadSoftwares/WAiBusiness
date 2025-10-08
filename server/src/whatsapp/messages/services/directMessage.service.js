import DirectMessage from "../directMessage.model.js";
import { sendMessage } from "./messageSender.service.js";
import { sessionHealthService } from "../../sessions/services/sessionHealth.service.js";
import { directMessageQueue } from "../../../queue/queues/directMessage.queue.js";
import mongoose from "mongoose";
import User from "../../../users/user.model.js";
import Template from "../../template/template.model.js";

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
          messagesPerMinute: 20,
          delayBetweenMessages: 2000,
          randomDelay: true,
        },
        maxRetries: 3,
        delayMs: this.calculateDelay(2000, true, messageData.priority),
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
          messagesPerMinute: 20,
          delayBetweenMessages: 2000,
          randomDelay: true,
        },
      };
    } catch (error) {
      console.error("Failed to create direct message:", error);
      throw new Error(`Failed to create message: ${error.message}`);
    }
  }

  /**
   * Calculate delay for message based on priority
   * @param {Object} delayBetweenMessages - Delay between messages
   * @param {Object} randomDelay - Random delay
   * @param {string} priority - Message priority
   * @returns {number} Delay in milliseconds
   */
  static calculateDelay(
    delayBetweenMessages,
    randomDelay,
    priority = "normal"
  ) {
    // No delay for urgent and high priority messages
    if (priority === "urgent" || priority === "high") {
      return 0;
    }

    const baseDelay = delayBetweenMessages || 2000;
    const ranDelay = randomDelay ? Math.random() * baseDelay * 0.5 : 0;
    return baseDelay + ranDelay;
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
          const Template = await Template.findOne({
            _id: templateId,
            userId: userId,
          });

          if (!Template) {
            throw new Error(`Template with ID ${templateId} not found`);
          }

          // Replace variables in template content
          if (Template.text) {
            finalMessage = this.replaceTemplateVariables(
              Template.text,
              templateParams
            );
          }

          // Handle media in template
          if (Template.media) {
            finalMedia = {
              ...Template.media.toObject(),
              caption: template.media.caption
                ? this.replaceTemplateVariables(
                    Template.media.caption,
                    templateParams
                  )
                : Template.media.caption,
            };
          }

          // Determine final message type
          if (Template.type === "text") {
            finalType = "text";
          } else if (Template.type === "media") {
            finalType = "media";
          } else if (Template.type === "mixed") {
            finalType = "mixed";
          }

          console.log(`📝 Using template: ${Template.name} (${Template.type})`);
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
