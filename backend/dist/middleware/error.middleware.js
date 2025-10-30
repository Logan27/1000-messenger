"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = void 0;
const logger_util_1 = require("../utils/logger.util");
const env_1 = require("../config/env");
const errorHandler = (error, req, res, _next) => {
    logger_util_1.logger.error('Unhandled error', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
    });
    const isDevelopment = env_1.config.NODE_ENV === 'development';
    res.status(500).json({
        error: isDevelopment ? error.message : 'Internal server error',
        ...(isDevelopment && { stack: error.stack }),
    });
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.path,
        method: req.method,
    });
};
exports.notFoundHandler = notFoundHandler;
//# sourceMappingURL=error.middleware.js.map