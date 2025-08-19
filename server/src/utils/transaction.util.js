import mongoose from "mongoose";

/**
 * Utility class for handling MongoDB transactions
 * Ensures ACID properties across multiple operations
 */
export class TransactionManager {
  /**
   * Execute multiple operations within a single transaction
   * @param {Function} operations - Function containing all database operations
   * @param {Object} options - Transaction options
   * @returns {Promise<any>} - Result of the operations
   */
  static async executeTransaction(operations, options = {}) {
    const session = await mongoose.startSession();

    try {
      let result;

      await session.withTransaction(async () => {
        result = await operations(session);
      }, options);

      return result;
    } catch (error) {
      // Transaction automatically rolls back on error
      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Execute operations with retry logic for transient failures
   * @param {Function} operations - Function containing all database operations
   * @param {number} maxRetries - Maximum number of retry attempts
   * @returns {Promise<any>} - Result of the operations
   */
  static async executeTransactionWithRetry(operations, maxRetries = 3) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.executeTransaction(operations);
      } catch (error) {
        lastError = error;

        // Only retry on transient errors (network issues, timeouts)
        if (
          error.name === "MongoNetworkError" ||
          error.name === "MongoTimeoutError"
        ) {
          console.log(`Transaction attempt ${attempt} failed, retrying...`);
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
          continue;
        }

        // Don't retry on business logic errors
        break;
      }
    }

    throw lastError;
  }
}

export default TransactionManager;
