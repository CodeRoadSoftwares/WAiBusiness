import { dynamicConfigService } from "./dynamicConfig.util.js";
import { CampaignMessageService } from "../whatsapp/campaigns/services/campaignMessage.service.js";
import WhatsappSession from "../whatsapp/sessions/whatsappsessions.model.js";
import Campaign from "../whatsapp/campaigns/campaign.model.js";
import CampaignMessage from "../whatsapp/campaigns/campaignMessage.model.js";

/**
 * WhatsApp-specific rate limiting service that considers multiple factors
 * to minimize ban risk while maintaining good throughput
 */
export class WhatsAppRateLimiter {
  constructor() {
    this.banRiskFactors = {
      // Account age factors (newer accounts are more risky)
      accountAge: {
        new: 0.3, // < 30 days
        young: 0.2, // 30-90 days
        mature: 0.1, // 90-365 days
        old: 0.05, // > 365 days
      },

      // Message type risk factors
      messageType: {
        text: 0.1,
        template: 0.05, // Templates are safest
        media: 0.2,
        mixed: 0.15,
      },

      // Campaign size risk factors
      campaignSize: {
        small: 0.05, // < 100 recipients
        medium: 0.1, // 100-1000 recipients
        large: 0.2, // 1000-10000 recipients
        massive: 0.3, // > 10000 recipients
      },

      // Time-based risk factors
      timeOfDay: {
        business: 0.05, // 9 AM - 6 PM
        evening: 0.1, // 6 PM - 10 PM
        night: 0.2, // 10 PM - 6 AM
        weekend: 0.15, // Weekends
      },

      // Historical performance factors
      historical: {
        excellent: 0.05, // < 1% failure rate
        good: 0.1, // 1-5% failure rate
        average: 0.2, // 5-10% failure rate
        poor: 0.4, // > 10% failure rate
      },
    };
  }

  /**
   * Calculate optimal rate limits for a campaign
   * @param {Object} campaign - Campaign object
   * @param {Object} user - User object
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Rate limiting configuration
   */
  async calculateOptimalRateLimits(campaign, user, options = {}) {
    try {
      // Get system metrics for load-based adjustments
      const systemMetrics = await dynamicConfigService.getSystemMetrics();

      // Calculate base risk score
      const riskScore = await this.calculateBanRiskScore(
        campaign,
        user,
        options
      );

      // Get historical performance for this user
      const historicalPerformance = await this.getUserHistoricalPerformance(
        user._id
      );

      // Get account age risk for logging
      const accountAgeRisk = await this.getAccountAgeRisk(user._id);

      // Calculate base rate limits
      const baseRateLimits = this.calculateBaseRateLimits(
        riskScore,
        historicalPerformance
      );

      // Apply system load adjustments
      const adjustedRateLimits = this.applySystemLoadAdjustments(
        baseRateLimits,
        systemMetrics
      );

      // Apply campaign-specific adjustments
      const finalRateLimits = this.applyCampaignAdjustments(
        adjustedRateLimits,
        campaign
      );

      // Ensure WhatsApp safety limits
      const safeRateLimits = this.ensureWhatsAppSafetyLimits(
        finalRateLimits,
        riskScore
      );

      console.log(`📊 Calculated rate limits for campaign ${campaign._id}:`, {
        riskScore: Math.round(riskScore * 100) / 100,
        rateLimits: safeRateLimits,
        factors: {
          accountAge: accountAgeRisk,
          messageType: campaign.messageVariants[0]?.type || "text",
          campaignSize: this.getCampaignSizeRisk(campaign.totalRecipients),
          timeOfDay: this.getTimeOfDayRisk(),
          historical: historicalPerformance.riskLevel,
        },
      });

      return safeRateLimits;
    } catch (error) {
      console.error("Failed to calculate optimal rate limits:", error);
      // Return conservative defaults
      return this.getConservativeDefaults();
    }
  }

