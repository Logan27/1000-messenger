# Performance Guidelines & Best Practices

## Overview
This document provides performance guidelines for developing and maintaining the 1000-messenger application, optimized for **1000 concurrent users** and **50-100 messages/second**.

---

## Backend Performance

### Database Queries

#### ✅ DO: Use Read Replicas
```typescript
// Use readPool for read operations
const result = await readPool.query(query, params);

// Use pool for write operations
const result = await pool.query(query, params);
```

#### ✅ DO: Add Proper Indexes
Ensure all frequently queried columns have indexes:
```sql
CREATE INDEX idx_messages_chat_created 
ON messages(chat_id, created_at DESC) 
WHERE is_deleted = FALSE;
```

#### ❌ DON'T: N+1 Queries
```typescript
// ❌ BAD - N+1 queries
for (const userId of userIds) {
  const user = await userRepo.findById(userId);
}

// ✅ GOOD - Single batch query
const users = await userRepo.findByIds(userIds);
```

#### ✅ DO: Use Pagination
```typescript
async getMessages(chatId: string, limit = 50, cursor?: string) {
  const safeLimit = Math.min(limit, 100); // Cap at reasonable limit
  // ... fetch with limit
}
```

---

### Redis Caching

#### ❌ DON'T: Use KEYS Command
```typescript
// ❌ BAD - Blocks Redis in production
const keys = await redisClient.keys('session:*');
```

#### ✅ DO: Use SCAN
```typescript
// ✅ GOOD - Non-blocking
let cursor = 0;
do {
  const result = await redisClient.scan(cursor, {
    MATCH: 'session:*',
    COUNT: 100
  });
  cursor = result.cursor;
  // Process result.keys
} while (cursor !== 0);
```

#### ✅ DO: Set Appropriate TTLs
```typescript
// Cache with TTL based on data volatility
await cacheHelpers.set(key, data, REDIS_CONFIG.TTL.SESSION); // 1 hour
await cacheHelpers.set(key, data, REDIS_CONFIG.TTL.USER_STATUS); // 5 minutes
```

#### ✅ DO: Batch Redis Operations
```typescript
// ✅ GOOD - Parallel fetches
const promises = sessionIds.map(id => getCachedSessionById(id));
const sessions = await Promise.all(promises);
```

---

### WebSocket Optimization

#### ❌ DON'T: Broadcast to All Clients
```typescript
// ❌ BAD - O(n²) complexity
this.io.emit('user.status', { userId, status });
```

#### ✅ DO: Target Specific Rooms/Users
```typescript
// ✅ GOOD - Only to contacts
const contactIds = await contactRepo.getUserContactIds(userId);
contactIds.forEach(contactId => {
  this.io.to(`user:${contactId}`).emit('user.status', { userId, status });
});
```

#### ✅ DO: Use Rooms Efficiently
```typescript
// Join user to their chats
socket.join(`user:${userId}`);
socket.join(`chat:${chatId}`);

// Broadcast to chat only
this.io.to(`chat:${chatId}`).emit('message.new', message);
```

---

### Session Management

#### ✅ DO: Use Multi-Key Redis Caching
```typescript
// Cache by token (primary lookup)
await cacheHelpers.set(`session:token:${token}`, session, ttl);

// Cache by ID (secondary lookup)
await cacheHelpers.set(`session:id:${sessionId}`, session, ttl);

// Track user sessions
await cacheHelpers.sadd(`session:user:${userId}`, sessionId);
```

#### ✅ DO: Calculate TTL Based on Expiry
```typescript
const ttl = Math.floor(
  (new Date(session.expiresAt).getTime() - Date.now()) / 1000
);
const cacheTTL = Math.min(ttl, REDIS_CONFIG.TTL.SESSION);
```

---

## Frontend Performance

### State Management

#### ❌ DON'T: Persist Large Data
```typescript
// ❌ BAD - Unbounded growth
persist(
  (set) => ({ messages: {} }), // All messages persisted
  { name: 'chat-storage' }
)
```

#### ✅ DO: Persist Only Essential State
```typescript
// ✅ GOOD - Only metadata
persist(
  (set) => ({ messages: {} }),
  {
    name: 'chat-storage',
    partialize: (state) => ({
      chats: state.chats,
      activeChat: state.activeChat,
      // Don't persist messages
    }),
  }
)
```

### Component Optimization

#### ✅ DO: Memoize Expensive Components
```typescript
import { memo } from 'react';

const MessageList = memo(({ messages }) => {
  return <div>{messages.map(m => <Message key={m.id} {...m} />)}</div>;
}, (prev, next) => {
  // Custom comparison
  return prev.messages.length === next.messages.length &&
         prev.messages.every((m, i) => m.id === next.messages[i]?.id);
});
```

