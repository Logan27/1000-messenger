# Middleware Documentation

This directory contains Express middleware for the messenger application backend.

## Error Handling Middleware (`error.middleware.ts`)

Comprehensive error handling middleware for converting errors to structured HTTP responses.

### Features

- ✅ Custom error classes for all HTTP status codes (400, 401, 403, 404, 409, 422, 429, 500, 503)
- ✅ Automatic Zod validation error handling with structured field details
- ✅ Prisma database error conversion (unique constraints, foreign keys, not found)
- ✅ JWT authentication error handling
- ✅ Severity-based logging (info, warn, error)
- ✅ Development/production mode error responses
- ✅ Request context tracking (URL, method, IP, userId)
- ✅ Stack traces in development mode
- ✅ Async handler utility for automatic error catching

### Error Classes

#### Base Error Class

```typescript
import { AppError } from '../middleware/error.middleware';

throw new AppError('Custom error', 400, 'CUSTOM_ERROR', { detail: 'value' });
```

#### HTTP Status Error Classes

```typescript
import {
  BadRequestError,      // 400 - Invalid input
  UnauthorizedError,    // 401 - Authentication failed
  ForbiddenError,       // 403 - Lacking permissions
  NotFoundError,        // 404 - Resource not found
  ConflictError,        // 409 - Resource conflict
  ValidationError,      // 422 - Validation failed
  RateLimitError,       // 429 - Rate limit exceeded
  InternalServerError,  // 500 - Server error
  ServiceUnavailableError, // 503 - Service down
} from '../middleware/error.middleware';

// Examples
throw new BadRequestError('Invalid user ID format');
throw new NotFoundError('User not found');
throw new ConflictError('Username already exists');
throw new ValidationError('Invalid input', [
  { field: 'username', message: 'Too short' }
]);
```

### Usage in Services

```typescript
import { NotFoundError, ForbiddenError } from '../middleware/error.middleware';

export class UserService {
  async getUser(id: string) {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  async updateUser(id: string, requesterId: string, data: any) {
    if (id !== requesterId) {
      throw new ForbiddenError('Cannot update another user');
    }
    // ... update logic
  }
}
```

### Usage in Controllers

Controllers automatically pass errors to the error middleware using `next()`:

```typescript
export class UserController {
  getUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.userService.getUser(req.params.id);
      res.json(user);
    } catch (error) {
      next(error); // Error middleware handles conversion
    }
  };
}
```

### Async Handler Utility

Eliminates try-catch boilerplate in route handlers:

```typescript
import { asyncHandler } from '../middleware/error.middleware';

router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await userService.getUser(req.params.id);
  res.json(user);
}));

// Errors are automatically caught and passed to error middleware
```

### Error Response Format

All errors return JSON with consistent structure:

```json
{
  "error": "NOT_FOUND",
  "message": "User not found",
  "statusCode": 404
}
```

#### Validation Errors

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Validation failed",
  "statusCode": 422,
  "details": [
    {
      "field": "username",
      "message": "Username must be at least 3 characters",
      "code": "too_small"
    }
  ]
}
```

#### Development Mode

Additional context in development:

```json
{
  "error": "INTERNAL_ERROR",
  "message": "Database connection failed",
  "statusCode": 500,
  "stack": "Error: Database connection failed\n    at ...",
  "path": "/api/users",
  "method": "GET",
  "timestamp": "2025-10-31T12:00:00.000Z"
}
```

### Automatic Error Conversions

The middleware automatically handles:

#### Zod Validation Errors
```typescript
// Automatically converted to ValidationError with field details
const schema = z.object({ username: z.string().min(3) });
schema.parse({ username: 'ab' }); // Throws ZodError → 422 response
```

#### Prisma Database Errors
```typescript
// P2002: Unique constraint → ConflictError (409)
// P2025: Not found → NotFoundError (404)
// P2003: Foreign key violation → BadRequestError (400)
```

#### JWT Errors
```typescript
// JwtExpiredError → UnauthorizedError (401)
// JwtInvalidError → UnauthorizedError (401)
// JwtMalformedError → UnauthorizedError (401)
```

### 404 Not Found Handler

Separate handler for undefined routes (registered before error middleware):

```typescript
import { notFoundHandler, errorHandler } from '../middleware/error.middleware';