  /**
   * Calculate ban risk score (0-1, where 1 is highest risk)
   * @param {Object} campaign - Campaign object
   * @param {Object} user - User object
   * @param {Object} options - Additional options
   * @returns {Promise<number>} Risk score
   */
  async calculateBanRiskScore(campaign, user, options = {}) {
    const factors = this.banRiskFactors;
    let riskScore = 0;

    // Account age factor (now async)
    const accountAgeRisk = await this.getAccountAgeRisk(user._id);
    riskScore += accountAgeRisk * 0.25; // 25% weight

    // Message type factor
    const messageType = campaign.messageVariants[0]?.type || "text";
    const messageTypeRisk = factors.messageType[messageType] || 0.1;
    riskScore += messageTypeRisk * 0.2; // 20% weight

    // Campaign size factor
    const campaignSizeRisk = this.getCampaignSizeRisk(campaign.totalRecipients);
    riskScore += campaignSizeRisk * 0.2; // 20% weight

    // Time of day factor
    const timeOfDayRisk = this.getTimeOfDayRisk();
    riskScore += timeOfDayRisk * 0.15; // 15% weight

    // Historical performance factor
    const historicalPerformance = await this.getUserHistoricalPerformance(
      user._id
    );
    const historicalRisk =
      factors.historical[historicalPerformance.riskLevel] || 0.2;
    riskScore += historicalRisk * 0.2; // 20% weight

    return Math.min(1, Math.max(0, riskScore));
  }

  /**
   * Get comprehensive account age risk factor
   * @param {string} userId - User ID
   * @returns {Promise<number>} Risk factor
   */
  async getAccountAgeRisk(userId) {
    try {
      // Get user account age
      const user = await import("../users/user.model.js").then((m) =>
        m.default.findById(userId)
      );
      const userAccountAge = user
        ? (Date.now() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)
        : 0;

      // Get WhatsApp session age
      const whatsappSession = await WhatsappSession.findOne({ userId });
      const sessionAge = whatsappSession
        ? (Date.now() - new Date(whatsappSession.createdAt)) /
          (1000 * 60 * 60 * 24)
        : 0;

      // Get campaign history age (first campaign)
      const firstCampaign = await Campaign.findOne({ userId }).sort({
        createdAt: 1,
      });
      const campaignHistoryAge = firstCampaign
        ? (Date.now() - new Date(firstCampaign.createdAt)) /
          (1000 * 60 * 60 * 24)
        : 0;

      // Calculate weighted risk based on multiple factors
      let riskScore = 0;
      let totalWeight = 0;

      // User account age (30% weight)
      if (userAccountAge > 0) {
        const userRisk = this.getAgeRiskFromDays(userAccountAge);
        riskScore += userRisk * 0.3;
        totalWeight += 0.3;
      }

      // WhatsApp session age (40% weight) - Most important for ban risk
      if (sessionAge > 0) {
        const sessionRisk = this.getAgeRiskFromDays(sessionAge);
        riskScore += sessionRisk * 0.4;
        totalWeight += 0.4;
      }

      // Campaign history age (30% weight) - Shows experience with sending
      if (campaignHistoryAge > 0) {
        const campaignRisk = this.getAgeRiskFromDays(campaignHistoryAge);
        riskScore += campaignRisk * 0.3;
        totalWeight += 0.3;
      }

      // If no data available, assume new account (highest risk)
      if (totalWeight === 0) {
        return this.banRiskFactors.accountAge.new;
      }

      // Normalize the risk score
      const normalizedRisk = riskScore / totalWeight;

      console.log(`📊 Account age analysis for user ${userId}:`, {
        userAccountAge: Math.round(userAccountAge),
        sessionAge: Math.round(sessionAge),
        campaignHistoryAge: Math.round(campaignHistoryAge),
        normalizedRisk: Math.round(normalizedRisk * 100) / 100,
      });

      return normalizedRisk;
    } catch (error) {
      console.error("Failed to calculate account age risk:", error);
      // Return conservative risk if calculation fails
      return this.banRiskFactors.accountAge.new;
    }
  }

