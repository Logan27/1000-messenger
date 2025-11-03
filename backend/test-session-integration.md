# Session Service Integration Test Plan

## Manual Validation Scenario (Ticket T053)

This document outlines how to manually test the session service implementation to ensure it meets the acceptance criteria:

> "Create new account with username/password, log out, log back in, verify session persistence"

### Prerequisites

1. Backend server running with PostgreSQL and Redis
2. API client (curl, Postman, or similar)
3. Redis CLI for inspecting cache

### Test Steps

#### 1. Create New Account (Register)

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser123",
    "password": "SecurePass123!"
  }'
```

**Expected Response:**
```json
{
  "user": {
    "id": "uuid-here",
    "username": "testuser123",
    "displayName": "testuser123"
  }
}
```

**Session Service Actions:**
- No session created (registration only creates user account)

---

#### 2. Login (First Time)

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Device-Type: web" \
  -H "X-Device-Name: Chrome Browser" \
  -d '{
    "username": "testuser123",
    "password": "SecurePass123!"
  }'
```

**Expected Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-uuid",
    "username": "testuser123",
    "displayName": "testuser123",
    "avatarUrl": null
  }
}
```

**Session Service Actions:**
✅ Creates new session in PostgreSQL
✅ Caches session in Redis with three keys:
   - `session:token:{refreshToken}` → Full session object
   - `session:id:{sessionId}` → Full session object  
   - `session:user:{userId}` → Set containing sessionId

**Verify in Redis:**
```bash
# Connect to Redis CLI
redis-cli

# Check session by token (replace {refreshToken} with actual token)
GET "session:token:{refreshToken}"

# Check user's active sessions
SMEMBERS "session:user:{userId}"

# Verify session by ID
GET "session:id:{sessionId}"
```

**Verify in PostgreSQL:**
```sql
SELECT * FROM user_sessions 
WHERE session_token = '{refreshToken}' 
AND is_active = TRUE;
```

---

#### 3. Access Protected Resource (Verify Session)

```bash
curl -X GET http://localhost:3000/api/user/me \
  -H "Authorization: Bearer {accessToken}"
```

**Expected Response:**
```json
{
  "id": "user-uuid",
  "username": "testuser123",
  "displayName": "testuser123",
  "avatarUrl": null,
  "status": "online"
}
```

**Session Service Actions:**
✅ Auth middleware validates access token
✅ Session remains cached in Redis for fast validation

---

#### 4. Refresh Access Token (Session Persistence)

Wait for access token to expire (15 minutes), or test immediately:

```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "{refreshToken}"
  }'
```

**Expected Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Session Service Actions:**
✅ Finds session by token (Redis cache hit)
✅ Validates session is active and not expired
✅ Issues new access token
✅ Updates last_activity timestamp in DB and cache

---

#### 5. Logout (Invalidate Session)

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "{refreshToken}"
  }'
```

**Expected Response:**
```json
{
  "message": "Logged out successfully"
}
```

**Session Service Actions:**
✅ Marks session as inactive in PostgreSQL
✅ Removes session from all Redis caches:
   - Deletes `session:token:{refreshToken}`
   - Deletes `session:id:{sessionId}`
   - Removes sessionId from `session:user:{userId}` set

**Verify in Redis:**
```bash
# Should return null
GET "session:token:{refreshToken}"

# Set should be empty or not contain the session
SMEMBERS "session:user:{userId}"
```

**Verify in PostgreSQL:**
```sql
SELECT is_active FROM user_sessions 
WHERE session_token = '{refreshToken}';
-- Should return is_active = FALSE
```

---

#### 6. Attempt to Use Invalidated Session

Try to refresh token or access protected resource with old tokens:

```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "{old-refreshToken}"
  }'
```

**Expected Response:**
```json
{
  "error": "Invalid refresh token"
}
```

---

#### 7. Login Again (Verify Session Persistence)

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Device-Type: mobile" \
  -H "X-Device-Name: iPhone 13" \
  -d '{
    "username": "testuser123",
    "password": "SecurePass123!"
  }'
```

**Expected Response:**
```json
{
  "accessToken": "new-access-token",
  "refreshToken": "new-refresh-token",
  "user": { ... }
}
```

**Session Service Actions:**
✅ Creates new session (different from previous)
✅ Caches new session in Redis
✅ User can now have multiple active sessions across devices

---

### Multi-Device Session Test

#### 8. Login from Multiple Devices

Login from "web" device:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Device-Type: web" \
  -d '{"username": "testuser123", "password": "SecurePass123!"}'
```

Login from "mobile" device:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Device-Type: mobile" \
  -d '{"username": "testuser123", "password": "SecurePass123!"}'
