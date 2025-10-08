import AWS from "aws-sdk";
import multer from "multer";
import multerS3 from "multer-s3";

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

// Multer-S3 config.
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET_NAME,
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
    fileSize: 6 * 1024 * 1024, // 6MB limit per file
  },
});

// Upload single file
const uploadSingle = upload.single("media");

// Upload multiple files
const uploadMultiple = upload.array("media", 10); // Max 10 files

export { uploadSingle, uploadMultiple, s3 };
