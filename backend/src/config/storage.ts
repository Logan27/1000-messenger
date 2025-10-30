import {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
  PutBucketCorsCommand,
  ListBucketsCommand,
} from '@aws-sdk/client-s3';
import { config } from './env';
import { logger } from '../utils/logger.util';

// Initialize S3 client with MinIO/S3 configuration
export const s3Client = new S3Client({
  region: config.AWS_REGION,
  endpoint: config.S3_ENDPOINT,
  credentials: {
    accessKeyId: config.S3_ACCESS_KEY,
    secretAccessKey: config.S3_SECRET_KEY,
  },
  forcePathStyle: true, // Required for MinIO and some S3-compatible services
  maxAttempts: 3, // Retry failed requests up to 3 times
});

// Storage configuration constants
export const S3_CONFIG = {
  bucket: config.S3_BUCKET,
  region: config.AWS_REGION,
  publicUrl: config.S3_PUBLIC_URL,
  endpoint: config.S3_ENDPOINT,
  
  // Image storage paths
  paths: {
    images: 'images',
    avatars: 'avatars',
    attachments: 'attachments',
  },
  
  // Image size configurations
  imageSizes: {
    original: { quality: 85, progressive: true },
    medium: { maxWidth: 800, maxHeight: 800, quality: 80 },
    thumbnail: { width: 300, height: 300, quality: 75 },
  },
  
  // URL expiration for signed URLs (in seconds)
  signedUrlExpiry: 3600, // 1 hour
  
  // CORS configuration for browser uploads
  cors: [
    {
      AllowedHeaders: ['*'],
      AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
      AllowedOrigins: [config.FRONTEND_URL],
      ExposeHeaders: ['ETag'],
      MaxAgeSeconds: 3600,
    },
  ],
};

/**
 * Initialize storage by verifying bucket exists and creating if necessary
 */
export async function initializeStorage(): Promise<void> {
  try {
    logger.info('Initializing storage...');
    
    // Test connection by listing buckets
    await testStorageConnection();
    
    // Check if bucket exists
    const bucketExists = await checkBucketExists(S3_CONFIG.bucket);
    
    if (!bucketExists) {
      logger.warn(`Bucket ${S3_CONFIG.bucket} does not exist, creating...`);
      await createBucket(S3_CONFIG.bucket);
      logger.info(`Bucket ${S3_CONFIG.bucket} created successfully`);
    } else {
      logger.info(`Bucket ${S3_CONFIG.bucket} exists`);
    }
    
    // Configure CORS for the bucket
    await configureBucketCors(S3_CONFIG.bucket);
    
    logger.info('Storage initialization complete');
  } catch (error) {
    logger.error('Storage initialization failed', error);
    throw error;
  }
}

/**
 * Test storage connection
 */
export async function testStorageConnection(): Promise<boolean> {
  try {
    const command = new ListBucketsCommand({});
    await s3Client.send(command);
    logger.info('Storage connection successful');
    return true;
  } catch (error) {
    logger.error('Storage connection failed', error);
    throw new Error('Failed to connect to storage service');
  }
}

/**
 * Check if a bucket exists
 */
async function checkBucketExists(bucketName: string): Promise<boolean> {
  try {
    const command = new HeadBucketCommand({ Bucket: bucketName });
    await s3Client.send(command);
    return true;
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    // If we get a 403, bucket exists but we don't have access
    if (error.$metadata?.httpStatusCode === 403) {
      logger.warn(`Bucket ${bucketName} exists but access denied`);
      return true;
    }
    throw error;
  }
}

/**
 * Create a new bucket
 */
async function createBucket(bucketName: string): Promise<void> {
  try {
    const command = new CreateBucketCommand({
      Bucket: bucketName,
      // Only include CreateBucketConfiguration for AWS regions outside us-east-1
      ...(config.AWS_REGION !== 'us-east-1' && !config.S3_ENDPOINT.includes('minio')
        ? {
            CreateBucketConfiguration: {
              LocationConstraint: config.AWS_REGION as any,
            },
          }
        : {}),
    });
    await s3Client.send(command);
  } catch (error: any) {
    // Bucket might have been created by another instance
    if (error.name === 'BucketAlreadyOwnedByYou' || error.name === 'BucketAlreadyExists') {
      logger.info(`Bucket ${bucketName} already exists`);
      return;
    }
    throw error;
  }
}

/**
 * Configure CORS for bucket
 */
async function configureBucketCors(bucketName: string): Promise<void> {
  try {
    const command = new PutBucketCorsCommand({
      Bucket: bucketName,
      CORSConfiguration: {
        CORSRules: S3_CONFIG.cors,
      },
    });
    await s3Client.send(command);
    logger.info(`CORS configured for bucket ${bucketName}`);
  } catch (error: any) {
    // Some storage services (like MinIO in certain configs) might not support CORS
    if (error.name === 'NotImplemented') {
      logger.warn('CORS configuration not supported by storage service');
      return;
    }
    logger.error('Failed to configure CORS', error);
    // Don't throw - CORS is not critical for basic functionality
  }
}

/**
 * Health check for storage service
 */
export async function healthCheck(): Promise<{ healthy: boolean; message: string }> {
  try {
    await testStorageConnection();
    const bucketExists = await checkBucketExists(S3_CONFIG.bucket);
    
    if (!bucketExists) {
      return {
        healthy: false,
        message: `Bucket ${S3_CONFIG.bucket} does not exist`,
      };
    }
    
    return {
      healthy: true,
      message: 'Storage service is healthy',
    };
  } catch (error: any) {
    return {
      healthy: false,
      message: error.message || 'Storage health check failed',
    };
  }
}

/**
 * Get storage information
 */
export function getStorageInfo() {
  return {
    type: config.S3_ENDPOINT.includes('minio') ? 'MinIO' : 'S3',
    bucket: S3_CONFIG.bucket,
    region: S3_CONFIG.region,
    endpoint: S3_CONFIG.endpoint,
  };
}
