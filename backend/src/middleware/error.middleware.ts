import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger.util';
import { config } from '../config/env';
import { 
  JwtError, 
  JwtExpiredError, 
  JwtInvalidError, 
  JwtMalformedError 
} from '../utils/jwt.util';

// Import Prisma types conditionally
let Prisma: any;
try {
  const prismaModule = require('@prisma/client');
  Prisma = prismaModule.Prisma;
} catch (e) {
  // Prisma not available, will skip Prisma error handling
  Prisma = null;
}

/**
 * Base class for operational errors (expected errors that can be handled)
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 Bad Request - Invalid input from client
 */
export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request', details?: any) {
    super(message, 400, 'BAD_REQUEST', details);
  }
}

/**
 * 401 Unauthorized - Authentication required or failed
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', details?: any) {
    super(message, 401, 'UNAUTHORIZED', details);
  }
}

/**
 * 403 Forbidden - Authenticated but lacking permissions
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', details?: any) {
    super(message, 403, 'FORBIDDEN', details);
  }
}

/**
 * 404 Not Found - Resource does not exist
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', details?: any) {
    super(message, 404, 'NOT_FOUND', details);
  }
}

/**
 * 409 Conflict - Resource already exists or state conflict
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict', details?: any) {
    super(message, 409, 'CONFLICT', details);
  }
}

/**
 * 422 Unprocessable Entity - Semantic validation error
 */
export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: any) {
    super(message, 422, 'VALIDATION_ERROR', details);
  }
}

/**
 * 429 Too Many Requests - Rate limit exceeded
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests', details?: any) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', details);
  }
}

/**
 * 500 Internal Server Error - Unexpected server error
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error', details?: any) {
    super(message, 500, 'INTERNAL_ERROR', details);
  }
}

/**
 * 503 Service Unavailable - External service or database unavailable
 */
export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service unavailable', details?: any) {
    super(message, 503, 'SERVICE_UNAVAILABLE', details);
  }
}

/**
 * Convert Zod validation errors to structured format
 */
function formatZodError(error: ZodError) {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));
}

/**
 * Convert Prisma errors to AppError instances
 */
function handlePrismaError(error: any): AppError {
  if (!Prisma) {
    return new InternalServerError('A database error occurred');
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': // Unique constraint violation
        return new ConflictError(
          'A record with this value already exists',
          {
            field: error.meta?.target,
            code: error.code,
          }
        );
      case 'P2025': // Record not found
        return new NotFoundError('The requested record was not found', {
          code: error.code,
        });
      case 'P2003': // Foreign key constraint violation
        return new BadRequestError('Invalid reference to related record', {
          field: error.meta?.field_name,
          code: error.code,
        });
      case 'P2014': // Invalid relation
        return new BadRequestError('The change would violate a relation', {
          code: error.code,
        });
      default:
        logger.error('Unhandled Prisma error', {
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
    logger.error('Database initialization error', { error: error.message });
    return new ServiceUnavailableError('Database connection failed');
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    logger.error('Database panic error', { error: error.message });
    return new ServiceUnavailableError('Database error occurred');
  }

  return new InternalServerError('An unexpected database error occurred');
}

/**
 * Convert JWT errors to AppError instances
 */
function handleJwtError(error: JwtError): AppError {
  if (error instanceof JwtExpiredError) {
    return new UnauthorizedError('Token has expired', {
      code: 'TOKEN_EXPIRED',
    });
  }

  if (error instanceof JwtInvalidError) {
    return new UnauthorizedError('Invalid token', {
      code: 'TOKEN_INVALID',
    });
  }

  if (error instanceof JwtMalformedError) {
    return new UnauthorizedError('Malformed token', {
      code: 'TOKEN_MALFORMED',
    });
  }

  return new UnauthorizedError('Authentication failed');
}

/**
 * Main error handling middleware
 * 
 * Processes all errors thrown in the application and converts them
 * to appropriate HTTP responses with structured error information.
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let appError: AppError;

  // Convert known error types to AppError
  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof ZodError) {
    appError = new ValidationError('Validation failed', formatZodError(error));
  } else if (error instanceof JwtError) {
    appError = handleJwtError(error);
  } else if (
    Prisma &&
    Prisma.PrismaClientKnownRequestError &&
    Prisma.PrismaClientValidationError &&
    Prisma.PrismaClientInitializationError &&
    Prisma.PrismaClientRustPanicError &&
    (error instanceof Prisma.PrismaClientKnownRequestError ||
      error instanceof Prisma.PrismaClientValidationError ||
      error instanceof Prisma.PrismaClientInitializationError ||
      error instanceof Prisma.PrismaClientRustPanicError)
  ) {
    appError = handlePrismaError(error);
  } else if (error.message === 'Invalid credentials') {
    // Common authentication error from services
    appError = new UnauthorizedError('Invalid credentials');
  } else if (error.message === 'Username already taken') {
    appError = new ConflictError('Username already taken');
  } else if (error.message.includes('not found')) {
    appError = new NotFoundError(error.message);
  } else if (error.message.includes('not authorized') || error.message.includes('unauthorized')) {
    appError = new ForbiddenError(error.message);
  } else if (error.message.includes('not a participant')) {
    appError = new ForbiddenError(error.message);
  } else {
    // Unknown/unexpected error
    appError = new InternalServerError(
      config.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message
    );
  }

  // Log error based on severity
  const logMeta = {
    error: error.message,
    code: appError.code,
    statusCode: appError.statusCode,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userId: (req as any).user?.userId,
    stack: error.stack,
  };

  if (appError.statusCode >= 500) {
    // Server errors - log as error
    logger.error('Server error', logMeta);
  } else if (appError.statusCode >= 400) {
    // Client errors - log as warning
    logger.warn('Client error', logMeta);
  } else {
    // Other errors - log as info
    logger.info('Request error', logMeta);
  }

  // Prepare error response
  const isDevelopment = config.NODE_ENV === 'development';
  const errorResponse: any = {
    error: appError.code,
    message: appError.message,
    statusCode: appError.statusCode,
  };

  // Add details if present (e.g., validation errors)
  if (appError.details) {
    errorResponse.details = appError.details;
  }

  // Add stack trace in development
  if (isDevelopment && error.stack) {
    errorResponse.stack = error.stack;
  }

  // Add request context in development
  if (isDevelopment) {
    errorResponse.path = req.path;
    errorResponse.method = req.method;
    errorResponse.timestamp = new Date().toISOString();
  }

  // Send error response
  res.status(appError.statusCode).json(errorResponse);
};

/**
 * 404 Not Found handler for undefined routes
 * 
 * Should be registered after all valid routes but before
 * the main error handler middleware.
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: 'Route not found',
    statusCode: 404,
    path: req.path,
    method: req.method,
  });
};

/**
 * Async error wrapper utility
 * 
 * Wraps async route handlers to automatically catch errors and pass
 * them to the error handling middleware.
 * 
 * @example
 * ```typescript
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await userService.getUsers();
 *   res.json(users);
 * }));
 * ```
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