  /**
   * Convert age in days to risk factor
   * @param {number} ageInDays - Age in days
   * @returns {number} Risk factor
   */
  getAgeRiskFromDays(ageInDays) {
    if (ageInDays < 7) return this.banRiskFactors.accountAge.new; // < 1 week
    if (ageInDays < 30) return this.banRiskFactors.accountAge.new; // < 1 month
    if (ageInDays < 90) return this.banRiskFactors.accountAge.young; // < 3 months
    if (ageInDays < 365) return this.banRiskFactors.accountAge.mature; // < 1 year
    return this.banRiskFactors.accountAge.old; // > 1 year
  }

  /**
   * Get campaign size risk factor
   * @param {number} totalRecipients - Total recipients
   * @returns {number} Risk factor
   */
  getCampaignSizeRisk(totalRecipients) {
    if (totalRecipients < 100) return this.banRiskFactors.campaignSize.small;
    if (totalRecipients < 1000) return this.banRiskFactors.campaignSize.medium;
    if (totalRecipients < 10000) return this.banRiskFactors.campaignSize.large;
    return this.banRiskFactors.campaignSize.massive;
  }

  /**
   * Get time of day risk factor
   * @returns {number} Risk factor
   */
  getTimeOfDayRisk() {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday

    // Weekend factor
    if (day === 0 || day === 6) {
      return this.banRiskFactors.timeOfDay.weekend;
    }

    // Business hours (9 AM - 6 PM)
    if (hour >= 9 && hour < 18) {
      return this.banRiskFactors.timeOfDay.business;
    }

    // Evening (6 PM - 10 PM)
    if (hour >= 18 && hour < 22) {
      return this.banRiskFactors.timeOfDay.evening;
    }

    // Night (10 PM - 6 AM)
    return this.banRiskFactors.timeOfDay.night;
  }

  /**
   * Get user's historical performance based on real campaign data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Historical performance data
   */
  async getUserHistoricalPerformance(userId) {
    try {
      // Get last 30 days of campaign data
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Get completed campaigns from last 30 days
      const recentCampaigns = await Campaign.find({
        userId,
        status: { $in: ["completed", "failed"] },
        updatedAt: { $gte: thirtyDaysAgo },
      });

      if (recentCampaigns.length === 0) {
        // No recent campaigns - assume new user
        return {
          totalCampaigns: 0,
          successRate: 0.95, // Assume good performance for new users
          failureRate: 0.05,
          riskLevel: "excellent",
        };
      }

      // Calculate success/failure rates
      const completedCampaigns = recentCampaigns.filter(
        (c) => c.status === "completed"
      ).length;
      const failedCampaigns = recentCampaigns.filter(
        (c) => c.status === "failed"
      ).length;
      const totalCampaigns = recentCampaigns.length;

      const successRate = completedCampaigns / totalCampaigns;
      const failureRate = failedCampaigns / totalCampaigns;

      // Determine risk level based on performance
      let riskLevel = "excellent";
      if (failureRate > 0.1) riskLevel = "poor";
      else if (failureRate > 0.05) riskLevel = "average";
      else if (failureRate > 0.01) riskLevel = "good";

      // Get total message statistics from CampaignMessage collection for user's campaigns
      const userCampaigns = await Campaign.find({ userId }).select("_id");
      const campaignIds = userCampaigns.map((c) => c._id);

      let totalMessages = 0;
      let sentMessages = 0;
      let failedMessages = 0;

      if (campaignIds.length > 0) {
        // Aggregate message stats across all user campaigns
        const messageStats = await CampaignMessage.aggregate([
          { $match: { campaignId: { $in: campaignIds } } },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ]);

        messageStats.forEach((stat) => {
          totalMessages += stat.count;
          if (stat._id === "sent") sentMessages = stat.count;
          if (stat._id === "failed") failedMessages = stat.count;
        });
      }

      const messageSuccessRate =
        totalMessages > 0 ? sentMessages / totalMessages : 1;
      const messageFailureRate =
        totalMessages > 0 ? failedMessages / totalMessages : 0;

      // Adjust risk level based on message-level performance
      if (messageFailureRate > 0.1) {
        riskLevel = "poor";
      } else if (messageFailureRate > 0.05 && riskLevel === "excellent") {
        riskLevel = "good";
      }

      console.log(`📊 Historical performance for user ${userId}:`, {
        totalCampaigns,
        successRate: Math.round(successRate * 100) / 100,
        failureRate: Math.round(failureRate * 100) / 100,
        messageSuccessRate: Math.round(messageSuccessRate * 100) / 100,
        messageFailureRate: Math.round(messageFailureRate * 100) / 100,
        riskLevel,
      });

      return {
        totalCampaigns,
        successRate,
        failureRate,
        messageSuccessRate,
        messageFailureRate,
        riskLevel,
      };
    } catch (error) {
      console.error("Failed to get historical performance:", error);
      return {
        totalCampaigns: 0,
        successRate: 0.9,
        failureRate: 0.1,
        riskLevel: "good",
      };
    }
  }

