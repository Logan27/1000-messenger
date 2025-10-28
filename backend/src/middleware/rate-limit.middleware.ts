import rateLimit from 'express-rate-limit';
import { LIMITS } from '../config/constants';

// General API rate limiting
export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Authentication rate limiting
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later',
  skipSuccessfulRequests: true,
  keyGenerator: (req) => req.ip || 'unknown',
});

// Message sending rate limiting
export const messageRateLimit = rateLimit({
  windowMs: 1000, // 1 second
  max: LIMITS.MESSAGES_PER_SECOND_PER_USER,
  keyGenerator: (req) => req.user?.userId || req.ip || 'unknown',
  message: 'Too many messages, please slow down',
});

// File upload rate limiting
export const uploadRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 uploads per minute
  keyGenerator: (req) => req.user?.userId || req.ip || 'unknown',
  message: 'Too many file uploads, please try again later',
});

// Search rate limiting
export const searchRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 searches per minute
  keyGenerator: (req) => req.user?.userId || req.ip || 'unknown',
  message: 'Too many search requests, please try again later',
});
