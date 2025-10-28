import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import sanitizeHtml from 'sanitize-html';
import { LIMITS } from '../config/constants';

// Helmet security headers
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env['S3_PUBLIC_URL'] || ""],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

// Rate limiting
export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later',
  skipSuccessfulRequests: true,
});

export const messageRateLimit = rateLimit({
  windowMs: 1000, // 1 second
  max: LIMITS.MESSAGES_PER_SECOND_PER_USER,
  keyGenerator: (req) => req.user?.userId || req.ip || 'unknown',
  message: 'Too many messages, slow down',
});

// Sanitize HTML content
export const sanitizeContent = (content: string): string => {
  return sanitizeHtml(content, {
    allowedTags: ['b', 'i', 'em', 'strong', 'u'],
    allowedAttributes: {},
    allowedIframeHostnames: [],
  });
};

// File upload validation
export const validateImageUpload = (req: any, res: any, next: any) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({ 
      error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP' 
    });
  }

  if (req.file.size > LIMITS.IMAGE_MAX_SIZE) {
    return res.status(400).json({ 
      error: `File too large. Maximum size: ${LIMITS.IMAGE_MAX_SIZE / (1024 * 1024)}MB` 
    });
  }

  next();
};
