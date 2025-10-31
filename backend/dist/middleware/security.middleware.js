"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateImageUpload = exports.sanitizeContent = exports.messageRateLimit = exports.authRateLimit = exports.apiRateLimit = exports.securityHeaders = void 0;
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const sanitize_html_1 = __importDefault(require("sanitize-html"));
const constants_1 = require("../config/constants");
const env_1 = require("../config/env");
exports.securityHeaders = (0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'", env_1.config.S3_PUBLIC_URL || ''],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false,
});
exports.apiRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP',
    standardHeaders: true,
    legacyHeaders: false,
});
exports.authRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many login attempts, please try again later',
    skipSuccessfulRequests: true,
});
exports.messageRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 1000,
    max: constants_1.LIMITS.MESSAGES_PER_SECOND_PER_USER,
    keyGenerator: (req) => req.user?.userId || req.ip,
    message: 'Too many messages, slow down',
});
const sanitizeContent = (content) => {
    return (0, sanitize_html_1.default)(content, {
        allowedTags: ['b', 'i', 'em', 'strong', 'u'],
        allowedAttributes: {},
        allowedIframeHostnames: [],
    });
};
exports.sanitizeContent = sanitizeContent;
const validateImageUpload = (req, res, next) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const file = req.file;
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
    if (file.size > constants_1.LIMITS.IMAGE_MAX_SIZE) {
        res.status(400).json({
            error: `File too large. Maximum size: ${constants_1.LIMITS.IMAGE_MAX_SIZE / (1024 * 1024)}MB`,
        });
        return;
    }
    next();
};
exports.validateImageUpload = validateImageUpload;
//# sourceMappingURL=security.middleware.js.map