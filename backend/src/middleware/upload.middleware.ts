import multer from 'multer';
import { LIMITS } from '../config/constants';

/**
 * Multer configuration for file uploads
 * Uses memory storage to buffer files for processing with Sharp
 */
const storage = multer.memoryStorage();

/**
 * File filter for image uploads
 * Only allows JPEG, PNG, GIF, and WebP formats
 */
const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed: JPEG, PNG, GIF, WebP'));
  }
};

/**
 * Multer upload middleware for single image uploads
 * Limits file size to 10MB
 */
export const uploadSingle = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: LIMITS.IMAGE_MAX_SIZE,
  },
});

/**
 * Multer upload middleware for multiple image uploads
 * Limits file size to 10MB per file and maximum 5 files
 */
export const uploadMultiple = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: LIMITS.IMAGE_MAX_SIZE,
    files: 5,
  },
});
