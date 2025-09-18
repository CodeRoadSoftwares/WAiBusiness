import redis from "../../config/redis.js";
import os from "os";
import { campaignQueue } from "../queue/queues/campaign.queue.js";

/**
 * Dynamic configuration service for adaptive system behavior
 */
export class DynamicConfigService {
  constructor() {
    this.redis = redis;
    this.configKey = "system:config";
    this.defaultConfig = {
      batchSize: 50,
      maxConcurrency: 3,
      rateLimitPerMinute: 20,
      memoryThreshold: 0.8, // 80% memory usage threshold
      cpuThreshold: 0.7, // 70% CPU usage threshold
    };
  }

  /**
   * Get current system configuration
   * @returns {Promise<Object>} Current configuration
   */
  async getConfig() {
    try {
      const config = await this.redis.get(this.configKey);
      return config ? JSON.parse(config) : this.defaultConfig;
    } catch (error) {
      console.error("Failed to get dynamic config:", error);
      return this.defaultConfig;
    }
  }

  /**
   * Update system configuration
   * @param {Object} updates - Configuration updates
   * @returns {Promise<boolean>} Success status
   */
  async updateConfig(updates) {
    try {
      const currentConfig = await this.getConfig();
      const newConfig = { ...currentConfig, ...updates };
      await this.redis.set(this.configKey, JSON.stringify(newConfig));
      return true;
    } catch (error) {
      console.error("Failed to update dynamic config:", error);
      return false;
    }
  }

  /**
   * Get adaptive batch size based on message type and system load
   * @param {string} messageType - Type of message (text, media, mixed)
   * @param {Object} systemMetrics - Current system metrics
   * @returns {Promise<number>} Recommended batch size
   */
  async getAdaptiveBatchSize(messageType, systemMetrics = {}) {
    const config = await this.getConfig();
    let baseBatchSize = config.batchSize;

    // Adjust based on message type
    const messageTypeMultipliers = {
      text: 1.0,
      media: 0.5, // Media messages are heavier
      mixed: 0.7,
      template: 0.8,
    };

    baseBatchSize *= messageTypeMultipliers[messageType] || 1.0;

    // Adjust based on system load
    if (systemMetrics.memoryUsage > config.memoryThreshold) {
      baseBatchSize *= 0.5; // Reduce batch size if memory is high
    }

    if (systemMetrics.cpuUsage > config.cpuThreshold) {
      baseBatchSize *= 0.7; // Reduce batch size if CPU is high
    }

    // Ensure minimum and maximum bounds
    return Math.max(10, Math.min(200, Math.round(baseBatchSize)));
  }

  /**
   * Get adaptive concurrency based on system load
   * @param {Object} systemMetrics - Current system metrics
   * @returns {Promise<number>} Recommended concurrency
   */
  async getAdaptiveConcurrency(systemMetrics = {}) {
    const config = await this.getConfig();
    let concurrency = config.maxConcurrency;

    // Reduce concurrency if system is under load
    if (systemMetrics.memoryUsage > config.memoryThreshold) {
      concurrency = Math.max(1, Math.round(concurrency * 0.5));
    }

    if (systemMetrics.cpuUsage > config.cpuThreshold) {
      concurrency = Math.max(1, Math.round(concurrency * 0.7));
    }

    return concurrency;
  }

  /**
   * Get adaptive rate limit based on WhatsApp responses
   * @param {string} userId - User ID
   * @param {Object} responseMetrics - WhatsApp response metrics
   * @returns {Promise<number>} Recommended rate limit
   */
  async getAdaptiveRateLimit(userId, responseMetrics = {}) {
    const config = await this.getConfig();
    let rateLimit = config.rateLimitPerMinute;

    // Reduce rate limit if error rate is high
    if (responseMetrics.errorRate > 0.1) {
      // 10% error rate
      rateLimit *= 0.5;
    }

    // Increase rate limit if success rate is very high
    if (responseMetrics.successRate > 0.95) {
      // 95% success rate
      rateLimit = Math.min(rateLimit * 1.2, 30); // Cap at 30 per minute
    }

    return Math.max(5, Math.round(rateLimit)); // Minimum 5 per minute
  }

