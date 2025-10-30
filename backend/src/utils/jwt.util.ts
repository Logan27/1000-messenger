/**
 * JWT Utility Functions
 * 
 * Handles JSON Web Token operations for authentication:
 * - Token generation (access and refresh tokens)
 * - Token verification and validation
 * - Token decoding
 * - Token refresh logic
 * 
 * @module utils/jwt
 */

import * as jwt from 'jsonwebtoken';
import { JsonWebTokenError, TokenExpiredError, NotBeforeError } from 'jsonwebtoken';
import { config, JWT_CONFIG } from '../config/env';
import { logger } from './logger.util';

/**
 * JWT Token Types
 */
export enum TokenType {
  ACCESS = 'access',
  REFRESH = 'refresh',
}

/**
 * JWT Payload Interface
 */
export interface JwtPayload {
  userId: string;
  type: TokenType;
  iat?: number;
  exp?: number;
  nbf?: number;
}

/**
 * Token Pair Interface
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Custom JWT Error Classes
 */
export class JwtError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'JwtError';
  }
}

export class JwtExpiredError extends JwtError {
  constructor(message: string = 'Token has expired') {
    super(message);
    this.name = 'JwtExpiredError';
  }
}

export class JwtInvalidError extends JwtError {
  constructor(message: string = 'Token is invalid') {
    super(message);
    this.name = 'JwtInvalidError';
  }
}

export class JwtMalformedError extends JwtError {
  constructor(message: string = 'Token is malformed') {
    super(message);
    this.name = 'JwtMalformedError';
  }
}

/**
 * Generate an access token for a user
 * 
 * Access tokens are short-lived (15 minutes) and used for API authentication.
 * 
 * @param userId - The unique identifier of the user
 * @param additionalClaims - Optional additional claims to include in the token
 * @returns Signed JWT access token
 * 
 * @example
 * ```typescript
 * const token = generateAccessToken('user-123');
 * ```
 */
export function generateAccessToken(
  userId: string,
  additionalClaims?: Record<string, any>
): string {
  try {
    const payload: JwtPayload & Record<string, any> = {
      userId,
      type: TokenType.ACCESS,
      ...additionalClaims,
    };

    return jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRY,
      issuer: 'messenger-api',
      audience: 'messenger-client',
    });
  } catch (error) {
    logger.error('Failed to generate access token', { error, userId });
    throw new JwtError('Failed to generate access token');
  }
}

/**
 * Generate a refresh token for a user
 * 
 * Refresh tokens are long-lived (7 days) and used to obtain new access tokens.
 * 
 * @param userId - The unique identifier of the user
 * @param additionalClaims - Optional additional claims to include in the token
 * @returns Signed JWT refresh token
 * 
 * @example
 * ```typescript
 * const token = generateRefreshToken('user-123');
 * ```
 */
export function generateRefreshToken(
  userId: string,
  additionalClaims?: Record<string, any>
): string {
  try {
    const payload: JwtPayload & Record<string, any> = {
      userId,
      type: TokenType.REFRESH,
      ...additionalClaims,
    };

    return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
      expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRY,
      issuer: 'messenger-api',
      audience: 'messenger-client',
    });
  } catch (error) {
    logger.error('Failed to generate refresh token', { error, userId });
    throw new JwtError('Failed to generate refresh token');
  }
}

/**
 * Generate both access and refresh tokens
 * 
 * Convenience function to generate a complete token pair for user authentication.
 * 
 * @param userId - The unique identifier of the user
 * @param additionalClaims - Optional additional claims to include in both tokens
 * @returns Object containing both access and refresh tokens
 * 
 * @example
 * ```typescript
 * const { accessToken, refreshToken } = generateTokenPair('user-123');
 * ```
 */
export function generateTokenPair(
  userId: string,
  additionalClaims?: Record<string, any>
): TokenPair {
  return {
    accessToken: generateAccessToken(userId, additionalClaims),
    refreshToken: generateRefreshToken(userId, additionalClaims),
  };
}

/**
 * Verify and decode an access token
 * 
 * Validates the token signature, expiration, and claims.
 * 
 * @param token - The JWT access token to verify
 * @returns Decoded token payload
 * @throws {JwtExpiredError} If the token has expired
 * @throws {JwtInvalidError} If the token is invalid or malformed
 * 
 * @example
 * ```typescript
 * try {
 *   const payload = verifyAccessToken(token);
 *   console.log(payload.userId);
 * } catch (error) {
 *   if (error instanceof JwtExpiredError) {
 *     // Handle expired token
 *   }
 * }
 * ```
 */
export function verifyAccessToken(token: string): JwtPayload {
  try {
    const payload = jwt.verify(token, config.JWT_SECRET, {
      issuer: 'messenger-api',
      audience: 'messenger-client',
    }) as JwtPayload;

    if (payload.type !== TokenType.ACCESS) {
      throw new JwtInvalidError('Invalid token type');
    }

    return payload;
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      throw new JwtExpiredError('Access token has expired');
    } else if (error instanceof JsonWebTokenError) {
      throw new JwtInvalidError(`Invalid access token: ${error.message}`);
    } else if (error instanceof NotBeforeError) {
      throw new JwtInvalidError('Token not yet valid');
    } else if (error instanceof JwtError) {
      throw error;
    } else {
      logger.error('Unexpected error verifying access token', { error });
      throw new JwtError('Failed to verify access token');
    }
  }
}

