import { getWhatsappClient } from "./whatsappsession.service.js";

/**
 * Global presence manager to handle online/offline states
 * Keeps users online for a period after sending messages
 */
class WhatsappPresenceManager {
  constructor() {
    this.userPresenceStates = new Map(); // userId -> { isOnline, lastActivity, timeoutId }
    this.onlineDuration = 15000; // 15 seconds default
    this.cleanupInterval = 30000; // Cleanup every 30 seconds

    // Start cleanup interval
    this.startCleanupInterval();
  }

  /**
   * Set user online and manage activity-based offline timing
   * @param {string} userId - User ID
   * @param {string} phone - Recipient phone number
   * @param {string} priority - Message priority
   * @returns {Promise<Object>} Presence result
   */
  async setOnlineAndTyping(userId, phone, priority = "normal") {
    try {
      const client = getWhatsappClient(userId);
      if (!client) {
        throw new Error("WhatsApp client not available");
      }

      // Calculate timing based on priority
      const timing = this.getPresenceTiming(priority);

      console.log(
        `🟢 Setting online status for user ${userId} (${timing.onlineDuration}ms)`
      );

      // Set online status
      await client.presenceSubscribe(phone);
      await client.sendPresenceUpdate("available");

      // Wait for online status to be visible
      await new Promise((resolve) => setTimeout(resolve, timing.onlineDelay));

      console.log(
        `⌨️ Showing typing indicator for user ${userId} (${timing.typingDuration}ms)`
      );

      // Show typing indicator
      await client.sendPresenceUpdate("composing", phone);

      // Wait for typing indicator to be visible
      await new Promise((resolve) =>
        setTimeout(resolve, timing.typingDuration)
      );

      // Stop typing indicator
      await client.sendPresenceUpdate("paused", phone);

      // Update presence state and schedule offline
      this.updateUserPresence(userId, phone);

      console.log(`✅ Presence sequence completed for user ${userId}`);

      return {
        success: true,
        timing: timing,
        message: "Presence set successfully",
      };
    } catch (error) {
      console.error(
        `❌ Failed to set presence for user ${userId}:`,
        error.message
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update user presence state and manage offline timing
   * @param {string} userId - User ID
   * @param {string} phone - Last recipient phone
   */
  updateUserPresence(userId, phone) {
    const now = Date.now();

    // Clear existing timeout if any
    const existingState = this.userPresenceStates.get(userId);
    if (existingState && existingState.timeoutId) {
      clearTimeout(existingState.timeoutId);
    }

    // Set new state
    this.userPresenceStates.set(userId, {
      isOnline: true,
      lastActivity: now,
      lastPhone: phone,
      timeoutId: null,
    });

    // Schedule offline after activity period
    const timeoutId = setTimeout(() => {
      this.setUserOffline(userId);
    }, this.onlineDuration);

    // Update timeout ID
    this.userPresenceStates.set(userId, {
      ...this.userPresenceStates.get(userId),
      timeoutId: timeoutId,
    });

    console.log(
      `⏰ User ${userId} will go offline in ${this.onlineDuration}ms if no activity`
    );
  }

  /**
   * Set user offline
   * @param {string} userId - User ID
   */
  async setUserOffline(userId) {
    try {
      const state = this.userPresenceStates.get(userId);
      if (!state || !state.isOnline) {
        return; // Already offline or no state
      }

      const client = getWhatsappClient(userId);
      if (client) {
        console.log(`🔴 Setting offline status for user ${userId}`);
        await client.sendPresenceUpdate("unavailable");
      }

      // Update state
      this.userPresenceStates.set(userId, {
        ...state,
        isOnline: false,
        timeoutId: null,
      });

      console.log(`✅ User ${userId} is now offline`);
    } catch (error) {
      console.error(
        `❌ Failed to set offline status for user ${userId}:`,
        error.message
      );
    }
  }

  /**
   * Check if user is currently online
   * @param {string} userId - User ID
   * @returns {boolean} Is online
   */
  isUserOnline(userId) {
    const state = this.userPresenceStates.get(userId);
    return state ? state.isOnline : false;
  }

  /**
   * Get user's last activity time
   * @param {string} userId - User ID
   * @returns {number|null} Last activity timestamp
   */
  getLastActivity(userId) {
    const state = this.userPresenceStates.get(userId);
    return state ? state.lastActivity : null;
  }

  /**
   * Extend online duration for user (called when sending another message)
   * @param {string} userId - User ID
   * @param {string} phone - Recipient phone
   */
  extendOnlineDuration(userId, phone) {
    const state = this.userPresenceStates.get(userId);
    if (state && state.isOnline) {
      console.log(`🔄 Extending online duration for user ${userId}`);
      this.updateUserPresence(userId, phone);
    }
  }

  /**
   * Force user offline (for cleanup or manual control)
   * @param {string} userId - User ID
   */
  async forceOffline(userId) {
    const state = this.userPresenceStates.get(userId);
    if (state && state.timeoutId) {
      clearTimeout(state.timeoutId);
    }
    await this.setUserOffline(userId);
  }

  /**
   * Get presence timing based on priority
   * @param {string} priority - Message priority
   * @returns {Object} Timing configuration
   */
  getPresenceTiming(priority) {
    const timings = {
      urgent: {
        onlineDelay: 500, // 0.5 seconds to appear online
        onlineDuration: 1000, // 1 second online
        typingDuration: 800, // 0.8 seconds typing
        totalDuration: 1300, // Total: 1.3 seconds
      },
      high: {
        onlineDelay: 800, // 0.8 seconds to appear online
        onlineDuration: 1500, // 1.5 seconds online
        typingDuration: 1200, // 1.2 seconds typing
        totalDuration: 2000, // Total: 2 seconds
      },
      normal: {
        onlineDelay: 1000, // 1 second to appear online
        onlineDuration: 2000, // 2 seconds online
        typingDuration: 1500, // 1.5 seconds typing
        totalDuration: 2500, // Total: 2.5 seconds
      },
      low: {
        onlineDelay: 1500, // 1.5 seconds to appear online
        onlineDuration: 3000, // 3 seconds online
        typingDuration: 2000, // 2 seconds typing
        totalDuration: 3500, // Total: 3.5 seconds
      },
    };

    return timings[priority] || timings.normal;
  }

  /**
   * Start cleanup interval to remove stale states
   */
  startCleanupInterval() {
    setInterval(() => {
      const now = Date.now();
      const staleThreshold = 5 * 60 * 1000; // 5 minutes

      for (const [userId, state] of this.userPresenceStates.entries()) {
        if (now - state.lastActivity > staleThreshold) {
          console.log(`🧹 Cleaning up stale presence state for user ${userId}`);
          if (state.timeoutId) {
            clearTimeout(state.timeoutId);
          }
          this.userPresenceStates.delete(userId);
        }
      }
    }, this.cleanupInterval);
  }

  /**
   * Get all active presence states (for debugging)
   * @returns {Object} All presence states
   */
  getAllStates() {
    const states = {};
    for (const [userId, state] of this.userPresenceStates.entries()) {
      states[userId] = {
        isOnline: state.isOnline,
        lastActivity: new Date(state.lastActivity).toISOString(),
        lastPhone: state.lastPhone,
        timeUntilOffline: state.timeoutId
          ? this.onlineDuration - (Date.now() - state.lastActivity)
          : 0,
      };
    }
    return states;
  }
}

// Export singleton instance
export const presenceManager = new WhatsappPresenceManager();