// Routes
app.use('/api/users', userRoutes);

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);
```

### Logging Behavior

Errors are logged with appropriate severity:

- **500+ errors**: Logged as `error` with full stack trace
- **400-499 errors**: Logged as `warn` with request context
- **Other errors**: Logged as `info`

Each log includes:
- Error message and code
- HTTP status code
- Request URL, method, IP
- User ID (if authenticated)
- Stack trace

### Best Practices

1. **Use specific error classes**: Prefer `NotFoundError` over generic `Error`
2. **Provide context**: Include helpful details in error messages
3. **Use async handler**: Simplify controller code with `asyncHandler`
4. **Don't expose internals**: Let middleware sanitize errors in production
5. **Log strategically**: Use appropriate error classes for correct log levels

### Migration from Generic Errors

**Before**:
```typescript
if (!user) {
  throw new Error('User not found');
}
```

**After**:
```typescript
import { NotFoundError } from '../middleware/error.middleware';

if (!user) {
  throw new NotFoundError('User not found');
}
```

## Authentication Middleware (`auth.middleware.ts`)

JWT-based authentication middleware for protecting routes and verifying user identity.

### Features

- ✅ JWT access token verification (15-minute expiry)
- ✅ Bearer token extraction from Authorization header
- ✅ Comprehensive error handling (expired, invalid, malformed tokens)
- ✅ Security logging for authentication failures
- ✅ TypeScript type safety with extended Request interface
- ✅ Optional authentication support

### Usage

#### Required Authentication

Protect routes that require authentication:

```typescript
import { authMiddleware } from '../middleware/auth.middleware';
import { Router } from 'express';

const router = Router();

// Apply to all routes in router
router.use(authMiddleware.authenticate);

// Or apply to specific routes
router.get('/profile', authMiddleware.authenticate, (req, res) => {
  const userId = req.user!.userId;
  // ... handle request
});
```

#### Optional Authentication

For routes that adapt based on authentication status:

```typescript
import { optionalAuthenticate } from '../middleware/auth.middleware';

router.get('/feed', optionalAuthenticate, (req, res) => {
  if (req.user) {
    // User is authenticated - show personalized content
    const userId = req.user.userId;
  } else {
    // User is not authenticated - show public content
  }
});
```

### Request Extension

The middleware extends the Express Request interface with user information:

```typescript
interface Request {
  user?: {
    userId: string;           // User's unique identifier
    tokenPayload?: JwtPayload; // Full JWT payload (optional)
  };
}
```

### Error Responses

The middleware returns appropriate HTTP 401 responses with descriptive error messages:

#### No Token
```json
{
  "error": "No token provided",
  "message": "Authorization header with Bearer token is required"
}
```

#### Expired Token
```json
{
  "error": "Token expired",
  "message": "Access token has expired. Please refresh your token."
}
```

#### Invalid Token
```json
{
  "error": "Invalid token",
  "message": "The provided token is invalid or malformed."
}
```

#### Unexpected Error
```json
{
  "error": "Authentication failed",
  "message": "Failed to authenticate the request."
}
```

### Security Logging

The middleware logs all authentication events:

- **Debug**: Successful authentication (includes userId, path, method)
- **Warn**: Failed authentication attempts (includes IP, user agent, path, method)
- **Error**: Unexpected errors (includes full error details and stack trace)

### Token Format

Tokens must be provided in the Authorization header using Bearer authentication:

```
Authorization: Bearer <jwt-token>
```

### Token Verification

The middleware uses JWT utilities from `utils/jwt.util.ts`:

1. Extract token from Authorization header
2. Verify signature using `JWT_SECRET` from environment
3. Validate token type is `access`
4. Check expiration (15 minutes from issue)
5. Validate issuer and audience claims

### Related Files

- **JWT Utilities**: `backend/src/utils/jwt.util.ts` - Token generation and verification
- **Auth Service**: `backend/src/services/auth.service.ts` - Login and token refresh
- **Environment Config**: `backend/src/config/env.ts` - JWT secrets and configuration

### Testing

To test authentication middleware:

```bash
# Valid token
curl -H "Authorization: Bearer <valid-jwt>" http://localhost:3000/api/users/profile