#### ✅ DO: Use Stable Keys
```typescript
// ✅ GOOD - Stable ID
messages.map(msg => <Message key={msg.id} {...msg} />)

// ❌ BAD - Index as key (causes re-renders)
messages.map((msg, idx) => <Message key={idx} {...msg} />)
```

### API Calls

#### ✅ DO: Set Reasonable Timeouts
```typescript
axios.create({
  baseURL: config.API_URL,
  timeout: 15000, // 15 seconds max
});
```

#### ✅ DO: Implement Request Deduplication
```typescript
private refreshTokenPromise: Promise<AuthResponse> | null = null;

async refreshToken() {
  if (!this.refreshTokenPromise) {
    this.refreshTokenPromise = this.performRefresh();
  }
  return this.refreshTokenPromise;
}
```

---

## Build Optimization

### Code Splitting
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'socket-vendor': ['socket.io-client'],
          'state-vendor': ['zustand'],
        },
      },
    },
  },
});
```

### Lazy Loading
```typescript
import { lazy, Suspense } from 'react';

const ChatWindow = lazy(() => import('./components/chat/ChatWindow'));

<Suspense fallback={<LoadingSpinner />}>
  <ChatWindow />
</Suspense>
```

---

## Monitoring & Metrics

### Key Metrics to Track

1. **Response Times**
   - P95 latency < 300ms
   - P99 latency < 500ms
   - Average < 100ms

2. **Throughput**
   - Messages/second: 50-100 sustained
   - WebSocket connections: 1000+ concurrent

3. **Resource Usage**
   - CPU < 70% under load
   - Memory stable (no leaks)
   - Redis hit rate > 90%
   - Database connection pool < 80% utilization

### Health Checks
```typescript
// Monitor pool stats
app.get('/health', async (req, res) => {
  const dbHealth = await testConnection();
  const redisHealth = await checkRedisHealth();
  const poolStats = getPoolStats();
  
  res.json({
    status: dbHealth && redisHealth ? 'healthy' : 'unhealthy',
    database: { connected: dbHealth, ...poolStats },
    redis: { connected: redisHealth },
    uptime: process.uptime(),
  });
});
```

---

## Load Testing

### Running Performance Tests
```bash
cd tools/performance-test
npm install

# Basic load test
npm run test:load -- --users 100 --duration 60s

# Full scale test
npm run test:load -- --users 1000 --duration 300s --message-rate 100
```

### Interpreting Results
- ✅ **Good**: P95 < 300ms, no errors, stable memory
- ⚠️ **Warning**: P95 300-500ms, error rate < 1%
- ❌ **Critical**: P95 > 500ms, error rate > 1%, memory growth

---

## Common Anti-Patterns to Avoid

### Backend
1. ❌ Blocking Redis operations (`KEYS`, `FLUSHALL`)
2. ❌ N+1 queries (fetch in loops)
3. ❌ Broadcasting to all clients unnecessarily
4. ❌ Missing pagination on list endpoints
5. ❌ Synchronous operations in hot paths
6. ❌ Unbounded query results

### Frontend
1. ❌ Persisting all messages to localStorage
2. ❌ Missing memoization on expensive renders
3. ❌ Using array index as React key
4. ❌ Not handling loading/error states
5. ❌ Too long API timeouts
6. ❌ No code splitting for routes

---

## Performance Checklist

Before deploying optimizations:

- [ ] All database queries have appropriate indexes
- [ ] Redis operations use non-blocking commands
- [ ] WebSocket broadcasts are targeted (not broadcast to all)
- [ ] Pagination implemented on all list endpoints
- [ ] Frontend state persistence limited to essential data
- [ ] Components memoized where appropriate
- [ ] Code splitting configured
- [ ] Load tests pass with 1000 concurrent users
- [ ] P95 latency < 300ms under load
- [ ] No memory leaks detected
- [ ] Error rate < 0.1% under load

---

## Additional Resources

- **Optimization Report**: See `OPTIMIZATION_REPORT.md` for detailed findings
- **Database Schema**: See `backend/src/database/migrations/`
- **Load Testing**: See `tools/performance-test/`
- **Monitoring**: Configure Prometheus/Grafana for production metrics

---

**Last Updated:** 2025-11-03  
**Optimized For:** 1000 concurrent users, 50-100 msg/sec  
**Performance Target:** P95 < 300ms, P99 < 500ms
