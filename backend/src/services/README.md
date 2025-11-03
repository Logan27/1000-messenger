# Backend Services Documentation

## SessionService

The SessionService provides comprehensive Redis-backed session management for user authentication and multi-device support.

### Features

- **Redis Caching**: All sessions are cached in Redis for fast lookup
- **Multi-Device Support**: Track multiple active sessions per user
- **WebSocket Integration**: Map socket IDs to sessions for real-time features
- **Automatic Cleanup**: Expired sessions are automatically cleaned up
- **Session Extension**: Support for refresh token flows

### Redis Key Patterns

The service uses multiple Redis key patterns for efficient lookups:

- `session:token:{token}` - Primary lookup by session token
- `session:id:{sessionId}` - Secondary lookup by session ID
- `session:user:{userId}` - Set of active session IDs for a user

### Usage Examples

#### Creating a Session (Login)

```typescript
import { SessionService } from './services/session.service';

const sessionService = new SessionService();

// Create a new session on login
const session = await sessionService.createSession({
  userId: user.id,
  sessionToken: refreshToken,
  deviceId: 'device-uuid',
  deviceType: 'mobile',
  deviceName: 'iPhone 13',
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
});
```

#### Finding a Session (Auth Middleware)

```typescript
// Fast Redis-backed lookup
const session = await sessionService.findByToken(token);

if (!session || !session.isActive) {
  throw new Error('Invalid session');
}

// Check expiry
if (new Date(session.expiresAt) < new Date()) {
  throw new Error('Session expired');
}
```

#### Getting Active Sessions (Multi-Device Management)

```typescript
// Get all active sessions for a user
const sessions = await sessionService.getActiveUserSessions(userId);

// Check session count
const count = await sessionService.getSessionCount(userId);

console.log(`User has ${count} active sessions across ${sessions.length} devices`);
```

#### Updating WebSocket Connection

```typescript
// When WebSocket connects, link socket ID to session
await sessionService.updateSocketId(sessionId, socket.id);

// Later, when checking if user is online
const sessions = await sessionService.getActiveUserSessions(userId);
const hasActiveSocket = sessions.some(s => s.socketId);
```

#### Invalidating Sessions (Logout)

```typescript
// Single session logout
await sessionService.invalidateSession(sessionToken);

// Logout from all devices
await sessionService.invalidateAllUserSessions(userId);
```

#### Session Extension (Token Refresh)

```typescript
// Extend session expiry when refreshing access token
const newExpiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
await sessionService.extendSession(sessionToken, newExpiryDate);
```

#### Periodic Cleanup (Background Job)

```typescript
// Run periodically (e.g., every hour) to clean expired sessions
setInterval(async () => {
  const count = await sessionService.cleanupExpiredSessions();
  console.log(`Cleaned up ${count} expired sessions`);
}, 60 * 60 * 1000); // 1 hour
```

### Architecture

The service implements a **cache-aside pattern with write-through updates**:

1. **Read Operations**: Check Redis first, fallback to PostgreSQL if cache miss
2. **Write Operations**: Update PostgreSQL first, then update Redis cache
3. **Delete Operations**: Delete from PostgreSQL, then invalidate Redis cache

This ensures:
- Fast read performance (most requests served from Redis)
- Data consistency (PostgreSQL is source of truth)
- Automatic cache warm-up on cache misses
- Graceful degradation if Redis is unavailable

### Performance Characteristics

- **Session Lookup**: ~1-2ms (Redis) vs ~10-50ms (PostgreSQL)
- **Multi-Device Query**: ~5-10ms with Redis set operations
- **Cache TTL**: Auto-calculated based on session expiry, max 1 hour
- **Memory Usage**: ~500 bytes per session in Redis

### Error Handling

All methods include comprehensive error handling:
- Database errors are logged and re-thrown
- Redis errors are logged but don't break functionality (graceful fallback)
- All operations are wrapped in try-catch blocks
- Detailed logging at debug/info/error levels

### Integration Points

The SessionService is used by:

1. **AuthService** - Creates sessions on login, invalidates on logout
2. **SocketAuthMiddleware** - Validates sessions for WebSocket connections
3. **SocketManager** - Updates socket IDs and checks active sessions
4. **AuthMiddleware** - Validates session tokens for HTTP requests

### Testing

To test session management:

```typescript
// Test session creation and retrieval
const session = await sessionService.createSession({
  userId: 'test-user-id',
  sessionToken: 'test-token',
  expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour
});

expect(session.id).toBeDefined();
expect(session.userId).toBe('test-user-id');

// Verify Redis cache
const cached = await sessionService.findByToken('test-token');
expect(cached).toEqual(session);

// Test invalidation
await sessionService.invalidateSession('test-token');
const invalid = await sessionService.findByToken('test-token');
expect(invalid).toBeNull();
```

### Migration Notes

The SessionService requires the `user_sessions` table to exist in PostgreSQL:

```sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  session_token VARCHAR(500) UNIQUE NOT NULL,
  device_id VARCHAR(100),
  device_type VARCHAR(50),
  device_name VARCHAR(100),
  socket_id VARCHAR(100),
  ip_address VARCHAR(45),
  user_agent TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_activity TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active, expires_at);
```
