import { S3Client } from '@aws-sdk/client-s3';
import { config } from './env';

export const s3Client = new S3Client({
  region: config.AWS_REGION,
  endpoint: config.S3_ENDPOINT, // For MinIO compatibility
  credentials: {
    accessKeyId: config.S3_ACCESS_KEY,
    secretAccessKey: config.S3_SECRET_KEY,
  },
  forcePathStyle: true, // Required for MinIO
});

export const S3_CONFIG = {
  bucket: config.S3_BUCKET,
  region: config.AWS_REGION,
  publicUrl: config.S3_PUBLIC_URL,
};
