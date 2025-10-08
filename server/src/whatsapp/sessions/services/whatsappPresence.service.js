import { getWhatsappClient } from "./whatsappsession.service.js";

/**
 * Service for managing WhatsApp presence and typing indicators
 */
export class WhatsappPresenceService {
  /**
   * Set user as online and show typing indicator before sending message
   * @param {string} userId - User ID
   * @param {string} phone - Recipient phone number
   * @param {string} priority - Message priority
   * @returns {Promise<Object>} Presence result
   */
  static async setOnlineAndTyping(userId, phone, priority = "normal") {
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
   * Get presence timing based on priority
   * @param {string} priority - Message priority
   * @returns {Object} Timing configuration
   */
  static getPresenceTiming(priority) {
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
   * Set user as online without typing (for immediate messages)
   * @param {string} userId - User ID
   * @param {string} phone - Recipient phone number
   * @returns {Promise<Object>} Presence result
   */
  static async setOnlineOnly(userId, phone) {
    try {
      const client = getWhatsappClient(userId);
      if (!client) {
        throw new Error("WhatsApp client not available");
      }

      console.log(`🟢 Setting online status only for user ${userId}`);

      // Set online status
      await client.presenceSubscribe(phone);
      await client.sendPresenceUpdate("available");

      // Brief delay to ensure online status is visible
      await new Promise((resolve) => setTimeout(resolve, 500));

      return {
        success: true,
        message: "Online status set successfully",
      };
    } catch (error) {
      console.error(
        `❌ Failed to set online status for user ${userId}:`,
        error.message
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Set user as offline (after sending message)
   * @param {string} userId - User ID
   * @param {string} phone - Recipient phone number
   * @returns {Promise<Object>} Presence result
   */
  static async setOffline(userId, phone) {
    try {
      const client = getWhatsappClient(userId);
      if (!client) {
        throw new Error("WhatsApp client not available");
      }

      console.log(`🔴 Setting offline status for user ${userId}`);

      // Set offline status
      await client.sendPresenceUpdate("unavailable");

      return {
        success: true,
        message: "Offline status set successfully",
      };
    } catch (error) {
      console.error(
        `❌ Failed to set offline status for user ${userId}:`,
        error.message
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Complete presence sequence: online -> typing -> send message -> offline
   * @param {string} userId - User ID
   * @param {string} phone - Recipient phone number
   * @param {string} priority - Message priority
   * @param {Function} sendMessageFn - Function to send the message
   * @returns {Promise<Object>} Result
   */
  static async executePresenceSequence(userId, phone, priority, sendMessageFn) {
    try {
      // Step 1: Set online and show typing
      const presenceResult = await this.setOnlineAndTyping(
        userId,
        phone,
        priority
      );
      if (!presenceResult.success) {
        console.warn(
          `⚠️ Presence setup failed, proceeding with message send: ${presenceResult.error}`
        );
      }

      // Step 2: Send the message
      console.log(`📤 Sending message after presence sequence`);
      const messageResult = await sendMessageFn();

      // Step 3: Set offline after a brief delay
      setTimeout(async () => {
        await this.setOffline(userId, phone);
      }, 1000);

      return {
        success: true,
        presenceResult,
        messageResult,
      };
    } catch (error) {
      console.error(
        `❌ Presence sequence failed for user ${userId}:`,
        error.message
      );

      // Try to set offline even if sequence failed
      try {
        await this.setOffline(userId, phone);
      } catch (offlineError) {
        console.error(
          `❌ Failed to set offline after error:`,
          offlineError.message
        );
      }

      throw error;
    }
  }
}
