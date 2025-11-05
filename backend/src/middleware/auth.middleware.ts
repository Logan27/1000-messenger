/**
 * Authentication Middleware
 * 
 * Provides JWT-based authentication middleware for Express routes.
 * Verifies access tokens and attaches user information to the request object.
 * 
 * Features:
 * - JWT access token verification (15-minute expiry)
 * - Bearer token extraction from Authorization header
 * - Comprehensive error handling with specific error types
 * - Security logging for failed authentication attempts
 * - Request metadata attachment (userId)
 * 
 * Usage:
 * ```typescript
 * const authMiddleware = new AuthMiddleware();
 * router.use(authMiddleware.authenticate);
 * ```
 * 
 * @module middleware/auth
 */

import { Request, Response, NextFunction } from 'express';
import {
  verifyAccessToken,
  extractTokenFromHeader,
  JwtExpiredError,
  JwtInvalidError
} from '../utils/jwt.util';
import { logger } from '../utils/logger.util';

// Express Request interface is already extended in backend/src/types/express.d.ts

/**
 * Authentication Middleware Class
 * 
 * Handles JWT verification for protected routes.
 */
export class AuthMiddleware {
  /**
   * Authenticate middleware function
   * 
   * Verifies the JWT access token from the Authorization header.
   * If valid, attaches user information to req.user and proceeds to next handler.
   * If invalid, returns 401 Unauthorized with appropriate error message.
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   * 
   * @example
   * ```typescript
   * router.get('/profile', authMiddleware.authenticate, (req, res) => {
   *   const userId = req.user!.userId;
   *   // ...
   * });
   * ```
   */
  authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract token from Authorization header
      const token = extractTokenFromHeader(req.headers.authorization);

      if (!token) {
        logger.warn('Authentication failed: No token provided', {
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

      // Verify the access token
      const payload = verifyAccessToken(token);

      // Attach user information to request
      req.user = { 
        userId: payload.userId,
        tokenPayload: payload
      };

      // Log successful authentication (debug level to avoid noise)
      logger.debug('User authenticated', {
        userId: payload.userId,
        path: req.path,
        method: req.method,
      });

      next();
    } catch (error) {
      // Handle specific JWT errors
      if (error instanceof JwtExpiredError) {
        logger.warn('Authentication failed: Token expired', {
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

      if (error instanceof JwtInvalidError) {
        logger.warn('Authentication failed: Invalid token', {
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

      // Handle unexpected errors
      logger.error('Authentication failed: Unexpected error', {
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

/**
 * Create a singleton instance for convenience
 * Can be used directly without instantiating the class
 */
export const authMiddleware = new AuthMiddleware();

/**
 * Optional authentication middleware
 * 
 * Similar to authenticate, but does not reject requests without tokens.
 * If a valid token is present, attaches user information to req.user.
 * If no token or invalid token, continues without setting req.user.
 * 
 * Useful for endpoints that have different behavior for authenticated vs anonymous users.
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 * 
 * @example
 * ```typescript
 * // Public endpoint that shows different content for logged-in users
 * router.get('/feed', optionalAuthenticate, (req, res) => {
 *   if (req.user) {
 *     // Show personalized feed
 *   } else {
 *     // Show public feed
 *   }
 * });
 * ```
 */
export const optionalAuthenticate = async (
  req: Request, 
  _res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      // No token provided, continue without authentication
      return next();
    }

    // Try to verify the token
    const payload = verifyAccessToken(token);

    // Attach user information to request
    req.user = { 
      userId: payload.userId,
      tokenPayload: payload
    };

    logger.debug('User optionally authenticated', {
      userId: payload.userId,
      path: req.path,
      method: req.method,
    });

    next();
  } catch (error) {
    // Token present but invalid - continue without authentication
    // (Don't return error for optional auth)
    logger.debug('Optional authentication failed, continuing without auth', {
      error: error instanceof Error ? error.message : String(error),
      path: req.path,
      method: req.method,
    });

    next();
  }
};
