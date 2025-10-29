import { 
  PutObjectCommand, 
  GetObjectCommand,
  DeleteObjectCommand 
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { s3Client, S3_CONFIG } from '../config/storage';
import { LIMITS } from '../config/constants';
import { logger } from '../utils/logger.util';

export interface UploadResult {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  originalUrl: string;
  thumbnailUrl?: string;
  mediumUrl?: string;
  width?: number;
  height?: number;
  storageKey: string;
  thumbnailKey?: string;
  mediumKey?: string;
}

export class StorageService {
  async uploadImage(
    file: Express.Multer.File,
    userId: string
  ): Promise<UploadResult> {
    // Validate file
    this.validateImage(file);

    const imageId = uuidv4();
    const timestamp = Date.now();
    const basePath = `images/${userId}/${timestamp}`;

    // Process image with sharp
    const imageBuffer = file.buffer;
    const imageMetadata = await sharp(imageBuffer).metadata();

    // Validate dimensions
    if (
      imageMetadata.width! > LIMITS.IMAGE_MAX_WIDTH ||
      imageMetadata.height! > LIMITS.IMAGE_MAX_HEIGHT
    ) {
      throw new Error('Image dimensions exceed maximum allowed size');
    }

    // Upload original
    const originalKey = `${basePath}/original.jpg`;
    const originalUrl = await this.uploadToS3(originalKey, imageBuffer, file.mimetype);

    // Create and upload thumbnail (300x300)
    const thumbnail = await sharp(imageBuffer)
      .resize(300, 300, { fit: 'cover', position: 'center' })
      .jpeg({ quality: 80 })
      .toBuffer();
    
    const thumbnailKey = `${basePath}/thumbnail.jpg`;
    const thumbnailUrl = await this.uploadToS3(thumbnailKey, thumbnail, 'image/jpeg');

    // Create and upload medium size (800x800)
    const medium = await sharp(imageBuffer)
      .resize(800, 800, { fit: 'inside' })
      .jpeg({ quality: 85 })
      .toBuffer();
    
    const mediumKey = `${basePath}/medium.jpg`;
    const mediumUrl = await this.uploadToS3(mediumKey, medium, 'image/jpeg');

    logger.info(`Image uploaded: ${imageId} by user ${userId}`);

    const result: UploadResult = {
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

  async deleteImage(storageKey: string, thumbnailKey?: string, mediumKey?: string) {
    const deletePromises = [
      this.deleteFromS3(storageKey),
    ];

    if (thumbnailKey) {
      deletePromises.push(this.deleteFromS3(thumbnailKey));
    }

    if (mediumKey) {
      deletePromises.push(this.deleteFromS3(mediumKey));
    }

    await Promise.all(deletePromises);
    logger.info(`Image deleted: ${storageKey}`);
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: S3_CONFIG.bucket,
      Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  }

  private async uploadToS3(
    key: string,
    buffer: Buffer,
    contentType: string
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: S3_CONFIG.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read', // Or use signed URLs for private access
    });

    await s3Client.send(command);

    // Return public URL
    if (S3_CONFIG.publicUrl) {
      return `${S3_CONFIG.publicUrl}/${key}`;
    }

    return `${S3_CONFIG.region}.amazonaws.com/${S3_CONFIG.bucket}/${key}`;
  }

  private async deleteFromS3(key: string) {
    const command = new DeleteObjectCommand({
      Bucket: S3_CONFIG.bucket,
      Key: key,
    });

    await s3Client.send(command);
  }

  private validateImage(file: Express.Multer.File) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error('Invalid file type. Allowed: JPEG, PNG, GIF, WebP');
    }

    if (file.size > LIMITS.IMAGE_MAX_SIZE) {
      throw new Error(`File size exceeds maximum of ${LIMITS.IMAGE_MAX_SIZE / (1024 * 1024)}MB`);
    }
  }
}
