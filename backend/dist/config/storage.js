"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3_CONFIG = exports.s3Client = void 0;
exports.initializeStorage = initializeStorage;
exports.testStorageConnection = testStorageConnection;
exports.healthCheck = healthCheck;
exports.getStorageInfo = getStorageInfo;
const client_s3_1 = require("@aws-sdk/client-s3");
const env_1 = require("./env");
const logger_util_1 = require("../utils/logger.util");
exports.s3Client = new client_s3_1.S3Client({
    region: env_1.config.AWS_REGION,
    endpoint: env_1.config.S3_ENDPOINT,
    credentials: {
        accessKeyId: env_1.config.S3_ACCESS_KEY,
        secretAccessKey: env_1.config.S3_SECRET_KEY,
    },
    forcePathStyle: true,
    maxAttempts: 3,
});
exports.S3_CONFIG = {
    bucket: env_1.config.S3_BUCKET,
    region: env_1.config.AWS_REGION,
    publicUrl: env_1.config.S3_PUBLIC_URL,
    endpoint: env_1.config.S3_ENDPOINT,
    paths: {
        images: 'images',
        avatars: 'avatars',
        attachments: 'attachments',
    },
    imageSizes: {
        original: { quality: 85, progressive: true },
        medium: { maxWidth: 800, maxHeight: 800, quality: 80 },
        thumbnail: { width: 300, height: 300, quality: 75 },
    },
    signedUrlExpiry: 3600,
    cors: [
        {
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
            AllowedOrigins: [env_1.config.FRONTEND_URL],
            ExposeHeaders: ['ETag'],
            MaxAgeSeconds: 3600,
        },
    ],
};
async function initializeStorage() {
    try {
        logger_util_1.logger.info('Initializing storage...');
        await testStorageConnection();
        const bucketExists = await checkBucketExists(exports.S3_CONFIG.bucket);
        if (!bucketExists) {
            logger_util_1.logger.warn(`Bucket ${exports.S3_CONFIG.bucket} does not exist, creating...`);
            await createBucket(exports.S3_CONFIG.bucket);
            logger_util_1.logger.info(`Bucket ${exports.S3_CONFIG.bucket} created successfully`);
        }
        else {
            logger_util_1.logger.info(`Bucket ${exports.S3_CONFIG.bucket} exists`);
        }
        await configureBucketCors(exports.S3_CONFIG.bucket);
        logger_util_1.logger.info('Storage initialization complete');
    }
    catch (error) {
        logger_util_1.logger.error('Storage initialization failed', error);
        throw error;
    }
}
async function testStorageConnection() {
    try {
        const command = new client_s3_1.ListBucketsCommand({});
        await exports.s3Client.send(command);
        logger_util_1.logger.info('Storage connection successful');
        return true;
    }
    catch (error) {
        logger_util_1.logger.error('Storage connection failed', error);
        throw new Error('Failed to connect to storage service');
    }
}
async function checkBucketExists(bucketName) {
    try {
        const command = new client_s3_1.HeadBucketCommand({ Bucket: bucketName });
        await exports.s3Client.send(command);
        return true;
    }
    catch (error) {
        if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
            return false;
        }
        if (error.$metadata?.httpStatusCode === 403) {
            logger_util_1.logger.warn(`Bucket ${bucketName} exists but access denied`);
            return true;
        }
        throw error;
    }
}
async function createBucket(bucketName) {
    try {
        const command = new client_s3_1.CreateBucketCommand({
            Bucket: bucketName,
            ...(env_1.config.AWS_REGION !== 'us-east-1' && !env_1.config.S3_ENDPOINT.includes('minio')
                ? {
                    CreateBucketConfiguration: {
                        LocationConstraint: env_1.config.AWS_REGION,
                    },
                }
                : {}),
        });
        await exports.s3Client.send(command);
    }
    catch (error) {
        if (error.name === 'BucketAlreadyOwnedByYou' || error.name === 'BucketAlreadyExists') {
            logger_util_1.logger.info(`Bucket ${bucketName} already exists`);
            return;
        }
        throw error;
    }
}
async function configureBucketCors(bucketName) {
    try {
        const command = new client_s3_1.PutBucketCorsCommand({
            Bucket: bucketName,
            CORSConfiguration: {
                CORSRules: exports.S3_CONFIG.cors,
            },
        });
        await exports.s3Client.send(command);
        logger_util_1.logger.info(`CORS configured for bucket ${bucketName}`);
    }
    catch (error) {
        if (error.name === 'NotImplemented') {
            logger_util_1.logger.warn('CORS configuration not supported by storage service');
            return;
        }
        logger_util_1.logger.error('Failed to configure CORS', error);
    }
}
async function healthCheck() {
    try {
        await testStorageConnection();
        const bucketExists = await checkBucketExists(exports.S3_CONFIG.bucket);
        if (!bucketExists) {
            return {
                healthy: false,
                message: `Bucket ${exports.S3_CONFIG.bucket} does not exist`,
            };
        }
        return {
            healthy: true,
            message: 'Storage service is healthy',
        };
    }
    catch (error) {
        return {
            healthy: false,
            message: error.message || 'Storage health check failed',
        };
    }
}
function getStorageInfo() {
    return {
        type: env_1.config.S3_ENDPOINT.includes('minio') ? 'MinIO' : 'S3',
        bucket: exports.S3_CONFIG.bucket,
        region: exports.S3_CONFIG.region,
        endpoint: exports.S3_CONFIG.endpoint,
    };
}
//# sourceMappingURL=storage.js.map