  /**
   * Get real system metrics
   * @returns {Promise<Object>} System metrics
   */
  async getSystemMetrics() {
    try {
      // Memory usage
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      const memoryUsage = usedMemory / totalMemory;

      // CPU usage (simplified - in production, use a more sophisticated approach)
      const cpus = os.cpus();
      const cpuUsage = this.calculateCpuUsage(cpus);

      // Queue metrics
      const queueMetrics = await this.getQueueMetrics();

      // Worker metrics
      const workerMetrics = await this.getWorkerMetrics();

      return {
        memoryUsage: Math.round(memoryUsage * 100) / 100, // Round to 2 decimal places
        cpuUsage: Math.round(cpuUsage * 100) / 100,
        queueDepth: queueMetrics.depth,
        activeWorkers: workerMetrics.active,
        waitingJobs: queueMetrics.waiting,
        processingJobs: queueMetrics.processing,
        completedJobs: queueMetrics.completed,
        failedJobs: queueMetrics.failed,
        systemLoad: os.loadavg()[0], // 1-minute load average
        uptime: os.uptime(),
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error("Failed to get system metrics:", error);
      // Return safe defaults if metrics collection fails
      return {
        memoryUsage: 0.5,
        cpuUsage: 0.3,
        queueDepth: 0,
        activeWorkers: 0,
        waitingJobs: 0,
        processingJobs: 0,
        completedJobs: 0,
        failedJobs: 0,
        systemLoad: 0,
        uptime: 0,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Calculate CPU usage percentage
   * @param {Array} cpus - CPU information from os.cpus()
   * @returns {number} CPU usage percentage
   */
  calculateCpuUsage(cpus) {
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach((cpu) => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 1 - idle / total;

    return Math.max(0, Math.min(1, usage)); // Clamp between 0 and 1
  }

  /**
   * Get queue metrics
   * @returns {Promise<Object>} Queue metrics
   */
  async getQueueMetrics() {
    try {
      const [waiting, processing, completed, failed] = await Promise.all([
        campaignQueue.getWaiting(),
        campaignQueue.getActive(),
        campaignQueue.getCompleted(),
        campaignQueue.getFailed(),
      ]);

      return {
        depth: waiting.length + processing.length,
        waiting: waiting.length,
        processing: processing.length,
        completed: completed.length,
        failed: failed.length,
      };
    } catch (error) {
      console.error("Failed to get queue metrics:", error);
      return {
        depth: 0,
        waiting: 0,
        processing: 0,
        completed: 0,
        failed: 0,
      };
    }
  }

  /**
   * Get worker metrics
   * @returns {Promise<Object>} Worker metrics
   */
  async getWorkerMetrics() {
    try {
      // This is a simplified approach - in production, you might want to track workers differently
      const processing = await campaignQueue.getActive();
      return {
        active: processing.length,
        total: 1, // Assuming single worker instance for now
      };
    } catch (error) {
      console.error("Failed to get worker metrics:", error);
      return {
        active: 0,
        total: 0,
      };
    }
  }

  /**
   * Auto-adjust configuration based on system performance
   * @returns {Promise<boolean>} Success status
   */
  async autoAdjust() {
    try {
      const metrics = await this.getSystemMetrics();
      const updates = {};

      // Adjust batch size
      updates.batchSize = await this.getAdaptiveBatchSize("text", metrics);

      // Adjust concurrency
      updates.maxConcurrency = await this.getAdaptiveConcurrency(metrics);

      await this.updateConfig(updates);
      console.log("Auto-adjusted configuration:", updates);
      return true;
    } catch (error) {
      console.error("Failed to auto-adjust configuration:", error);
      return false;
    }
  }

  /**
   * Reset configuration to defaults
   * @returns {Promise<boolean>} Success status
   */
  async resetToDefaults() {
    return await this.updateConfig(this.defaultConfig);
  }
}

// Create singleton instance
export const dynamicConfigService = new DynamicConfigService();

// Auto-adjust configuration every 5 minutes
setInterval(() => {
  dynamicConfigService.autoAdjust().catch(console.error);
}, 300000); // 5 minutes
