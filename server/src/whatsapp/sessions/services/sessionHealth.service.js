import {
  ensureWhatsappClient,
  getWhatsappClient,
} from "./whatsappsession.service.js";
import { campaignQueue } from "../../../queue/queues/campaign.queue.js";

/**
 * Session health check and recovery service
 */
export class SessionHealthService {
  constructor() {
    this.healthCheckCache = new Map(); // userId -> { lastCheck, isHealthy, lastError }
    this.healthCheckInterval = 30000; // 30 seconds
    this.cacheTimeout = 60000; // 1 minute
  }

  /**
   * Check if a WhatsApp session is healthy
   * @param {string} userId - User ID
   * @param {boolean} forceCheck - Force check even if cached
   * @returns {Promise<{isHealthy: boolean, error?: string}>}
   */
  async checkSessionHealth(userId, forceCheck = false) {
    const now = Date.now();
    const cached = this.healthCheckCache.get(userId);

    // Return cached result if still valid and not forcing check
    if (!forceCheck && cached && now - cached.lastCheck < this.cacheTimeout) {
      return {
        isHealthy: cached.isHealthy,
        error: cached.lastError,
      };
    }

    try {
      // Try to get the client
      const client = await ensureWhatsappClient(userId);

      if (!client) {
        throw new Error("No WhatsApp client available");
      }

      // Check if client is connected
      const isConnected = client.ready || (client.user && client.user.id);

      if (!isConnected) {
        throw new Error("WhatsApp client not connected");
      }

      // Optional: Ping test (if your client supports it)
      // const pingResult = await client.ping();
      // if (!pingResult) {
      //   throw new Error("WhatsApp client ping failed");
      // }

      // Update cache
      this.healthCheckCache.set(userId, {
        lastCheck: now,
        isHealthy: true,
        lastError: null,
      });

      return { isHealthy: true };
    } catch (error) {
      console.warn(
        `⚠️ Session health check failed for user ${userId}: ${error.message}`
      );

      // Update cache
      this.healthCheckCache.set(userId, {
        lastCheck: now,
        isHealthy: false,
        lastError: error.message,
      });

      return {
        isHealthy: false,
        error: error.message,
      };
    }
  }

  /**
   * Attempt to recover a WhatsApp session
   * @param {string} userId - User ID
   * @returns {Promise<{recovered: boolean, error?: string}>}
   */
  async recoverSession(userId) {
    try {
      console.log(`🔄 Attempting to recover session for user ${userId}`);

      // Force a fresh health check
      const healthResult = await this.checkSessionHealth(userId, true);

      if (healthResult.isHealthy) {
        console.log(`✅ Session already healthy for user ${userId}`);
        return { recovered: true };
      }

      // Try to get a fresh client
      const client = await ensureWhatsappClient(userId);

      if (client && client.ready) {
        console.log(`✅ Session recovered for user ${userId}`);
        return { recovered: true };
      }

      throw new Error("Session recovery failed - client not ready");
    } catch (error) {
      console.error(
        `❌ Failed to recover session for user ${userId}: ${error.message}`
      );
      return {
        recovered: false,
        error: error.message,
      };
    }
  }

  /**
   * Get session health with automatic recovery attempt
   * @param {string} userId - User ID
   * @param {number} maxRecoveryAttempts - Maximum recovery attempts
   * @returns {Promise<{isHealthy: boolean, recovered: boolean, error?: string}>}
   */
  async getHealthySession(userId, maxRecoveryAttempts = 3) {
    for (let attempt = 1; attempt <= maxRecoveryAttempts; attempt++) {
      const healthResult = await this.checkSessionHealth(userId, attempt > 1);

      if (healthResult.isHealthy) {
        return {
          isHealthy: true,
          recovered: attempt > 1,
          error: null,
        };
      }

      if (attempt < maxRecoveryAttempts) {
        console.log(
          `🔄 Attempting session recovery for user ${userId} (attempt ${attempt}/${maxRecoveryAttempts})`
        );

        const recoveryResult = await this.recoverSession(userId);

        if (recoveryResult.recovered) {
          return {
            isHealthy: true,
            recovered: true,
            error: null,
          };
        }

        // Wait before next attempt with exponential backoff
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`⏳ Waiting ${waitTime}ms before next recovery attempt...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }

    return {
      isHealthy: false,
      recovered: false,
      error: `Session recovery failed after ${maxRecoveryAttempts} attempts`,
    };
  }

  /**
   * Requeue a job due to session failure
   * @param {Object} job - BullMQ job object
   * @param {string} reason - Reason for requeue
   * @param {number} delay - Delay in milliseconds
   */
  async requeueJobDueToSessionFailure(job, reason, delay = 60000) {
    const { campaignId, userId, variantName, recipients, message } = job.data;

    console.log(
      `🔄 Requeuing job due to session failure: ${reason} (delay: ${delay}ms)`
    );

    try {
      await campaignQueue.add(job.name, job.data, {
        delay: delay,
        attempts: job.opts.attempts - job.attempts + 1,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: false,
        removeOnFail: false,
      });

      return { requeued: true, reason };
    } catch (error) {
      console.error(`❌ Failed to requeue job: ${error.message}`);
      throw error;
    }
  }

  /**
   * Clear health check cache for a user
   * @param {string} userId - User ID
   */
  clearCache(userId) {
    this.healthCheckCache.delete(userId);
  }

  /**
   * Clear all health check cache
   */
  clearAllCache() {
    this.healthCheckCache.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    const now = Date.now();
    let healthy = 0;
    let unhealthy = 0;
    let expired = 0;

    for (const [userId, data] of this.healthCheckCache.entries()) {
      if (now - data.lastCheck > this.cacheTimeout) {
        expired++;
      } else if (data.isHealthy) {
        healthy++;
      } else {
        unhealthy++;
      }
    }

    return {
      total: this.healthCheckCache.size,
      healthy,
      unhealthy,
      expired,
    };
  }
}

// Create singleton instance
export const sessionHealthService = new SessionHealthService();

// Clean up expired cache entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [
    userId,
    data,
  ] of sessionHealthService.healthCheckCache.entries()) {
    if (now - data.lastCheck > sessionHealthService.cacheTimeout) {
      sessionHealthService.healthCheckCache.delete(userId);
    }
  }
}, 300000); // 5 minutes