# Missing token
curl http://localhost:3000/api/users/profile
# Returns: 401 No token provided

# Expired token
curl -H "Authorization: Bearer <expired-jwt>" http://localhost:3000/api/users/profile
# Returns: 401 Token expired

# Invalid token
curl -H "Authorization: Bearer invalid" http://localhost:3000/api/users/profile
# Returns: 401 Invalid token
```

### Best Practices

1. **Apply to all protected routes**: Use `router.use(authMiddleware.authenticate)` to protect entire route groups
2. **Access user info safely**: Always use non-null assertion (`req.user!`) or check for existence after authentication middleware
3. **Refresh expired tokens**: Frontend should implement token refresh when receiving 401 with "Token expired"
4. **Monitor security logs**: Watch for patterns of failed authentication attempts (potential attacks)
5. **Use HTTPS**: Always use HTTPS in production to protect tokens in transit

### Migration Notes

The middleware has been updated to:
- Use JWT utilities directly instead of AuthService (removes circular dependency)
- Provide singleton instance for convenience (`authMiddleware`)
- Add optional authentication support (`optionalAuthenticate`)
- Improve error messages with specific token error types
- Add comprehensive security logging

Routes should import the singleton instance:
```typescript
// Old (deprecated)
import { AuthMiddleware } from '../middleware/auth.middleware';
const authMiddleware = new AuthMiddleware(authService);

// New (recommended)
import { authMiddleware } from '../middleware/auth.middleware';
```

## Rate Limiting Middleware (`rate-limit.middleware.ts`)

Redis-based rate limiting middleware for protecting routes from abuse and ensuring fair resource usage across all server instances.

### Features

- ✅ Redis-backed distributed rate limiting
- ✅ Per-user and per-IP rate limits
- ✅ Multiple rate limiters for different use cases
- ✅ Standard rate limit headers (RateLimit-*)
- ✅ Automatic key expiration
- ✅ Security logging for violations
- ✅ Graceful degradation on Redis errors

### Available Rate Limiters

#### API Rate Limiter

General rate limiting for all API endpoints:

```typescript
import { apiRateLimit } from '../middleware/rate-limit.middleware';

router.use('/api', apiRateLimit);
```

- **Limit**: 100 requests per minute per IP
- **Window**: 1 minute
- **Key**: IP address

#### Authentication Rate Limiter

Stricter rate limiting for login endpoints:

```typescript
import { authRateLimit } from '../middleware/rate-limit.middleware';

router.post('/auth/login', authRateLimit, loginHandler);
```

- **Limit**: 5 attempts per 15 minutes per IP
- **Window**: 15 minutes
- **Key**: IP address
- **Special**: Skips successful requests (only counts failures)

#### Message Rate Limiter

Rate limiting for message sending:

```typescript
import { messageRateLimit } from '../middleware/rate-limit.middleware';

router.post('/messages', authMiddleware.authenticate, messageRateLimit, sendMessageHandler);
```

- **Limit**: 10 messages per second per user
- **Window**: 1 second
- **Key**: User ID (falls back to IP for unauthenticated requests)

#### Upload Rate Limiter

Rate limiting for file uploads:

```typescript
import { uploadRateLimit } from '../middleware/rate-limit.middleware';

router.post('/upload', authMiddleware.authenticate, uploadRateLimit, uploadHandler);
```

- **Limit**: 10 uploads per minute per user
- **Window**: 1 minute
- **Key**: User ID (falls back to IP for unauthenticated requests)

#### Search Rate Limiter

Rate limiting for search endpoints:

```typescript
import { searchRateLimit } from '../middleware/rate-limit.middleware';

