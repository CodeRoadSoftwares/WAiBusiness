import multer from "multer";
import multerS3 from "multer-s3";
import { S3Client } from "@aws-sdk/client-s3";

// Configure AWS SDK v3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Factory to create multer uploaders (allows different ACLs)
function createUploader(options = {}) {
  const { acl } = options;
  return multer({
    storage: multerS3({
      s3: s3,
      bucket: process.env.S3_BUCKET_NAME,
      acl, // e.g., 'public-read' for public media
      metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
      },
      key: function (req, file, cb) {
        // Generate unique filename (optional: add timestamp)
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, `media/${uniqueSuffix}-${file.originalname}`);
      },
      contentType: multerS3.AUTO_CONTENT_TYPE, // Automatically set content type
    }),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit per file
    },
  });
}

// Default uploader (private objects)
const upload = createUploader();
// Public uploader (objects readable by anyone)
const uploadPublic = createUploader({ acl: "public-read" });

// Upload single file
const uploadSingle = upload.single("media");

// Upload multiple files
const uploadMultiple = upload.array("media", 10); // Max 10 files
const uploadMultiplePublic = uploadPublic.array("media", 10);

export { uploadSingle, uploadMultiple, uploadMultiplePublic, s3 };
