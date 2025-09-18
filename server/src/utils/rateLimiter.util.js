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
      // Use Lua script for atomic operations
      const luaScript = `
        local key = KEYS[1]
        local window_start = tonumber(ARGV[1])
        local now = tonumber(ARGV[2])
        local window_size = tonumber(ARGV[3])
        local max_requests = tonumber(ARGV[4])
        local tokens = tonumber(ARGV[5])
        
        -- Remove expired entries
        redis.call('ZREMRANGEBYSCORE', key, 0, window_start)
        
        -- Count current requests in window
        local current_count = redis.call('ZCARD', key)
        
        -- Check if we can add more requests
        if current_count + tokens > max_requests then
          return {0, current_count, now + window_size}
        end
        
        -- Add new requests with current timestamp as score
        for i = 1, tokens do
          redis.call('ZADD', key, now + i, now + i)
        end
        
        -- Set expiration
        redis.call('EXPIRE', key, math.ceil(window_size / 1000))
        
        return {1, max_requests - current_count - tokens, now + window_size}
      `;

      const result = await this.redis.eval(
        luaScript,
        1,
        key,
        windowStart,
        now,
        this.windowSize,
        this.maxRequests,
        tokens
      );

      const [allowed, remaining, resetTime] = result;

      return {
        allowed: allowed === 1,
        remaining: remaining,
        resetTime: resetTime,
        waitTime: allowed === 0 ? Math.max(0, resetTime - now) : 0,
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