  /**
   * Calculate base rate limits based on risk score
   * @param {number} riskScore - Risk score (0-1)
   * @param {Object} historicalPerformance - Historical performance data
   * @returns {Object} Base rate limits
   */
  calculateBaseRateLimits(riskScore, historicalPerformance) {
    // Base rates (messages per minute)
    const baseRates = {
      messagesPerMinute: 20,
      messagesPerHour: 1000,
      messagesPerDay: 10000,
      maxRetries: 3,
      randomDelay: true,
      delayBetweenMessages: 2000, // 2 seconds
      burstLimit: 5, // Max messages in burst
      burstDelay: 10000, // 10 seconds between bursts
    };

    // Adjust based on risk score
    const riskMultiplier = 1 - riskScore * 0.7; // Reduce by up to 70% for high risk

    return {
      messagesPerMinute: Math.max(
        2,
        Math.round(baseRates.messagesPerMinute * riskMultiplier)
      ),
      messagesPerHour: Math.max(
        50,
        Math.round(baseRates.messagesPerHour * riskMultiplier)
      ),
      messagesPerDay: Math.max(
        500,
        Math.round(baseRates.messagesPerDay * riskMultiplier)
      ),
      maxRetries: Math.max(
        1,
        Math.round(baseRates.maxRetries * riskMultiplier)
      ),
      randomDelay: true,
      delayBetweenMessages: Math.round(
        baseRates.delayBetweenMessages / riskMultiplier
      ),
      burstLimit: Math.max(
        1,
        Math.round(baseRates.burstLimit * riskMultiplier)
      ),
      burstDelay: Math.round(baseRates.burstDelay * riskMultiplier),
    };
  }

  /**
   * Apply system load adjustments
   * @param {Object} rateLimits - Base rate limits
   * @param {Object} systemMetrics - System metrics
   * @returns {Object} Adjusted rate limits
   */
  applySystemLoadAdjustments(rateLimits, systemMetrics) {
    const adjusted = { ...rateLimits };

    // Reduce rates if system is under load
    if (systemMetrics.memoryUsage > 0.8) {
      adjusted.messagesPerMinute = Math.max(
        1,
        Math.round(adjusted.messagesPerMinute * 0.5)
      );
      adjusted.delayBetweenMessages = Math.round(
        adjusted.delayBetweenMessages * 1.5
      );
    }

    if (systemMetrics.cpuUsage > 0.7) {
      adjusted.messagesPerMinute = Math.max(
        1,
        Math.round(adjusted.messagesPerMinute * 0.7)
      );
      adjusted.delayBetweenMessages = Math.round(
        adjusted.delayBetweenMessages * 1.3
      );
    }

    if (systemMetrics.queueDepth > 100) {
      adjusted.messagesPerMinute = Math.max(
        1,
        Math.round(adjusted.messagesPerMinute * 0.8)
      );
    }

    return adjusted;
  }

