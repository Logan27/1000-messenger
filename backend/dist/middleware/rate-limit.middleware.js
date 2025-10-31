"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.contactRequestRateLimit = exports.searchRateLimit = exports.uploadRateLimit = exports.messageRateLimit = exports.authRateLimit = exports.apiRateLimit = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const rate_limit_redis_1 = require("rate-limit-redis");
const redis_1 = require("../config/redis");
const constants_1 = require("../config/constants");
const logger_util_1 = require("../utils/logger.util");
function createRedisStore(prefix) {
    return new rate_limit_redis_1.RedisStore({
        sendCommand: (...args) => redis_1.redisClient.sendCommand(args),
        prefix: `${redis_1.REDIS_CONFIG.KEYS.RATE_LIMIT}${prefix}:`,
    });
}
function onLimitReached(req, _res, _options) {
    logger_util_1.logger.warn('Rate limit exceeded', {
        type: 'security',
        ip: req.ip,
        user: req.user?.userId,
        path: req.path,
        method: req.method,
    });
}
exports.apiRateLimit = (0, express_rate_limit_1.default)({
    windowMs: constants_1.LIMITS.API_RATE_WINDOW_MS,
    max: constants_1.LIMITS.API_RATE_MAX_REQUESTS,
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
exports.authRateLimit = (0, express_rate_limit_1.default)({
    windowMs: constants_1.LIMITS.LOGIN_ATTEMPTS_WINDOW_MS,
    max: constants_1.LIMITS.LOGIN_MAX_ATTEMPTS,
    message: 'Too many login attempts, please try again later',
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    store: createRedisStore('auth'),
    keyGenerator: req => req.ip || 'unknown',
    handler: (req, res, _next, options) => {
        onLimitReached(req, res, options);
        (0, logger_util_1.logSecurity)('Login rate limit exceeded', {
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
exports.messageRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 1000,
    max: constants_1.LIMITS.MESSAGES_PER_SECOND_PER_USER,
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
exports.uploadRateLimit = (0, express_rate_limit_1.default)({
    windowMs: constants_1.LIMITS.UPLOAD_RATE_WINDOW_MS,
    max: constants_1.LIMITS.UPLOAD_MAX_REQUESTS,
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
exports.searchRateLimit = (0, express_rate_limit_1.default)({
    windowMs: constants_1.LIMITS.SEARCH_RATE_WINDOW_MS,
    max: constants_1.LIMITS.SEARCH_MAX_REQUESTS,
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
exports.contactRequestRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 24 * 60 * 60 * 1000,
    max: constants_1.LIMITS.CONTACT_REQUESTS_PER_DAY,
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
//# sourceMappingURL=rate-limit.middleware.js.map