router.get('/search', authMiddleware.authenticate, searchRateLimit, searchHandler);
```

- **Limit**: 30 searches per minute per user
- **Window**: 1 minute
- **Key**: User ID (falls back to IP for unauthenticated requests)

#### Contact Request Rate Limiter

Daily rate limiting for contact requests:

```typescript
import { contactRequestRateLimit } from '../middleware/rate-limit.middleware';

router.post('/contacts/request', authMiddleware.authenticate, contactRequestRateLimit, sendContactRequestHandler);
```

- **Limit**: 50 requests per day per user
- **Window**: 24 hours
- **Key**: User ID (falls back to IP for unauthenticated requests)

### Rate Limit Response

When a rate limit is exceeded, the middleware returns a 429 Too Many Requests response:

```json
{
  "error": "Too Many Requests",
  "message": "Too many login attempts, please try again later",
  "retryAfter": "900"
}
```

### Rate Limit Headers

Standard rate limit headers are included in all responses:

```
RateLimit-Limit: 100
RateLimit-Remaining: 99
RateLimit-Reset: 1635768000
```

### Redis Key Structure

All rate limit keys are prefixed with `ratelimit:` followed by the limiter type:

- `ratelimit:api:{ip}` - API rate limits
- `ratelimit:auth:{ip}` - Authentication rate limits
- `ratelimit:message:{userId}` - Message rate limits
- `ratelimit:upload:{userId}` - Upload rate limits
- `ratelimit:search:{userId}` - Search rate limits
- `ratelimit:contact:{userId}` - Contact request rate limits

### Distributed Rate Limiting

The rate limiters use Redis as a shared store, ensuring that rate limits are enforced consistently across all server instances in a horizontally scaled deployment. This means:

- Rate limits are shared across all servers
- Server restarts don't reset rate limit counters
- Load balancing doesn't affect rate limit accuracy

### Security Logging

All rate limit violations are logged with security metadata:

```typescript
logger.warn('Rate limit exceeded', {
  type: 'security',
  ip: '192.168.1.1',
  user: 'user123',
  path: '/api/messages',
  method: 'POST',
});
```

### Configuration

Rate limits are configured in `backend/src/config/constants.ts`:

```typescript
export const LIMITS = {
  LOGIN_MAX_ATTEMPTS: 5,
  LOGIN_ATTEMPTS_WINDOW_MS: 15 * 60 * 1000,
  API_RATE_MAX_REQUESTS: 100,
  API_RATE_WINDOW_MS: 60 * 1000,
  MESSAGES_PER_SECOND_PER_USER: 10,
  UPLOAD_MAX_REQUESTS: 10,
  UPLOAD_RATE_WINDOW_MS: 60 * 1000,
  SEARCH_MAX_REQUESTS: 30,
  SEARCH_RATE_WINDOW_MS: 60 * 1000,
  CONTACT_REQUESTS_PER_DAY: 50,
};
```

### Best Practices

1. **Apply rate limits early**: Add rate limiters before resource-intensive middleware
2. **Use appropriate limiters**: Choose the right rate limiter for each endpoint type
3. **Order matters**: Place authentication middleware before user-based rate limiters
4. **Monitor violations**: Watch security logs for patterns of abuse
5. **Adjust limits**: Tune limits based on actual usage patterns and abuse detection

### Example Usage

Full example with multiple rate limiters:

```typescript
import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { apiRateLimit, authRateLimit, messageRateLimit } from '../middleware/rate-limit.middleware';

const router = express.Router();

// Apply general API rate limiting to all routes
router.use(apiRateLimit);

// Authentication routes with stricter limits
router.post('/auth/login', authRateLimit, loginHandler);
router.post('/auth/register', authRateLimit, registerHandler);

// Protected routes with user-specific rate limits
router.post('/messages', authMiddleware.authenticate, messageRateLimit, sendMessageHandler);
```

### Related Files

- **Redis Config**: `backend/src/config/redis.ts` - Redis client and configuration
- **Constants**: `backend/src/config/constants.ts` - Rate limit values
- **Logger**: `backend/src/utils/logger.util.ts` - Security logging utilities
