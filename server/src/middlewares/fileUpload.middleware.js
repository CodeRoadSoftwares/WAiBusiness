import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../../uploads");
const mediaDir = path.join(uploadsDir, "media");
const tempDir = path.join(uploadsDir, "temp");

// Ensure directories exist
[uploadsDir, mediaDir, tempDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage for media files (campaign media, profile pictures, etc.)
const mediaStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, mediaDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

// Storage for temporary files (audience files, etc.)
const tempStorage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  // Allow common file types
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "video/mp4",
    "video/avi",
    "video/mov",
    "video/wmv",
    "audio/mp3",
    "audio/wav",
    "audio/m4a",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
};

// Custom storage function that uses different storage for different file types
const customStorage = {
  _handleFile: (req, file, cb) => {
    // Use memory storage for audience files (so we can access buffer)
    if (file.fieldname === "audienceFile") {
      return tempStorage._handleFile(req, file, cb);
    }
    // Use disk storage for media files
    return mediaStorage._handleFile(req, file, cb);
  },

  _removeFile: (req, file, cb) => {
    // Use memory storage for audience files
    if (file.fieldname === "audienceFile") {
      return tempStorage._removeFile(req, file, cb);
    }
    // Use disk storage for media files
    return mediaStorage._removeFile(req, file, cb);
  },
};

// Multer instances for different use cases
export const uploadMedia = multer({
  storage: mediaStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 2, // Allow up to 2 files total
    fieldSize: 2 * 1024 * 1024, // 2MB field size limit
  },
});

// Custom multer instance for campaigns that uses memory storage initially
export const uploadCampaignFiles = multer({
  storage: tempStorage, // Use memory storage for all files initially
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 2, // Allow up to 2 files total
    fieldSize: 2 * 1024 * 1024, // 2MB field size limit
  },
});

// Function to save media file to disk after successful campaign creation
export const saveMediaFileToDisk = (mediaFile) => {
  return new Promise((resolve, reject) => {
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 15);
      const fileExtension = path.extname(mediaFile.originalname);
      const filename = `${timestamp}_${randomSuffix}${fileExtension}`;

      // Create uploads/media directory if it doesn't exist
      const uploadDir = path.join(process.cwd(), "uploads", "media");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, filename);

      // Write buffer to disk
      fs.writeFileSync(filePath, mediaFile.buffer);

      resolve({
        filename,
        path: filePath,
        url: `/uploads/media/${filename}`,
      });
    } catch (error) {
      reject(error);
    }
  });
};

export const uploadAudienceFile = multer({
  storage: tempStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1,
  },
});

export const uploadMultipleFiles = multer({
  storage: mediaStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5,
  },
});

// Helper function to clean up temporary files
export const cleanupTempFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// Function to get file URL for existing files
export const getFileUrl = (filename) => {
  return `/uploads/media/${filename}`;
};
