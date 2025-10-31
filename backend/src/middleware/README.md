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

---

## Validation Middleware (`validation.middleware.ts`)

Zod-based request validation middleware for validating request body, query parameters, and route parameters.

### Features

- ✅ Validate request body, query, and params separately or together
- ✅ Comprehensive Zod integration with all schemas from validators.util.ts
- ✅ User-friendly error formatting with field-level details
- ✅ Support for multiple validation targets (body, query, params)
- ✅ Flexible validation options (strip unknown, abort early, logging)
- ✅ Async validation support for complex business rules
- ✅ Convenience helpers for common patterns (UUID params, pagination)
- ✅ Type-safe validation with TypeScript
- ✅ Backward compatible with existing route implementations

### Basic Usage

#### Validate Request Body

```typescript
import { validate, registerSchema } from '../middleware/validation.middleware';

// Basic body validation (default behavior)
router.post('/register', validate(registerSchema), authController.register);
```

#### Validate Query Parameters

```typescript
import { validate, validateQuery } from '../middleware/validation.middleware';
import { userSearchSchema } from '../utils/validators.util';

// Validate query params
router.get('/search', validate(userSearchSchema, 'query'), userController.search);

// Or use convenience wrapper
router.get('/search', validateQuery(userSearchSchema), userController.search);
```

#### Validate Route Parameters

```typescript
import { validateParams, createUuidParamsSchema } from '../middleware/validation.middleware';

// Validate UUID route params
router.get('/users/:userId', 
  validateParams(createUuidParamsSchema('userId')), 
  userController.getById
);

// Multiple params
router.get('/chats/:chatId/messages/:messageId',
  validateParams(createUuidParamsSchema('chatId', 'messageId')),
  messageController.getMessage
);
```

### Advanced Usage

#### Validate Multiple Parts

```typescript
import { validateMultiple, createUuidParamsSchema } from '../middleware/validation.middleware';
import { updateMessageSchema, paginationSchema } from '../utils/validators.util';

// Validate params, body, and query together
router.put('/chats/:chatId/messages/:messageId',
  validateMultiple({
    params: createUuidParamsSchema('chatId', 'messageId'),
    body: updateMessageSchema,
    query: paginationSchema
  }),
  messageController.update
);
```

#### Custom Validation Options

```typescript
import { validate } from '../middleware/validation.middleware';

// Strict mode - reject unknown fields
router.post('/users', 
  validate(userSchema, 'body', { 
    stripUnknown: false,
    logErrors: true,
    errorPrefix: 'User validation failed'
  }), 
  userController.create
);

// Abort on first error
router.post('/data', 
  validate(dataSchema, 'body', { 
    abortEarly: true 
  }), 
  dataController.process
);
```

#### Async Validation

For validation requiring database lookups or external API calls:

```typescript
import { validateAsync } from '../middleware/validation.middleware';
import { userRegistrationSchema } from '../utils/validators.util';
import { UserRepository } from '../repositories/user.repository';

const userRepo = new UserRepository();

router.post('/register',
  validateAsync(async (req) => {
    // First validate the schema
    const data = userRegistrationSchema.parse(req.body);
    
    // Then perform async validation
    const exists = await userRepo.findByUsername(data.username);
    if (exists) {
      throw new Error('Username already taken');
    }
    
    return data;
  }),
  authController.register
);
```

#### Create Reusable Validator

```typescript
import { createValidator } from '../middleware/validation.middleware';

// Create validator with preset options
const strictValidator = createValidator({ 
  stripUnknown: false, 
  logErrors: true 
});

// Use in multiple routes
router.post('/api/data1', strictValidator(schema1), handler1);
router.post('/api/data2', strictValidator(schema2), handler2);
```

#### Custom Pagination Schema

```typescript
import { createPaginationSchema, validateQuery } from '../middleware/validation.middleware';

// Create pagination with custom limits
const largePaginationSchema = createPaginationSchema(200, 100);

router.get('/items', 
  validateQuery(largePaginationSchema), 
  itemController.list
);
```

### Error Response Format

The middleware returns structured error responses for validation failures:

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "username",
      "message": "Username must be at least 3 characters",
      "code": "too_small"
    },
    {
      "field": "password",
      "message": "Password must contain at least one uppercase letter",
      "code": "custom"
    }
  ]
}
```

### Available Schemas

The middleware re-exports commonly used schemas for convenience:

```typescript
import { 
  registerSchema,    // User registration
  loginSchema,       // User login
  messageSchema,     // Create message
  chatSchema         // Create group chat
} from '../middleware/validation.middleware';
```

For all available schemas, see `backend/src/utils/validators.util.ts`.

### Validation Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `stripUnknown` | boolean | `true` | Remove unknown keys from validated data |
| `abortEarly` | boolean | `false` | Stop validation on first error |
| `errorPrefix` | string | `'Validation failed'` | Custom error message prefix |
| `logErrors` | boolean | `false` | Log validation errors with Winston |

### Helper Functions

#### `createUuidParamsSchema(...paramNames)`

Create a schema for validating UUID route parameters:

```typescript
const schema = createUuidParamsSchema('chatId', 'messageId');
// Equivalent to:
// z.object({
//   chatId: z.string().uuid(),
//   messageId: z.string().uuid()
// })
```

#### `createPaginationSchema(maxLimit?, defaultLimit?)`

Create a pagination schema with custom limits:

```typescript
const schema = createPaginationSchema(100, 50);
// Validates limit (max 100, default 50) and offset (default 0)
```

### Best Practices

1. **Use appropriate validation target**: Body for POST/PUT, query for GET, params for route IDs
2. **Validate early**: Apply validation middleware before business logic
3. **Reuse schemas**: Import from `validators.util.ts` rather than defining inline
4. **Enable logging in development**: Set `logErrors: true` to debug validation issues
5. **Use strict mode for sensitive operations**: Set `stripUnknown: false` to reject unexpected fields
6. **Validate all user input**: Never trust client data - validate everything
7. **Combine with auth middleware**: Always authenticate before validating sensitive operations

### Related Files

- **Validator Schemas**: `backend/src/utils/validators.util.ts` - All Zod schemas
- **Error Handler**: `backend/src/middleware/error.middleware.ts` - Global error handling
- **Rate Limiter**: `backend/src/middleware/rate-limit.middleware.ts` - Request rate limiting
- **Auth Middleware**: `backend/src/middleware/auth.middleware.ts` - JWT authentication

### Testing

Example validation tests:

```bash
# Valid request
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"Test123!","displayName":"Test User"}'

# Invalid - username too short
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"ab","password":"Test123!"}'
# Returns: 400 {"error":"Validation failed","details":[{"field":"username","message":"Username must be at least 3 characters"}]}

# Invalid - multiple errors
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"ab","password":"short"}'
# Returns: 400 with multiple validation errors
```
