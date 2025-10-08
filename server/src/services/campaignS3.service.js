import AWS from "aws-sdk";

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

// Upload campaign media file to S3
export const uploadCampaignMedia = async (file, campaignId = null) => {
  try {
    // Generate unique filename for campaigns folder
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const key = `campaigns/${
      campaignId ? `${campaignId}/` : ""
    }${uniqueSuffix}-${file.originalname}`;

    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        originalName: file.originalname,
        uploadedAt: new Date().toISOString(),
      },
    };

    const result = await s3.upload(uploadParams).promise();

    return {
      url: result.Location,
      key: result.Key,
      bucket: result.Bucket,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
    };
  } catch (error) {
    console.error("Error uploading campaign media to S3:", error);
    throw new Error(`Failed to upload media file: ${error.message}`);
  }
};

// Delete campaign media file from S3
export const deleteCampaignMedia = async (key) => {
  try {
    const deleteParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
    };

    await s3.deleteObject(deleteParams).promise();
    console.log(`Successfully deleted file from S3: ${key}`);
  } catch (error) {
    console.error("Error deleting campaign media from S3:", error);
    throw new Error(`Failed to delete media file: ${error.message}`);
  }
};

// Get campaign media URL
export const getCampaignMediaUrl = (key) => {
  return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};

// Generate presigned URL for private S3 objects (expires in 1 hour)
export const getPresignedUrl = (key) => {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    Expires: 3600,
  };

  return s3.getSignedUrl("getObject", params);
};

export { s3 };
