import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

if (
  !process.env.AWS_REGION ||
  !process.env.AWS_ACCESS_KEY_ID ||
  !process.env.AWS_SECRET_ACCESS_KEY ||
  !process.env.AWS_S3_BUCKET ||
  !process.env.CLOUDFRONT_URL
) {
  throw new Error(
    "Missing required AWS configuration. Please check your environment variables."
  );
}

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

interface PresignedUrlParams {
  filename: string;
  contentType: string;
}

export async function generatePresignedUrl({
  filename,
  contentType,
}: PresignedUrlParams) {
  try {
    const key = `${randomUUID()}-${filename}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      ContentType: contentType,
      CacheControl: "max-age=31536000", // 1 year cache
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

    return { url, key };
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    throw new Error("Failed to generate upload URL");
  }
}

export async function finalizeUpload(key: string) {
  try {
    // Return the CloudFront URL for the uploaded image
    return `${process.env.CLOUDFRONT_URL}/${key}`;
  } catch (error) {
    console.error("Error finalizing upload:", error);
    throw new Error("Failed to finalize upload");
  }
}

export async function listImagesFromS3() {
  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.AWS_S3_BUCKET,
      Prefix: "",
    });

    const response = await s3.send(command);

    return (
      response.Contents?.map((item) => ({
        id: item.Key!,
        url: `${process.env.CLOUDFRONT_URL}/${item.Key}`,
        filename: item.Key!.split("-").slice(1).join("-"),
        lastModified: item.LastModified,
        size: item.Size,
      })) || []
    );
  } catch (error) {
    console.error("Error listing images:", error);
    throw new Error("Failed to list images");
  }
}

// Helper function to validate environment variables
export function validateStorageConfig() {
  const required = {
    AWS_REGION: process.env.AWS_REGION,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
    CLOUDFRONT_URL: process.env.CLOUDFRONT_URL,
  };

  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
}
