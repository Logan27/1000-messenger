/**
 * Security Middleware
 *
 * This module provides comprehensive security middleware for the messenger application,
 * implementing industry-standard security headers, CORS policies, rate limiting, and
 * input sanitization to protect against common web vulnerabilities.
 *
 * Key Features:
 * - Helmet security headers (CSP, XSS protection, clickjacking prevention)
 * - CORS configuration for cross-origin requests
 * - Rate limiting for API protection and DDoS mitigation
 * - HTML content sanitization to prevent XSS attacks
 * - File upload validation
 *
 * @module middleware/security
 */

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import sanitizeHtml from 'sanitize-html';
import { Request, Response, NextFunction } from 'express';
import { LIMITS } from '../config/constants';
import { config } from '../config/env';

/**
 * Helmet Security Headers Middleware
 *
 * Configures security-related HTTP response headers to protect against common attacks:
 *
 * - **Content Security Policy (CSP)**: Prevents XSS by controlling resource loading
 * - **X-Frame-Options**: Prevents clickjacking attacks
 * - **X-Content-Type-Options**: Prevents MIME sniffing
 * - **Referrer-Policy**: Controls referrer information
 * - **Permissions-Policy**: Controls browser features
 *
 * CSP Directives:
 * - default-src 'self': Only allow resources from same origin
 * - style-src 'self' 'unsafe-inline': Allow inline styles (required for Tailwind)
 * - script-src 'self': Only allow scripts from same origin
 * - img-src 'self' data: https:: Allow images from same origin, data URIs, and HTTPS
 * - connect-src: Allow API calls to self and S3/CDN for file uploads
 * - object-src 'none': Block plugins (Flash, Java, etc.)
 * - frame-src 'none': Prevent embedding in frames
 *
 * @see https://helmetjs.github.io/
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", config.S3_PUBLIC_URL || ''],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

/**
 * API Rate Limiting Middleware
 *
 * Note: The production API rate limiter is implemented in rate-limit.middleware.ts
 * using Redis for distributed rate limiting across multiple server instances.
 *
 * For API endpoints, use the Redis-backed apiRateLimit from
 * middleware/rate-limit.middleware.ts instead of this simple in-memory version.
 *
 * @see middleware/rate-limit.middleware.ts for Redis-backed rate limiting
 * @see FR-184: System MUST rate limit general operations (100 per minute)
 * @deprecated Use apiRateLimit from rate-limit.middleware.ts for production
 */

/**
 * Authentication Rate Limiting Middleware
 *
 * Note: The production auth rate limiter is implemented in rate-limit.middleware.ts
 * using Redis for distributed rate limiting across multiple server instances.
 *
 * For authentication endpoints, use the Redis-backed authRateLimit from
 * middleware/rate-limit.middleware.ts instead of this simple in-memory version.
 *
 * @see middleware/rate-limit.middleware.ts for Redis-backed rate limiting
 * @see FR-006: System MUST implement rate limiting for login attempts (5 per 15 minutes)
 * @see FR-181: System MUST rate limit login attempts (5 per 15 minutes)
 * @deprecated Use authRateLimit from rate-limit.middleware.ts for production
 */

/**
 * Message Rate Limiting Middleware
 *
 * Rate limiter for message sending to prevent spam and abuse.
 * Uses user ID when authenticated, falls back to IP address.
 *
 * Limits:
 * - 10 messages per second per user (configurable via LIMITS.MESSAGES_PER_SECOND_PER_USER)
 *
 * Responses:
 * - Returns 429 Too Many Requests when limit is exceeded
 *
 * Usage:
 * ```typescript
 * router.post('/messages', authenticate, messageRateLimit, sendMessageController);
 * ```
 *
 * @see FR-182: System MUST rate limit messages (10 per second per user)
 */
export const messageRateLimit = rateLimit({
  windowMs: 1000, // 1 second
  max: LIMITS.MESSAGES_PER_SECOND_PER_USER,
  keyGenerator: (req: Request) => (req as any).user?.userId || req.ip,
  message: 'Too many messages, slow down',
});

/**
 * HTML Content Sanitization
 *
 * Sanitizes user-provided HTML content to prevent XSS attacks while allowing
 * basic text formatting.
 *
 * Allowed Tags:
 * - b, i, em, strong, u (text formatting)
 *
 * Security Features:
 * - Strips all attributes
 * - Blocks iframes
 * - Removes script tags
 * - Escapes dangerous content
 *
 * Usage:
 * ```typescript
 * const safeContent = sanitizeContent(userInput);
 * ```
 *
 * @param content - Raw HTML content from user input
 * @returns Sanitized HTML content safe for display
 *
 * @see FR-032: System MUST sanitize HTML tags in messages to prevent XSS attacks
 * @see FR-188: System MUST prevent XSS attacks through input sanitization
 */
export const sanitizeContent = (content: string): string => {
  return sanitizeHtml(content, {
    allowedTags: ['b', 'i', 'em', 'strong', 'u'],
    allowedAttributes: {},
    allowedIframeHostnames: [],
  });
};

/**
 * Image Upload Validation Middleware
 *
 * Validates uploaded image files to ensure they meet security and size requirements.
 * Should be used after multer middleware in the middleware chain.
 *
 * Validations:
 * - File type: JPEG, PNG, GIF, WebP only
 * - File size: Maximum 10MB (configurable via LIMITS.IMAGE_MAX_SIZE)
 * - File presence: Ensures file was uploaded
 *
 * Responses:
 * - 400 Bad Request if validation fails with descriptive error
 *
 * Usage:
 * ```typescript
 * router.post('/upload',
 *   authenticate,
 *   upload.single('image'),
 *   validateImageUpload,
 *   uploadController
 * );
 * ```
 *
 * @see FR-033: Users MUST be able to upload images in JPEG, PNG, GIF, or WebP format
 * @see FR-034: System MUST enforce maximum image size of 10MB per image
 * @see FR-191: System MUST validate file types for uploads
 */
export const validateImageUpload = (req: Request, res: Response, next: NextFunction): void => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const file = (req as any).file;

  if (!file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  if (!allowedTypes.includes(file.mimetype)) {
    res.status(400).json({
      error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP',
    });
    return;
  }

  if (file.size > LIMITS.IMAGE_MAX_SIZE) {
    res.status(400).json({
      error: `File too large. Maximum size: ${LIMITS.IMAGE_MAX_SIZE / (1024 * 1024)}MB`,
    });
    return;
  }

  next();
};
