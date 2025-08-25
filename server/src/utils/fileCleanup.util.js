import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class FileCleanupUtil {
  /**
   * Clean up temporary files
   * @param {string} filePath - Path to the file to delete
   */
  static cleanupFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`File cleaned up: ${filePath}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Failed to cleanup file ${filePath}:`, error);
      return false;
    }
  }

  /**
   * Clean up multiple files
   * @param {Array} filePaths - Array of file paths to delete
   */
  static cleanupMultipleFiles(filePaths) {
    const results = [];
    filePaths.forEach((filePath) => {
      results.push({
        path: filePath,
        success: this.cleanupFile(filePath),
      });
    });
    return results;
  }

  /**
   * Clean up old temporary files (older than specified hours)
   * @param {number} hoursOld - Files older than this many hours will be deleted
   */
  static cleanupOldTempFiles(hoursOld = 24) {
    try {
      const tempDir = path.join(__dirname, "../../uploads/temp");
      if (!fs.existsSync(tempDir)) return;

      const files = fs.readdirSync(tempDir);
      const cutoffTime = Date.now() - hoursOld * 60 * 60 * 1000;
      let cleanedCount = 0;

      files.forEach((filename) => {
        const filePath = path.join(tempDir, filename);
        const stats = fs.statSync(filePath);

        if (stats.mtime.getTime() < cutoffTime) {
          if (this.cleanupFile(filePath)) {
            cleanedCount++;
          }
        }
      });

      console.log(`Cleaned up ${cleanedCount} old temporary files`);
      return cleanedCount;
    } catch (error) {
      console.error("Failed to cleanup old temp files:", error);
      return 0;
    }
  }

  /**
   * Get file size in human readable format
   * @param {number} bytes - File size in bytes
   * @returns {string} Human readable file size
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * Check if file exists and is accessible
   * @param {string} filePath - Path to check
   * @returns {boolean} True if file exists and is accessible
   */
  static isFileAccessible(filePath) {
    try {
      return (
        fs.existsSync(filePath) &&
        fs.accessSync(filePath, fs.constants.R_OK) === undefined
      );
    } catch (error) {
      return false;
    }
  }
}

export default FileCleanupUtil;