  /**
   * Apply campaign-specific adjustments
   * @param {Object} rateLimits - Rate limits
   * @param {Object} campaign - Campaign object
   * @returns {Object} Adjusted rate limits
   */
  applyCampaignAdjustments(rateLimits, campaign) {
    const adjusted = { ...rateLimits };

    // Adjust based on campaign type
    const campaignTypeMultipliers = {
      marketing: 0.8, // More conservative for marketing
      transactional: 1.0, // Normal for transactional
      notification: 0.9, // Slightly conservative for notifications
      reminder: 0.85, // Conservative for reminders
      other: 0.7, // Most conservative for other types
    };

    const multiplier = campaignTypeMultipliers[campaign.campaignType] || 0.7;
    adjusted.messagesPerMinute = Math.max(
      1,
      Math.round(adjusted.messagesPerMinute * multiplier)
    );

    // Adjust based on message type
    const messageType = campaign.messageVariants[0]?.type || "text";
    if (messageType === "media") {
      adjusted.messagesPerMinute = Math.max(
        1,
        Math.round(adjusted.messagesPerMinute * 0.6)
      );
      adjusted.delayBetweenMessages = Math.round(
        adjusted.delayBetweenMessages * 1.5
      );
    } else if (messageType === "template") {
      adjusted.messagesPerMinute = Math.min(adjusted.messagesPerMinute, 30); // Templates have higher limits
    }

    return adjusted;
  }

  /**
   * Ensure WhatsApp safety limits
   * @param {Object} rateLimits - Rate limits
   * @param {number} riskScore - Risk score
   * @returns {Object} Safe rate limits
   */
  ensureWhatsAppSafetyLimits(rateLimits, riskScore) {
    const safe = { ...rateLimits };

    // WhatsApp's known limits (conservative estimates)
    const whatsappLimits = {
      maxPerMinute: 30,
      maxPerHour: 1500,
      maxPerDay: 10000,
      minDelayBetweenMessages: 1000, // 1 second minimum
      maxBurstSize: 10,
    };

    // Apply WhatsApp limits
    safe.messagesPerMinute = Math.min(
      safe.messagesPerMinute,
      whatsappLimits.maxPerMinute
    );
    safe.messagesPerHour = Math.min(
      safe.messagesPerHour,
      whatsappLimits.maxPerHour
    );
    safe.messagesPerDay = Math.min(
      safe.messagesPerDay,
      whatsappLimits.maxPerDay
    );
    safe.delayBetweenMessages = Math.max(
      safe.delayBetweenMessages,
      whatsappLimits.minDelayBetweenMessages
    );
    safe.burstLimit = Math.min(safe.burstLimit, whatsappLimits.maxBurstSize);

    // Additional safety for high-risk accounts
    if (riskScore > 0.7) {
      safe.messagesPerMinute = Math.min(safe.messagesPerMinute, 10);
      safe.delayBetweenMessages = Math.max(safe.delayBetweenMessages, 3000);
      safe.burstLimit = Math.min(safe.burstLimit, 3);
    }

    return safe;
  }

  /**
   * Get conservative default rate limits
   * @returns {Object} Conservative defaults
   */
  getConservativeDefaults() {
    return {
      messagesPerMinute: 5,
      messagesPerHour: 200,
      messagesPerDay: 2000,
      maxRetries: 2,
      randomDelay: true,
      delayBetweenMessages: 5000,
      burstLimit: 2,
      burstDelay: 15000,
    };
  }
}

// Create singleton instance
export const whatsappRateLimiter = new WhatsAppRateLimiter();
