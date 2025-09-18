import CampaignMessage from "../campaignMessage.model.js";
import mongoose from "mongoose";

/**
 * Service for efficient campaign message operations
 */
export class CampaignMessageService {
  /**
   * Create campaign messages in bulk
   * @param {string} campaignId - Campaign ID
   * @param {string} userId - User ID
   * @param {string} variantName - Variant name
   * @param {Array} recipients - Array of recipients
   * @returns {Promise<Array>} Created messages
   */
  static async createMessages(campaignId, userId, variantName, recipients) {
    const messages = recipients.map((recipient) => ({
      campaignId: new mongoose.Types.ObjectId(campaignId),
      userId: new mongoose.Types.ObjectId(userId),
      variantName,
      phone: recipient.phone,
      name: recipient.name,
      variables: recipient.variables || new Map(),
      status: "pending",
    }));

    return await CampaignMessage.insertMany(messages, { ordered: false });
  }

  /**
   * Get pending messages for a campaign variant
   * @param {string} campaignId - Campaign ID
   * @param {string} variantName - Variant name
   * @param {number} limit - Limit results
   * @returns {Promise<Array>} Pending messages
   */
  static async getPendingMessages(campaignId, variantName, limit = 100) {
    return await CampaignMessage.find({
      campaignId: new mongoose.Types.ObjectId(campaignId),
      variantName,
      status: "pending",
    }).limit(limit);
  }

  /**
   * Check if phone number was already sent to in any variant
   * @param {string} campaignId - Campaign ID
   * @param {string} phone - Phone number
   * @returns {Promise<boolean>} True if already sent
   */
  static async isPhoneAlreadySent(campaignId, phone) {
    const count = await CampaignMessage.countDocuments({
      campaignId: new mongoose.Types.ObjectId(campaignId),
      phone,
      status: { $in: ["sent", "delivered", "read"] },
    });
    return count > 0;
  }

  /**
   * Update message status in bulk
   * @param {Array} updates - Array of update operations
   * @returns {Promise<Object>} Bulk write result
   */
  static async updateMessagesBulk(updates) {
    return await CampaignMessage.bulkWrite(updates);
  }

  /**
   * Get campaign statistics
   * @param {string} campaignId - Campaign ID
   * @returns {Promise<Object>} Campaign statistics
   */
  static async getCampaignStats(campaignId) {
    const stats = await CampaignMessage.aggregate([
      { $match: { campaignId: new mongoose.Types.ObjectId(campaignId) } },
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

    return result;
  }

  /**
   * Get variant statistics
   * @param {string} campaignId - Campaign ID
   * @param {string} variantName - Variant name
   * @returns {Promise<Object>} Variant statistics
   */
  static async getVariantStats(campaignId, variantName) {
    const stats = await CampaignMessage.aggregate([
      {
        $match: {
          campaignId: new mongoose.Types.ObjectId(campaignId),
          variantName,
        },
      },
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

    return result;
  }

  /**
   * Delete messages for a campaign
   * @param {string} campaignId - Campaign ID
   * @returns {Promise<Object>} Delete result
   */
  static async deleteCampaignMessages(campaignId) {
    return await CampaignMessage.deleteMany({
      campaignId: new mongoose.Types.ObjectId(campaignId),
    });
  }

  /**
   * Get messages by status with pagination
   * @param {string} campaignId - Campaign ID
   * @param {string} status - Message status
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<Object>} Paginated messages
   */
  static async getMessagesByStatus(campaignId, status, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      CampaignMessage.find({
        campaignId: new mongoose.Types.ObjectId(campaignId),
        status,
      })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      CampaignMessage.countDocuments({
        campaignId: new mongoose.Types.ObjectId(campaignId),
        status,
      }),
    ]);

    return {
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}
