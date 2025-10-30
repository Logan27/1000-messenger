# JWT Utility Functions

Comprehensive JWT utility module for authentication in the messenger application.

## Overview

This module provides a complete set of functions for handling JSON Web Tokens (JWT) in the authentication system. It includes token generation, verification, validation, and refresh operations with proper error handling and TypeScript type safety.

## Features

- ✅ Token generation (access and refresh tokens)
- ✅ Token verification with signature and expiration validation
- ✅ Token refresh functionality
- ✅ Custom error classes for precise error handling
- ✅ TypeScript interfaces and types
- ✅ Comprehensive JSDoc documentation
- ✅ Logging integration
- ✅ Issuer and audience validation

## Token Configuration

- **Access Token**: 15 minutes expiry, used for API authentication
- **Refresh Token**: 7 days expiry, used to obtain new access tokens
- **Issuer**: `messenger-api`
- **Audience**: `messenger-client`

## Core Functions

### Token Generation

#### `generateAccessToken(userId: string, additionalClaims?: Record<string, any>): string`

Generates a short-lived access token for API authentication.

```typescript
const token = generateAccessToken('user-123');
// or with additional claims
const token = generateAccessToken('user-123', { role: 'admin' });
```

#### `generateRefreshToken(userId: string, additionalClaims?: Record<string, any>): string`

Generates a long-lived refresh token for obtaining new access tokens.

```typescript
const refreshToken = generateRefreshToken('user-123');
```

#### `generateTokenPair(userId: string, additionalClaims?: Record<string, any>): TokenPair`

Convenience function to generate both access and refresh tokens at once.

```typescript
const { accessToken, refreshToken } = generateTokenPair('user-123');
```

### Token Verification

#### `verifyAccessToken(token: string): JwtPayload`

Verifies and decodes an access token. Throws error if invalid or expired.

```typescript
try {
  const payload = verifyAccessToken(token);
  console.log('User ID:', payload.userId);
} catch (error) {
  if (error instanceof JwtExpiredError) {
    // Handle expired token
  } else if (error instanceof JwtInvalidError) {
    // Handle invalid token
  }
}
```

#### `verifyRefreshToken(token: string): JwtPayload`

Verifies and decodes a refresh token. Throws error if invalid or expired.

```typescript
try {
  const payload = verifyRefreshToken(refreshToken);
  // Token is valid
} catch (error) {
  // Token is invalid or expired
}
```

### Token Refresh

#### `refreshAccessToken(refreshToken: string): string`

Validates a refresh token and generates a new access token.

```typescript
try {
  const newAccessToken = refreshAccessToken(refreshToken);
} catch (error) {
  if (error instanceof JwtExpiredError) {
    // Refresh token expired, user needs to login again
  }
}
```

## Utility Functions

### `decodeToken(token: string): JwtPayload | null`

Decodes a token without verifying signature. Useful for debugging.

**Warning**: Does not validate signature or expiration.

```typescript
const payload = decodeToken(token);
if (payload) {
  console.log('Token expires at:', new Date(payload.exp! * 1000));
}
```

### `extractTokenFromHeader(authHeader?: string): string | null`

Extracts JWT token from Authorization header.

```typescript
const token = extractTokenFromHeader(req.headers.authorization);
if (token) {
  const payload = verifyAccessToken(token);
}
```

### `isTokenExpired(token: string): boolean`

Checks if a token is expired without verifying signature.

```typescript
if (isTokenExpired(token)) {
  // Request new token
}
```

### `getTokenExpiration(token: string): Date | null`

Gets the expiration date of a token.

```typescript
const expiresAt = getTokenExpiration(token);
if (expiresAt) {
  console.log('Token expires at:', expiresAt);
}
```

### `isValidTokenFormat(token: string): boolean`

Validates basic JWT structure (3 parts separated by dots).

```typescript
if (isValidTokenFormat(token)) {
  // Proceed with verification
}
```

## Types and Interfaces

### `TokenType` Enum

```typescript
enum TokenType {
  ACCESS = 'access',
  REFRESH = 'refresh',
}
```

### `JwtPayload` Interface

```typescript
interface JwtPayload {
  userId: string;
  type: TokenType;
  iat?: number;  // Issued at
  exp?: number;  // Expiration
  nbf?: number;  // Not before
}
```

### `TokenPair` Interface

```typescript
interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
```

## Error Classes

### `JwtError`

Base error class for all JWT-related errors.

### `JwtExpiredError`

Thrown when a token has expired.

### `JwtInvalidError`

Thrown when a token is invalid (wrong signature, wrong type, etc.).

### `JwtMalformedError`

Thrown when a token is malformed (not properly structured).

## Usage Example

```typescript
import {
  generateTokenPair,
  verifyAccessToken,
  refreshAccessToken,
  JwtExpiredError,
  JwtInvalidError,
} from './utils/jwt.util';

// Login: Generate tokens
const { accessToken, refreshToken } = generateTokenPair(userId);

// API Request: Verify access token
try {
  const payload = verifyAccessToken(accessToken);
  // Process authenticated request
} catch (error) {
  if (error instanceof JwtExpiredError) {
    // Try to refresh
    try {
      const newAccessToken = refreshAccessToken(refreshToken);
      // Retry request with new token
    } catch (refreshError) {
      // Refresh failed, require login
    }
  }
}
```

## Security Considerations

1. **Secret Management**: JWT secrets are loaded from environment variables and must be:
   - At least 32 characters long
   - Different for access and refresh tokens
   - Changed from example values in production

2. **Token Validation**: All verify functions check:
   - Signature validity
   - Token expiration
   - Token type (access vs refresh)
   - Issuer and audience

3. **Error Handling**: Use custom error classes to handle different failure scenarios appropriately.

4. **Logging**: All critical operations are logged for monitoring and debugging.

## Environment Variables

Required environment variables (configured in `config/env.ts`):

- `JWT_SECRET`: Secret for signing access tokens (min 32 chars)
- `JWT_REFRESH_SECRET`: Secret for signing refresh tokens (min 32 chars, must differ from JWT_SECRET)

## Related Files

- `backend/src/config/env.ts` - Environment configuration and JWT constants
- `backend/src/middleware/auth.middleware.ts` - Uses JWT verification
- `backend/src/services/auth.service.ts` - Uses JWT generation and refresh
- `backend/src/utils/logger.util.ts` - Logging integration