/**
 * Verify and decode a refresh token
 * 
 * Validates the token signature, expiration, and claims.
 * 
 * @param token - The JWT refresh token to verify
 * @returns Decoded token payload
 * @throws {JwtExpiredError} If the token has expired
 * @throws {JwtInvalidError} If the token is invalid or malformed
 * 
 * @example
 * ```typescript
 * try {
 *   const payload = verifyRefreshToken(token);
 *   const newAccessToken = generateAccessToken(payload.userId);
 * } catch (error) {
 *   if (error instanceof JwtExpiredError) {
 *     // Require user to login again
 *   }
 * }
 * ```
 */
export function verifyRefreshToken(token: string): JwtPayload {
  try {
    const payload = jwt.verify(token, config.JWT_REFRESH_SECRET, {
      issuer: 'messenger-api',
      audience: 'messenger-client',
    }) as JwtPayload;

    if (payload.type !== TokenType.REFRESH) {
      throw new JwtInvalidError('Invalid token type');
    }

    return payload;
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      throw new JwtExpiredError('Refresh token has expired');
    } else if (error instanceof JsonWebTokenError) {
      throw new JwtInvalidError(`Invalid refresh token: ${error.message}`);
    } else if (error instanceof NotBeforeError) {
      throw new JwtInvalidError('Token not yet valid');
    } else if (error instanceof JwtError) {
      throw error;
    } else {
      logger.error('Unexpected error verifying refresh token', { error });
      throw new JwtError('Failed to verify refresh token');
    }
  }
}

/**
 * Decode a token without verification
 * 
 * Useful for debugging or extracting information from expired tokens.
 * WARNING: Does not validate signature or expiration.
 * 
 * @param token - The JWT token to decode
 * @returns Decoded token payload or null if malformed
 * 
 * @example
 * ```typescript
 * const payload = decodeToken(token);
 * if (payload) {
 *   console.log('Token expired at:', new Date(payload.exp! * 1000));
 * }
 * ```
 */
export function decodeToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.decode(token);
    return decoded as JwtPayload;
  } catch (error) {
    logger.warn('Failed to decode token', { error });
    return null;
  }
}

/**
 * Extract token from Authorization header
 * 
 * Parses "Bearer <token>" format and returns the token.
 * 
 * @param authHeader - The Authorization header value
 * @returns The extracted token or null if invalid format
 * 
 * @example
 * ```typescript
 * const token = extractTokenFromHeader(req.headers.authorization);
 * if (token) {
 *   const payload = verifyAccessToken(token);
 * }
 * ```
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1] || null;
}

/**
 * Check if a token is expired without verifying signature
 * 
 * @param token - The JWT token to check
 * @returns True if the token is expired, false otherwise
 * 
 * @example
 * ```typescript
 * if (isTokenExpired(token)) {
 *   // Request new token using refresh token
 * }
 * ```
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true;
    }

    const now = Math.floor(Date.now() / 1000);
    return decoded.exp < now;
  } catch (error) {
    return true;
  }
}

/**
 * Get token expiration date
 * 
 * @param token - The JWT token
 * @returns Expiration date or null if not available
 * 
 * @example
 * ```typescript
 * const expiresAt = getTokenExpiration(token);
 * if (expiresAt) {
 *   console.log('Token expires at:', expiresAt);
 * }
 * ```
 */
export function getTokenExpiration(token: string): Date | null {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
      return null;
    }

    return new Date(decoded.exp * 1000);
  } catch (error) {
    return null;
  }
}

/**
 * Refresh an access token using a refresh token
 * 
 * Validates the refresh token and generates a new access token.
 * 
 * @param refreshToken - The refresh token
 * @returns New access token
 * @throws {JwtExpiredError} If the refresh token has expired
 * @throws {JwtInvalidError} If the refresh token is invalid
 * 
 * @example
 * ```typescript
 * try {
 *   const newAccessToken = refreshAccessToken(refreshToken);
 * } catch (error) {
 *   if (error instanceof JwtExpiredError) {
 *     // User needs to login again
 *   }
 * }
 * ```
 */
export function refreshAccessToken(refreshToken: string): string {
  const payload = verifyRefreshToken(refreshToken);
  return generateAccessToken(payload.userId);
}

/**
 * Validate token format (basic structure check)
 * 
 * Checks if a string matches the basic JWT format without verifying signature.
 * 
 * @param token - The token to validate
 * @returns True if the token has valid JWT structure
 * 
 * @example
 * ```typescript
 * if (isValidTokenFormat(token)) {
 *   // Proceed with verification
 * }
 * ```
 */
export function isValidTokenFormat(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }

  try {
    // Validate each part is valid base64
    parts.forEach((part) => {
      Buffer.from(part, 'base64');
    });
    return true;
  } catch (error) {
    return false;
  }
}