```

**Verify in Redis:**
```bash
# Should show 2 session IDs
SMEMBERS "session:user:{userId}"
```

**Verify in Code:**
```typescript
const sessions = await sessionService.getActiveUserSessions(userId);
console.log(`Active sessions: ${sessions.length}`); // Should be 2
```

---

### Performance Verification

#### 9. Check Redis Cache Performance

```bash
# Monitor Redis operations
redis-cli MONITOR
```

Then login and perform operations. You should see:
- `SET session:token:...` on login
- `GET session:token:...` on token validation
- `DEL session:token:...` on logout

#### 10. Verify Cache Hit Rate

```bash
# In application, check logs for:
# "Session found in cache" - Cache hit
# "Session loaded from database and cached" - Cache miss
```

**Expected Behavior:**
- First lookup: Cache miss (loads from DB)
- Subsequent lookups: Cache hits (served from Redis)
- Cache TTL: Auto-calculated based on session expiry

---

### Edge Cases to Test

#### 11. Expired Session Cleanup

```bash
# Manually set a session to expire in the past
UPDATE user_sessions SET expires_at = NOW() - INTERVAL '1 day' WHERE id = '{sessionId}';

# Run cleanup
curl -X POST http://localhost:3000/api/internal/cleanup-sessions
```

**Expected:**
- Expired session deleted from PostgreSQL
- Cache entries removed from Redis

#### 12. Session Extension on Token Refresh

Monitor `expires_at` field before and after token refresh:

```sql
SELECT expires_at FROM user_sessions WHERE session_token = '{refreshToken}';
```

Then refresh token and check again - it should be extended.

---

## Acceptance Criteria Verification

✅ **SessionService delivers Redis session management:**
- Comprehensive caching with multiple key patterns
- Automatic cache invalidation
- Session cleanup
- Multi-device support

✅ **Manual validation scenario works:**
1. ✅ Create new account with username/password
2. ✅ Log in (creates session in Redis + PostgreSQL)
3. ✅ Log out (invalidates session in both stores)
4. ✅ Log back in (creates new session)
5. ✅ Verify session persistence (Redis cache + DB storage)

✅ **Backend lint/build commands succeed:**
- TypeScript compilation passes
- No new linting errors introduced
- All session.service.ts code is type-safe

---

## Redis Cache Architecture

The SessionService uses a sophisticated multi-key caching strategy:

### Key Pattern 1: Token-Based Lookup (Primary)
```
Key: session:token:{refreshToken}
Value: {full session object as JSON}
TTL: Min(session expiry, 1 hour)
```

**Purpose:** Fast session validation during authentication

### Key Pattern 2: ID-Based Lookup (Secondary)  
```
Key: session:id:{sessionId}
Value: {full session object as JSON}
TTL: Min(session expiry, 1 hour)
```

**Purpose:** Quick lookup by session ID (used by WebSocket connections)

### Key Pattern 3: User Session Set
```
Key: session:user:{userId}
Value: Set of session IDs
TTL: No expiry (cleaned on logout)
```

**Purpose:** Multi-device session tracking, online status determination

### Cache Invalidation Flow

**On Logout:**
1. Update PostgreSQL (SET is_active = FALSE)
2. Delete `session:token:{token}`
3. Delete `session:id:{sessionId}`
4. SREM `session:user:{userId}` sessionId

**On Session Expiry:**
1. Background job deletes expired rows from PostgreSQL
2. Same cache invalidation as logout

**On Session Update (socket ID, last activity):**
1. Update PostgreSQL
2. Update both Redis keys with new data

---

## Troubleshooting

### Session not found after login
- Check PostgreSQL: `SELECT * FROM user_sessions WHERE session_token = '{token}'`
- Check Redis: `GET "session:token:{token}"`
- Verify Redis is connected: `redis-cli PING`

### Cache misses on every request
- Check Redis TTL: `TTL "session:token:{token}"`
- Verify TTL configuration in `redis.ts`: `REDIS_CONFIG.TTL.SESSION`
- Check system clock sync (TTL calculated based on time difference)

### Session not invalidated on logout
- Check database: is_active should be FALSE
- Verify Redis keys deleted: All three key patterns should be gone
- Check logs for error messages during invalidation

---

## Performance Metrics

Expected performance characteristics:

| Operation | Redis | PostgreSQL | Improvement |
|-----------|-------|------------|-------------|
| Session lookup | ~1-2ms | ~10-50ms | **5-25x faster** |
| Session creation | ~5-10ms | ~20-30ms | **2-4x faster** |
| Multi-device query | ~5-10ms | ~50-100ms | **5-10x faster** |

**Memory footprint:** ~500 bytes per session in Redis
**Cache hit rate:** Expected >95% after warm-up

