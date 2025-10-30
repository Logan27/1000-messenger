# Middleware Documentation

This directory contains Express middleware for the messenger application backend.

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
