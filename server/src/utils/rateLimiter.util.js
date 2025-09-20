import redis from "../../config/redis.js";

/**
 * Redis-based rate limiter using sliding window counter
 * More accurate than fixed window and works across multiple server instances
 */
export class RateLimiter {
  constructor(options = {}) {
    this.redis = redis;
    this.windowSize = options.windowSize || 60000; // 1 minute in ms
    this.maxRequests = options.maxRequests || 20; // max requests per window
    this.keyPrefix = options.keyPrefix || "rate_limit";
  }

  /**
   * Check if request is allowed and consume a token
   * @param {string} userId - User identifier
   * @param {number} tokens - Number of tokens to consume (default: 1)
   * @returns {Promise<{allowed: boolean, remaining: number, resetTime: number}>}
   */
  async checkAndConsume(userId, tokens = 1) {
    const key = `${this.keyPrefix}:${userId}`;
    const now = Date.now();
    const windowStart = now - this.windowSize;

    try {
      // Use a simpler approach to avoid serialization issues
      // Remove expired entries first
      await this.redis.zremrangebyscore(key, 0, windowStart);

      // Count current requests in window
      const currentCount = await this.redis.zcard(key);

      // Check if we can add more requests
      if (currentCount + tokens > this.maxRequests) {
        const resetTime = now + this.windowSize;
        const waitTime = Math.max(0, this.windowSize);

        return {
          allowed: false,
          remaining: Math.max(0, this.maxRequests - currentCount),
          resetTime: resetTime,
          waitTime: waitTime,
        };
      }

      // Add new requests with current timestamp as score
      const pipeline = this.redis.pipeline();
      for (let i = 0; i < tokens; i++) {
        const score = now + i * 0.001; // Add small increment to avoid duplicates
        const member = `${now}_${i}_${Math.random().toString(36).substr(2, 9)}`; // Unique member
        pipeline.zadd(key, score, member);
      }

      // Set expiration
      pipeline.expire(key, Math.ceil(this.windowSize / 1000));

      await pipeline.exec();

      const resetTime = now + this.windowSize;

      return {
        allowed: true,
        remaining: Math.max(0, this.maxRequests - currentCount - tokens),
        resetTime: resetTime,
        waitTime: 0,
      };
    } catch (error) {
      console.error("Rate limiter error:", error);
      // Fail open - allow request if Redis is down
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime: now + this.windowSize,
        waitTime: 0,
      };
    }
  }

  /**
   * Check if request is allowed without consuming tokens
   * @param {string} userId - User identifier
   * @returns {Promise<{allowed: boolean, remaining: number, resetTime: number}>}
   */
  async check(userId) {
    const key = `${this.keyPrefix}:${userId}`;
    const now = Date.now();
    const windowStart = now - this.windowSize;

    try {
      // Remove expired entries and count current
      await this.redis.zremrangebyscore(key, 0, windowStart);
      const currentCount = await this.redis.zcard(key);

      return {
        allowed: currentCount < this.maxRequests,
        remaining: Math.max(0, this.maxRequests - currentCount),
        resetTime: now + this.windowSize,
        waitTime: currentCount >= this.maxRequests ? this.windowSize : 0,
      };
    } catch (error) {
      console.error("Rate limiter check error:", error);
      return {
        allowed: true,
        remaining: this.maxRequests,
        resetTime: now + this.windowSize,
        waitTime: 0,
      };
    }
  }

  /**
   * Reset rate limit for a user
   * @param {string} userId - User identifier
   */
  async reset(userId) {
    const key = `${this.keyPrefix}:${userId}`;
    await this.redis.del(key);
  }

  /**
   * Get current status for a user
   * @param {string} userId - User identifier
   * @returns {Promise<{count: number, remaining: number, resetTime: number}>}
   */
  async getStatus(userId) {
    const key = `${this.keyPrefix}:${userId}`;
    const now = Date.now();
    const windowStart = now - this.windowSize;

    try {
      await this.redis.zremrangebyscore(key, 0, windowStart);
      const count = await this.redis.zcard(key);

      return {
        count: count,
        remaining: Math.max(0, this.maxRequests - count),
        resetTime: now + this.windowSize,
      };
    } catch (error) {
      console.error("Rate limiter status error:", error);
      return {
        count: 0,
        remaining: this.maxRequests,
        resetTime: now + this.windowSize,
      };
    }
  }
}

// Create default rate limiter instance
export const defaultRateLimiter = new RateLimiter({
  windowSize: 60000, // 1 minute
  maxRequests: 20, // 20 messages per minute
  keyPrefix: "whatsapp_rate_limit",
});

// Create a more aggressive rate limiter for testing
export const aggressiveRateLimiter = new RateLimiter({
  windowSize: 60000, // 1 minute
  maxRequests: 5, // 5 messages per minute
  keyPrefix: "whatsapp_rate_limit_aggressive",
});
