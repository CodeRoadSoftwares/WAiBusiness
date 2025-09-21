import redis from "../../config/redis.js";

/**
 * Connection lock utility to prevent multiple simultaneous connections
 */
export class ConnectionLock {
  constructor() {
    this.redis = redis;
    this.lockPrefix = "connection_lock:";
    this.lockTimeout = 30000; // 30 seconds
  }

  /**
   * Acquire a connection lock
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - True if lock acquired, false if already locked
   */
  async acquireLock(userId) {
    const lockKey = `${this.lockPrefix}${userId}`;

    try {
      const result = await this.redis.set(
        lockKey,
        "locked",
        "PX",
        this.lockTimeout,
        "NX"
      );

      return result === "OK";
    } catch (error) {
      console.error(`Failed to acquire lock for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Release a connection lock
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - True if lock released
   */
  async releaseLock(userId) {
    const lockKey = `${this.lockPrefix}${userId}`;

    try {
      const result = await this.redis.del(lockKey);
      return result === 1;
    } catch (error) {
      console.error(`Failed to release lock for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Check if a connection lock exists
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - True if lock exists
   */
  async isLocked(userId) {
    const lockKey = `${this.lockPrefix}${userId}`;

    try {
      const result = await this.redis.exists(lockKey);
      return result === 1;
    } catch (error) {
      console.error(`Failed to check lock for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Wait for a lock to be released
   * @param {string} userId - User ID
   * @param {number} maxWaitTime - Maximum time to wait in ms
   * @returns {Promise<boolean>} - True if lock was released
   */
  async waitForLock(userId, maxWaitTime = 10000) {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const isLocked = await this.isLocked(userId);
      if (!isLocked) {
        return true;
      }

      // Wait 100ms before checking again
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return false;
  }
}

export const connectionLock = new ConnectionLock();
