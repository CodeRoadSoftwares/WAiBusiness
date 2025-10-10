import { MediaRepository } from "../repositories/media.repository.js";
import { TransactionManager } from "../../../utils/transaction.util.js";
import { s3 } from "../../../services/s3.service.js";
import { DeleteObjectsCommand } from "@aws-sdk/client-s3";
import getMediaManager from "./getMedia.manager.js";

// Normalize multer-s3 file objects coming from uploadMultiple
const uploadFilesToS3 = async (files) => {
  // Files are already uploaded by multer-s3; return normalized metadata
  return files.map((file) => ({
    url: file.location,
    key: file.key,
    originalName: file.originalname,
    size: file.size,
    mimeType: file.mimetype,
  }));
};

// Infer our normalized media type from a MIME type
const inferTypeFromMime = (mimeType = "") => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return "document"; // pdf, msword, spreadsheets, etc.
};

// Delete a list of S3 objects by their keys
const deleteS3Objects = async (keys) => {
  if (!keys || keys.length === 0) return;
  const objects = keys.map((Key) => ({ Key }));
  const command = new DeleteObjectsCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Delete: { Objects: objects, Quiet: true },
  });
  await s3.send(command);
};

// Manager: persist media docs in a single transaction; if DB fails, cleanup S3 uploads
export const addMediaManager = async (userId, files, options = {}) => {
  if (!files || files.length === 0) {
    throw new Error("No files provided");
  }

  // Files are already uploaded to S3 by multer-s3 in the route layer
  const uploaded = await uploadFilesToS3(files);

  const mediaDocs = uploaded.map((f) => ({
    userId,
    url: f.url,
    s3Key: f.key,
    type: options.type || inferTypeFromMime(f.mimeType),
    caption: options.caption || undefined,
    fileName: f.originalName,
    mimeType: f.mimeType,
  }));

  const s3Keys = uploaded.map((f) => f.key);

  // Try transaction first; if not supported (no replica set), fallback to non-transactional insert
  try {
    const created = await TransactionManager.executeTransactionWithCompensation(
      async (session) => {
        const result = await MediaRepository.addManyMedia(mediaDocs, session);
        return result;
      },
      async () => {
        // Compensation: delete uploaded S3 objects if DB transaction fails
        await deleteS3Objects(s3Keys);
      }
    );
    return created;
  } catch (error) {
    const message = String(error?.message || "");
    const isTxnUnsupported =
      message.includes("replica set") ||
      message.includes("Transaction numbers are only allowed") ||
      message.includes("transactions are not supported");

    if (!isTxnUnsupported) throw error;

    // Fallback: insert without session; if DB fails, cleanup S3
    try {
      const created = await MediaRepository.addManyMedia(mediaDocs, undefined);
      return created;
    } catch (dbErr) {
      await deleteS3Objects(s3Keys);
      throw dbErr;
    }
  }
};

export const MediaManager = {
  addMediaManager,
  getMediaManager,
};
