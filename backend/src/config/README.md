# Configuration Guide

This directory contains all configuration modules for the backend application.

## Redis Configuration (`redis.ts`)

The Redis configuration provides a comprehensive setup for pub/sub messaging and caching operations, essential for the real-time messaging application.

### Overview

Redis is used for multiple purposes in this application:

1. **Pub/Sub Messaging**: Real-time communication between server instances for WebSocket synchronization
2. **Session Caching**: Fast session lookup and management
3. **User Status Tracking**: Online/offline status and presence information
4. **Message Delivery Queue**: Reliable message delivery using Redis Streams
5. **General Caching**: Reducing database load for frequently accessed data

### Architecture

The Redis configuration creates three separate client instances:

- **`redisClient`**: Main client for caching, data storage, and Redis Streams
- **`redisPubClient`**: Dedicated client for publishing messages (required by Socket.IO adapter)
- **`redisSubClient`**: Dedicated client for subscribing to channels (required by Socket.IO adapter)

### Configuration Constants

#### Connection Settings

```typescript
REDIS_CONFIG.MAX_RECONNECT_ATTEMPTS: 10
REDIS_CONFIG.RECONNECT_DELAY_BASE: 100ms
REDIS_CONFIG.SOCKET_TIMEOUT: 5000ms
REDIS_CONFIG.COMMAND_TIMEOUT: 5000ms
```

#### Cache TTL (Time To Live)

```typescript
REDIS_CONFIG.TTL.SESSION: 3600s (1 hour)
REDIS_CONFIG.TTL.USER_STATUS: 300s (5 minutes)
REDIS_CONFIG.TTL.CHAT_LIST: 600s (10 minutes)
REDIS_CONFIG.TTL.MESSAGE_CACHE: 1800s (30 minutes)
REDIS_CONFIG.TTL.CONTACT_LIST: 600s (10 minutes)
REDIS_CONFIG.TTL.TYPING_INDICATOR: 5s
REDIS_CONFIG.TTL.PRESENCE: 300s (5 minutes)
```

#### Cache Key Prefixes

```typescript
REDIS_CONFIG.KEYS.SESSION: 'session:'
REDIS_CONFIG.KEYS.USER_STATUS: 'user:status:'
REDIS_CONFIG.KEYS.USER_ONLINE: 'user:online:'
REDIS_CONFIG.KEYS.CHAT_LIST: 'chat:list:'
REDIS_CONFIG.KEYS.CHAT_UNREAD: 'chat:unread:'
REDIS_CONFIG.KEYS.MESSAGE: 'message:'
REDIS_CONFIG.KEYS.CONTACT_LIST: 'contact:list:'
REDIS_CONFIG.KEYS.TYPING: 'typing:'
REDIS_CONFIG.KEYS.PRESENCE: 'presence:'
REDIS_CONFIG.KEYS.RATE_LIMIT: 'ratelimit:'
```

#### Pub/Sub Channels

```typescript
REDIS_CONFIG.CHANNELS.MESSAGE_NEW: 'message:new'
REDIS_CONFIG.CHANNELS.MESSAGE_EDIT: 'message:edit'
REDIS_CONFIG.CHANNELS.MESSAGE_DELETE: 'message:delete'
REDIS_CONFIG.CHANNELS.MESSAGE_REACTION: 'message:reaction'
REDIS_CONFIG.CHANNELS.USER_STATUS: 'user:status'
REDIS_CONFIG.CHANNELS.TYPING_START: 'typing:start'
REDIS_CONFIG.CHANNELS.TYPING_STOP: 'typing:stop'
REDIS_CONFIG.CHANNELS.READ_RECEIPT: 'read:receipt'
REDIS_CONFIG.CHANNELS.CHAT_UPDATE: 'chat:update'
```

#### Redis Streams

```typescript
REDIS_CONFIG.STREAMS.MESSAGE_DELIVERY: 'message-delivery-stream'
```

### Connection Management

#### Connect to Redis

```typescript
import { connectRedis } from './config/redis';

await connectRedis();
```

#### Close Redis Connections

```typescript
import { closeRedis } from './config/redis';

await closeRedis();
```

#### Health Check

```typescript
import { checkRedisHealth } from './config/redis';

const isHealthy = await checkRedisHealth();
```

### Cache Helpers

