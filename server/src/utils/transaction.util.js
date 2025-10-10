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

  /**
   * Execute a Mongo transaction with a compensation hook for external side effects.
   * Useful when you have non-transactional work (like S3 uploads) that must be
   * cleaned up if the DB transaction fails.
   *
   * NOTE: Do NOT perform external side effects inside the withTransaction callback,
   * because the driver may retry the callback on transient errors, which could
   * duplicate side effects. Instead, do external work before calling this method,
   * and pass a compensation function that undoes it if we fail.
   *
   * @param {Function} operations - async (session) => any — DB work only
   * @param {Function} compensate - async (error) => void — cleanup external effects
   * @param {Object} options - Transaction options
   */
  static async executeTransactionWithCompensation(
    operations,
    compensate,
    options = {}
  ) {
    const session = await mongoose.startSession();
    try {
      let result;
      await session.withTransaction(async () => {
        result = await operations(session);
      }, options);
      return result;
    } catch (error) {
      // Transaction rolled back — attempt compensation for external side effects
      try {
        if (typeof compensate === "function") {
          await compensate(error);
        }
      } catch (compErr) {
        // Log compensation failure but prefer surfacing original error
        console.error("Compensation hook failed:", compErr);
      }
      throw error;
    } finally {
      await session.endSession();
    }
  }
}

export default TransactionManager;
