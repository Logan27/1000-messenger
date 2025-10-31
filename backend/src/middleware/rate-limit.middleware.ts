import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redisClient, REDIS_CONFIG } from '../config/redis';
import { LIMITS } from '../config/constants';
import { logger, logSecurity } from '../utils/logger.util';

/**
 * Redis-based rate limiting middleware
 * 
 * Uses Redis as a shared store for rate limiting across multiple server instances.
 * This ensures consistent rate limiting in a horizontally scaled deployment.
 * 
 * Features:
 * - Distributed rate limiting via Redis
 * - Per-user and per-IP rate limits
 * - Automatic key expiration
 * - Standard rate limit headers
 * - Graceful degradation on Redis errors
 */

/**
 * Create a Redis store for rate limiting
 * @param prefix - Key prefix for this rate limiter
 */
function createRedisStore(prefix: string): RedisStore {
  return new RedisStore({
    // Use the sendCommand method from the redis client
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    // Prefix all keys with the rate limit namespace
    prefix: `${REDIS_CONFIG.KEYS.RATE_LIMIT}${prefix}:`,
  });
}

/**
 * Handler for when rate limit is exceeded
 * Logs the event and returns appropriate error response
 */
function onLimitReached(req: any, _res: any, _options: any): void {
  logger.warn('Rate limit exceeded', {
    type: 'security',
    ip: req.ip,
    user: req.user?.userId,
    path: req.path,
    method: req.method,
  });
}

// General API rate limiting
export const apiRateLimit = rateLimit({
  windowMs: LIMITS.API_RATE_WINDOW_MS, // 1 minute
  max: LIMITS.API_RATE_MAX_REQUESTS, // 100 requests per minute
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('api'),
  keyGenerator: req => req.ip || 'unknown',
  handler: (req, res, _next, options) => {
    onLimitReached(req, res, options);
    res.status(429).json({
      error: 'Too Many Requests',
      message: options.message,
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});

// Authentication rate limiting (stricter, per-IP)
export const authRateLimit = rateLimit({
  windowMs: LIMITS.LOGIN_ATTEMPTS_WINDOW_MS, // 15 minutes
  max: LIMITS.LOGIN_MAX_ATTEMPTS, // 5 attempts
  message: 'Too many login attempts, please try again later',
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('auth'),
  keyGenerator: req => req.ip || 'unknown',
  handler: (req, res, _next, options) => {
    onLimitReached(req, res, options);
    logSecurity('Login rate limit exceeded', {
      ip: req.ip,
      path: req.path,
    });
    res.status(429).json({
      error: 'Too Many Requests',
      message: options.message,
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});

// Message sending rate limiting (per-user)
export const messageRateLimit = rateLimit({
  windowMs: 1000, // 1 second
  max: LIMITS.MESSAGES_PER_SECOND_PER_USER, // 10 messages per second
  message: 'Too many messages, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('message'),
  keyGenerator: req => req.user?.userId || req.ip || 'unknown',
  handler: (req, res, _next, options) => {
    onLimitReached(req, res, options);
    res.status(429).json({
      error: 'Too Many Requests',
      message: options.message,
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});

// File upload rate limiting (per-user)
export const uploadRateLimit = rateLimit({
  windowMs: LIMITS.UPLOAD_RATE_WINDOW_MS, // 1 minute
  max: LIMITS.UPLOAD_MAX_REQUESTS, // 10 uploads per minute
  message: 'Too many file uploads, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('upload'),
  keyGenerator: req => req.user?.userId || req.ip || 'unknown',
  handler: (req, res, _next, options) => {
    onLimitReached(req, res, options);
    res.status(429).json({
      error: 'Too Many Requests',
      message: options.message,
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});

// Search rate limiting (per-user)
export const searchRateLimit = rateLimit({
  windowMs: LIMITS.SEARCH_RATE_WINDOW_MS, // 1 minute
  max: LIMITS.SEARCH_MAX_REQUESTS, // 30 searches per minute
  message: 'Too many search requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('search'),
  keyGenerator: req => req.user?.userId || req.ip || 'unknown',
  handler: (req, res, _next, options) => {
    onLimitReached(req, res, options);
    res.status(429).json({
      error: 'Too Many Requests',
      message: options.message,
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});

// Contact request rate limiting (per-user, daily limit)
export const contactRequestRateLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: LIMITS.CONTACT_REQUESTS_PER_DAY, // 50 per day
  message: 'Too many contact requests sent today, please try again tomorrow',
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('contact'),
  keyGenerator: req => req.user?.userId || req.ip || 'unknown',
  handler: (req, res, _next, options) => {
    onLimitReached(req, res, options);
    res.status(429).json({
      error: 'Too Many Requests',
      message: options.message,
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});