The configuration provides a comprehensive set of cache helper functions:

#### Cache-Aside Pattern

```typescript
import { cacheHelpers, REDIS_CONFIG } from './config/redis';

// Get from cache or fetch from database
const user = await cacheHelpers.getOrSet(
  `${REDIS_CONFIG.KEYS.USER_STATUS}${userId}`,
  REDIS_CONFIG.TTL.USER_STATUS,
  async () => {
    // Fallback function if cache miss
    return await userRepository.findById(userId);
  }
);
```

#### Set with TTL

```typescript
await cacheHelpers.set(
  `${REDIS_CONFIG.KEYS.SESSION}${sessionToken}`,
  sessionData,
  REDIS_CONFIG.TTL.SESSION
);
```

#### Get from Cache

```typescript
const session = await cacheHelpers.get<Session>(
  `${REDIS_CONFIG.KEYS.SESSION}${sessionToken}`
);
```

#### Delete from Cache

```typescript
await cacheHelpers.del(`${REDIS_CONFIG.KEYS.SESSION}${sessionToken}`);
```

#### Delete Pattern

```typescript
// Delete all sessions for a user
await cacheHelpers.delPattern(`${REDIS_CONFIG.KEYS.SESSION}${userId}:*`);
```

#### Set Permanent (No Expiration)

```typescript
await cacheHelpers.setPermanent(
  `${REDIS_CONFIG.KEYS.USER_STATUS}${userId}`,
  status
);
```

#### Counter Operations

```typescript
// Simple increment
const count = await cacheHelpers.incr(`message:count:${chatId}`);

// Increment with expiry (for rate limiting)
const attempts = await cacheHelpers.incrWithExpiry(
  `${REDIS_CONFIG.KEYS.RATE_LIMIT}${userId}`,
  900 // 15 minutes
);
```

#### Set Operations

```typescript
// Add to set
await cacheHelpers.sadd(
  `${REDIS_CONFIG.KEYS.USER_ONLINE}`,
  userId1,
  userId2
);

// Remove from set
await cacheHelpers.srem(`${REDIS_CONFIG.KEYS.USER_ONLINE}`, userId);

// Get all members
const onlineUsers = await cacheHelpers.smembers(`${REDIS_CONFIG.KEYS.USER_ONLINE}`);

// Check membership
const isOnline = await cacheHelpers.sismember(
  `${REDIS_CONFIG.KEYS.USER_ONLINE}`,
  userId
);
```

### Pub/Sub Helpers

#### Publish a Message

```typescript
import { pubSubHelpers, REDIS_CONFIG } from './config/redis';

await pubSubHelpers.publish(REDIS_CONFIG.CHANNELS.MESSAGE_NEW, {
  messageId: 'msg-123',
  chatId: 'chat-456',
  senderId: 'user-789',
  content: 'Hello!',
  timestamp: new Date(),
});
```

#### Subscribe to a Channel

```typescript
await pubSubHelpers.subscribe(
  REDIS_CONFIG.CHANNELS.MESSAGE_NEW,
  (data) => {
    console.log('New message received:', data);
    // Handle the message
  }
);
```

#### Unsubscribe from a Channel

```typescript
await pubSubHelpers.unsubscribe(REDIS_CONFIG.CHANNELS.MESSAGE_NEW);
```

### Usage Examples

#### Session Caching

```typescript
import { cacheHelpers, REDIS_CONFIG } from '../config/redis';

// Store session
await cacheHelpers.set(
  `${REDIS_CONFIG.KEYS.SESSION}${token}`,
  sessionData,
  REDIS_CONFIG.TTL.SESSION
);

// Retrieve session
const session = await cacheHelpers.get<Session>(
  `${REDIS_CONFIG.KEYS.SESSION}${token}`
);
```

#### User Status Tracking

```typescript
// Mark user online
await cacheHelpers.sadd(
  `${REDIS_CONFIG.KEYS.USER_ONLINE}`,
  userId
);

// Check if user is online
const isOnline = await cacheHelpers.sismember(
  `${REDIS_CONFIG.KEYS.USER_ONLINE}`,
  userId
);

// Mark user offline
await cacheHelpers.srem(
  `${REDIS_CONFIG.KEYS.USER_ONLINE}`,
  userId
);

// Get all online users
const onlineUsers = await cacheHelpers.smembers(
  `${REDIS_CONFIG.KEYS.USER_ONLINE}`
);
```

