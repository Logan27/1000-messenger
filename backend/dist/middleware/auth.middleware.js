"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuthenticate = exports.authMiddleware = exports.AuthMiddleware = void 0;
const jwt_util_1 = require("../utils/jwt.util");
const logger_util_1 = require("../utils/logger.util");
class AuthMiddleware {
    authenticate = async (req, res, next) => {
        try {
            const token = (0, jwt_util_1.extractTokenFromHeader)(req.headers.authorization);
            if (!token) {
                logger_util_1.logger.warn('Authentication failed: No token provided', {
                    ip: req.ip,
                    userAgent: req.get('user-agent'),
                    path: req.path,
                    method: req.method,
                });
                res.status(401).json({
                    error: 'No token provided',
                    message: 'Authorization header with Bearer token is required'
                });
                return;
            }
            const payload = (0, jwt_util_1.verifyAccessToken)(token);
            req.user = {
                userId: payload.userId,
                tokenPayload: payload
            };
            logger_util_1.logger.debug('User authenticated', {
                userId: payload.userId,
                path: req.path,
                method: req.method,
            });
            next();
        }
        catch (error) {
            if (error instanceof jwt_util_1.JwtExpiredError) {
                logger_util_1.logger.warn('Authentication failed: Token expired', {
                    ip: req.ip,
                    userAgent: req.get('user-agent'),
                    path: req.path,
                    method: req.method,
                });
                res.status(401).json({
                    error: 'Token expired',
                    message: 'Access token has expired. Please refresh your token.'
                });
                return;
            }
            if (error instanceof jwt_util_1.JwtInvalidError) {
                logger_util_1.logger.warn('Authentication failed: Invalid token', {
                    ip: req.ip,
                    userAgent: req.get('user-agent'),
                    path: req.path,
                    method: req.method,
                    errorMessage: error.message,
                });
                res.status(401).json({
                    error: 'Invalid token',
                    message: 'The provided token is invalid or malformed.'
                });
                return;
            }
            logger_util_1.logger.error('Authentication failed: Unexpected error', {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                ip: req.ip,
                userAgent: req.get('user-agent'),
                path: req.path,
                method: req.method,
            });
            res.status(401).json({
                error: 'Authentication failed',
                message: 'Failed to authenticate the request.'
            });
            return;
        }
    };
}
exports.AuthMiddleware = AuthMiddleware;
exports.authMiddleware = new AuthMiddleware();
const optionalAuthenticate = async (req, res, next) => {
    try {
        const token = (0, jwt_util_1.extractTokenFromHeader)(req.headers.authorization);
        if (!token) {
            return next();
        }
        const payload = (0, jwt_util_1.verifyAccessToken)(token);
        req.user = {
            userId: payload.userId,
            tokenPayload: payload
        };
        logger_util_1.logger.debug('User optionally authenticated', {
            userId: payload.userId,
            path: req.path,
            method: req.method,
        });
        next();
    }
    catch (error) {
        logger_util_1.logger.debug('Optional authentication failed, continuing without auth', {
            error: error instanceof Error ? error.message : String(error),
            path: req.path,
            method: req.method,
        });
        next();
    }
};
exports.optionalAuthenticate = optionalAuthenticate;
//# sourceMappingURL=auth.middleware.js.map