"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchRateLimit = exports.uploadRateLimit = exports.messageRateLimit = exports.authRateLimit = exports.apiRateLimit = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const constants_1 = require("../config/constants");
exports.apiRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});
exports.authRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many login attempts, please try again later',
    skipSuccessfulRequests: true,
    keyGenerator: req => req.ip,
});
exports.messageRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 1000,
    max: constants_1.LIMITS.MESSAGES_PER_SECOND_PER_USER,
    keyGenerator: req => req.user?.userId || req.ip,
    message: 'Too many messages, please slow down',
});
exports.uploadRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 10,
    keyGenerator: req => req.user?.userId || req.ip,
    message: 'Too many file uploads, please try again later',
});
exports.searchRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 30,
    keyGenerator: req => req.user?.userId || req.ip,
    message: 'Too many search requests, please try again later',
});
//# sourceMappingURL=rate-limit.middleware.js.map