#### Message Broadcasting

```typescript
// Publish new message notification
await pubSubHelpers.publish(REDIS_CONFIG.CHANNELS.MESSAGE_NEW, {
  messageId,
  chatId,
  senderId,
  content,
});

// All server instances subscribed to this channel will receive it
```

#### Typing Indicators

```typescript
// Publish typing start
await pubSubHelpers.publish(REDIS_CONFIG.CHANNELS.TYPING_START, {
  chatId,
  userId,
});

// Store typing indicator with short TTL
await cacheHelpers.set(
  `${REDIS_CONFIG.KEYS.TYPING}${chatId}:${userId}`,
  true,
  REDIS_CONFIG.TTL.TYPING_INDICATOR
);
```

#### Rate Limiting

```typescript
// Increment attempt counter with 15-minute expiry
const attempts = await cacheHelpers.incrWithExpiry(
  `${REDIS_CONFIG.KEYS.RATE_LIMIT}login:${username}`,
  900
);

if (attempts > 5) {
  throw new Error('Rate limit exceeded');
}
```

### Best Practices

1. **Always use configuration constants**: Use `REDIS_CONFIG.KEYS.*` and `REDIS_CONFIG.TTL.*` instead of hardcoded strings
2. **Handle cache failures gracefully**: Cache helpers are designed to fail gracefully and log errors
3. **Use appropriate TTLs**: Set shorter TTLs for frequently changing data, longer for stable data
4. **Use cache-aside pattern**: For data that needs to be fetched from database if not in cache
5. **Clean up on logout**: Always invalidate sessions and remove user status on logout
6. **Monitor Redis health**: Use `checkRedisHealth()` in health check endpoints
7. **Use pub/sub for cross-server communication**: Essential for multi-instance WebSocket coordination

### Error Handling

All cache and pub/sub helpers include built-in error handling:

- Errors are logged with context
- Operations fail gracefully without throwing
- Cache misses return `null`
- Failed operations return safe defaults (empty arrays, `false`, `0`)

This ensures that Redis failures don't crash the application, and it can fall back to database operations when needed.

### Connection Events

The Redis clients emit various events that are logged:

- `connect`: Connection attempt started
- `ready`: Client is ready to accept commands
- `reconnecting`: Client is attempting to reconnect
- `error`: Connection or command error
- `end`: Connection closed

All events are logged automatically for monitoring and debugging.

### Environment Variables

Required environment variable:

```env
REDIS_URL=redis://localhost:6379
```

For Redis Cluster:

```env
REDIS_URL=redis://localhost:6379,redis://localhost:6380,redis://localhost:6381
```

For Redis with authentication:

```env
REDIS_URL=redis://:password@localhost:6379
```

### Testing

To test Redis connectivity:

```typescript
import { connectRedis, checkRedisHealth } from './config/redis';

// Connect
await connectRedis();

// Health check
const isHealthy = await checkRedisHealth();
console.log('Redis healthy:', isHealthy);
```

### Production Considerations

1. **Redis Cluster**: For production, use Redis Cluster for high availability
2. **Connection Pooling**: The redis client handles connection pooling automatically
3. **Monitoring**: Monitor Redis memory usage, hit rate, and command latency
4. **Persistence**: Configure Redis AOF (Append Only File) for data persistence
5. **Backups**: Regular Redis snapshots (RDB files)
6. **Memory Limits**: Set `maxmemory` and `maxmemory-policy` (e.g., `allkeys-lru`)

### Troubleshooting

#### Connection Issues

Check logs for connection errors. Common causes:
- Redis server not running
- Incorrect REDIS_URL
- Network firewall blocking connection
- Redis max connections reached

#### Performance Issues

- Monitor slow commands with `SLOWLOG GET`
- Check memory usage with `INFO memory`
- Review key patterns and TTLs
- Consider using Redis Cluster for scaling

#### Cache Inconsistency

- Ensure proper cache invalidation on updates
- Use appropriate TTLs
- Consider using cache versioning for schema changes

## See Also

- [Environment Configuration](./env.ts)
- [Database Configuration](./database.ts)
- [Storage Configuration](./storage.ts)
