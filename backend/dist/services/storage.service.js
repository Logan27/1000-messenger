"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const sharp_1 = __importDefault(require("sharp"));
const uuid_1 = require("uuid");
const storage_1 = require("../config/storage");
const constants_1 = require("../config/constants");
const logger_util_1 = require("../utils/logger.util");
class StorageService {
    async uploadImage(file, userId) {
        this.validateImage(file);
        const imageId = (0, uuid_1.v4)();
        const timestamp = Date.now();
        const basePath = `images/${userId}/${timestamp}`;
        const imageBuffer = file.buffer;
        const imageMetadata = await (0, sharp_1.default)(imageBuffer).metadata();
        if (imageMetadata.width > constants_1.LIMITS.IMAGE_MAX_WIDTH ||
            imageMetadata.height > constants_1.LIMITS.IMAGE_MAX_HEIGHT) {
            throw new Error('Image dimensions exceed maximum allowed size');
        }
        const originalKey = `${basePath}/original.jpg`;
        const originalUrl = await this.uploadToS3(originalKey, imageBuffer, file.mimetype);
        const thumbnail = await (0, sharp_1.default)(imageBuffer)
            .resize(300, 300, { fit: 'cover', position: 'center' })
            .jpeg({ quality: 80 })
            .toBuffer();
        const thumbnailKey = `${basePath}/thumbnail.jpg`;
        const thumbnailUrl = await this.uploadToS3(thumbnailKey, thumbnail, 'image/jpeg');
        const medium = await (0, sharp_1.default)(imageBuffer)
            .resize(800, 800, { fit: 'inside' })
            .jpeg({ quality: 85 })
            .toBuffer();
        const mediumKey = `${basePath}/medium.jpg`;
        const mediumUrl = await this.uploadToS3(mediumKey, medium, 'image/jpeg');
        logger_util_1.logger.info(`Image uploaded: ${imageId} by user ${userId}`);
        const result = {
            id: imageId,
            fileName: file.originalname,
            fileType: file.mimetype,
            fileSize: file.size,
            originalUrl,
            thumbnailUrl,
            mediumUrl,
            storageKey: originalKey,
            thumbnailKey,
            mediumKey,
        };
        if (imageMetadata.width !== undefined) {
            result.width = imageMetadata.width;
        }
        if (imageMetadata.height !== undefined) {
            result.height = imageMetadata.height;
        }
        return result;
    }
    async deleteImage(storageKey, thumbnailKey, mediumKey) {
        const deletePromises = [this.deleteFromS3(storageKey)];
        if (thumbnailKey) {
            deletePromises.push(this.deleteFromS3(thumbnailKey));
        }
        if (mediumKey) {
            deletePromises.push(this.deleteFromS3(mediumKey));
        }
        await Promise.all(deletePromises);
        logger_util_1.logger.info(`Image deleted: ${storageKey}`);
    }
    async getSignedUrl(key, expiresIn = 3600) {
        const command = new client_s3_1.GetObjectCommand({
            Bucket: storage_1.S3_CONFIG.bucket,
            Key: key,
        });
        return await (0, s3_request_presigner_1.getSignedUrl)(storage_1.s3Client, command, { expiresIn });
    }
    async uploadToS3(key, buffer, contentType) {
        const command = new client_s3_1.PutObjectCommand({
            Bucket: storage_1.S3_CONFIG.bucket,
            Key: key,
            Body: buffer,
            ContentType: contentType,
            ACL: 'public-read',
        });
        await storage_1.s3Client.send(command);
        if (storage_1.S3_CONFIG.publicUrl) {
            return `${storage_1.S3_CONFIG.publicUrl}/${key}`;
        }
        return `${storage_1.S3_CONFIG.region}.amazonaws.com/${storage_1.S3_CONFIG.bucket}/${key}`;
    }
    async deleteFromS3(key) {
        const command = new client_s3_1.DeleteObjectCommand({
            Bucket: storage_1.S3_CONFIG.bucket,
            Key: key,
        });
        await storage_1.s3Client.send(command);
    }
    validateImage(file) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.mimetype)) {
            throw new Error('Invalid file type. Allowed: JPEG, PNG, GIF, WebP');
        }
        if (file.size > constants_1.LIMITS.IMAGE_MAX_SIZE) {
            throw new Error(`File size exceeds maximum of ${constants_1.LIMITS.IMAGE_MAX_SIZE / (1024 * 1024)}MB`);
        }
    }
}
exports.StorageService = StorageService;
//# sourceMappingURL=storage.service.js.map