"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.notFoundHandler = exports.errorHandler = exports.ServiceUnavailableError = exports.InternalServerError = exports.RateLimitError = exports.ValidationError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.BadRequestError = exports.AppError = void 0;
const zod_1 = require("zod");
const logger_util_1 = require("../utils/logger.util");
const env_1 = require("../config/env");
const jwt_util_1 = require("../utils/jwt.util");
let Prisma;
try {
    const prismaModule = require('@prisma/client');
    Prisma = prismaModule.Prisma;
}
catch (e) {
    Prisma = null;
}
class AppError extends Error {
    statusCode;
    code;
    isOperational;
    details;
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class BadRequestError extends AppError {
    constructor(message = 'Bad request', details) {
        super(message, 400, 'BAD_REQUEST', details);
    }
}
exports.BadRequestError = BadRequestError;
class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized', details) {
        super(message, 401, 'UNAUTHORIZED', details);
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError {
    constructor(message = 'Forbidden', details) {
        super(message, 403, 'FORBIDDEN', details);
    }
}
exports.ForbiddenError = ForbiddenError;
class NotFoundError extends AppError {
    constructor(message = 'Resource not found', details) {
        super(message, 404, 'NOT_FOUND', details);
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    constructor(message = 'Resource conflict', details) {
        super(message, 409, 'CONFLICT', details);
    }
}
exports.ConflictError = ConflictError;
class ValidationError extends AppError {
    constructor(message = 'Validation failed', details) {
        super(message, 422, 'VALIDATION_ERROR', details);
    }
}
exports.ValidationError = ValidationError;
class RateLimitError extends AppError {
    constructor(message = 'Too many requests', details) {
        super(message, 429, 'RATE_LIMIT_EXCEEDED', details);
    }
}
exports.RateLimitError = RateLimitError;
class InternalServerError extends AppError {
    constructor(message = 'Internal server error', details) {
        super(message, 500, 'INTERNAL_ERROR', details);
    }
}
exports.InternalServerError = InternalServerError;
class ServiceUnavailableError extends AppError {
    constructor(message = 'Service unavailable', details) {
        super(message, 503, 'SERVICE_UNAVAILABLE', details);
    }
}
exports.ServiceUnavailableError = ServiceUnavailableError;
function formatZodError(error) {
    return error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
    }));
}
function handlePrismaError(error) {
    if (!Prisma) {
        return new InternalServerError('A database error occurred');
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
            case 'P2002':
                return new ConflictError('A record with this value already exists', {
                    field: error.meta?.target,
                    code: error.code,
                });
            case 'P2025':
                return new NotFoundError('The requested record was not found', {
                    code: error.code,
                });
            case 'P2003':
                return new BadRequestError('Invalid reference to related record', {
                    field: error.meta?.field_name,
                    code: error.code,
                });
            case 'P2014':
                return new BadRequestError('The change would violate a relation', {
                    code: error.code,
                });
            default:
                logger_util_1.logger.error('Unhandled Prisma error', {
                    code: error.code,
                    message: error.message,
                    meta: error.meta,
                });
                return new InternalServerError('A database error occurred');
        }
    }
    if (error instanceof Prisma.PrismaClientValidationError) {
        return new BadRequestError('Invalid data provided to database', {
            message: error.message,
        });
    }
    if (error instanceof Prisma.PrismaClientInitializationError) {
        logger_util_1.logger.error('Database initialization error', { error: error.message });
        return new ServiceUnavailableError('Database connection failed');
    }
    if (error instanceof Prisma.PrismaClientRustPanicError) {
        logger_util_1.logger.error('Database panic error', { error: error.message });
        return new ServiceUnavailableError('Database error occurred');
    }
    return new InternalServerError('An unexpected database error occurred');
}
function handleJwtError(error) {
    if (error instanceof jwt_util_1.JwtExpiredError) {
        return new UnauthorizedError('Token has expired', {
            code: 'TOKEN_EXPIRED',
        });
    }
    if (error instanceof jwt_util_1.JwtInvalidError) {
        return new UnauthorizedError('Invalid token', {
            code: 'TOKEN_INVALID',
        });
    }
    if (error instanceof jwt_util_1.JwtMalformedError) {
        return new UnauthorizedError('Malformed token', {
            code: 'TOKEN_MALFORMED',
        });
    }
    return new UnauthorizedError('Authentication failed');
}
const errorHandler = (error, req, res, _next) => {
    let appError;
    if (error instanceof AppError) {
        appError = error;
    }
    else if (error instanceof zod_1.ZodError) {
        appError = new ValidationError('Validation failed', formatZodError(error));
    }
    else if (error instanceof jwt_util_1.JwtError) {
        appError = handleJwtError(error);
    }
    else if (Prisma && (error instanceof Prisma.PrismaClientKnownRequestError ||
        error instanceof Prisma.PrismaClientValidationError ||
        error instanceof Prisma.PrismaClientInitializationError ||
        error instanceof Prisma.PrismaClientRustPanicError)) {
        appError = handlePrismaError(error);
    }
    else if (error.message === 'Invalid credentials') {
        appError = new UnauthorizedError('Invalid credentials');
    }
    else if (error.message === 'Username already taken') {
        appError = new ConflictError('Username already taken');
    }
    else if (error.message.includes('not found')) {
        appError = new NotFoundError(error.message);
    }
    else if (error.message.includes('not authorized') || error.message.includes('unauthorized')) {
        appError = new ForbiddenError(error.message);
    }
    else if (error.message.includes('not a participant')) {
        appError = new ForbiddenError(error.message);
    }
    else {
        appError = new InternalServerError(env_1.config.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message);
    }
    const logMeta = {
        error: error.message,
        code: appError.code,
        statusCode: appError.statusCode,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userId: req.user?.userId,
        stack: error.stack,
    };
    if (appError.statusCode >= 500) {
        logger_util_1.logger.error('Server error', logMeta);
    }
    else if (appError.statusCode >= 400) {
        logger_util_1.logger.warn('Client error', logMeta);
    }
    else {
        logger_util_1.logger.info('Request error', logMeta);
    }
    const isDevelopment = env_1.config.NODE_ENV === 'development';
    const errorResponse = {
        error: appError.code,
        message: appError.message,
        statusCode: appError.statusCode,
    };
    if (appError.details) {
        errorResponse.details = appError.details;
    }
    if (isDevelopment && error.stack) {
        errorResponse.stack = error.stack;
    }
    if (isDevelopment) {
        errorResponse.path = req.path;
        errorResponse.method = req.method;
        errorResponse.timestamp = new Date().toISOString();
    }
    res.status(appError.statusCode).json(errorResponse);
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res) => {
    res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Route not found',
        statusCode: 404,
        path: req.path,
        method: req.method,
    });
};
exports.notFoundHandler = notFoundHandler;
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
//# sourceMappingURL=error.middleware.js.map