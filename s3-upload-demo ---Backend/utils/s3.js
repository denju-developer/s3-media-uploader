// utils/s3.js
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();

// const allowedMimeTypes = ['image/jpeg', 'image/png', 'video/mp4', 'video/quicktime'];
const isAllowedMimeType = (type) => {
  return type.startsWith("image/") || type.startsWith("video/");
};

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Generate a signed URL for uploading to S3
 * @param {string} fileType - The MIME type of the file (e.g., image/png)
 * @returns {Promise<{signedUrl: string, fileName: string}>}
 */
export const getSignedUploadUrl = async (fileType) => {
  //   if (!allowedMimeTypes.includes(fileType)) {
  //     const supported = allowedMimeTypes.join(", ");
  //     throw new Error(`Invalid file type. Supported types: ${supported}`);
  //   }

  if (!isAllowedMimeType(fileType)) {
    throw new Error("Only image and video uploads are allowed");
  }

  const fileExtension = fileType.split("/")[1];
  const fileName = `${uuidv4()}.${fileExtension}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileName,
    ContentType: fileType,
    ACL: "public-read",
  });

  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
  const publicUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

  return {
    signedUrl,
    fileName,
    publicUrl,
  };
};
