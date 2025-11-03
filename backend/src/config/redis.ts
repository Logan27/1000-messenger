import { createClient, RedisClientType } from 'redis';
import { config } from './env';
import { logger } from '../utils/logger.util';

// Redis Configuration Constants
export const REDIS_CONFIG = {
  // Connection settings
  MAX_RECONNECT_ATTEMPTS: 10,
  RECONNECT_DELAY_BASE: 100, // milliseconds
  SOCKET_TIMEOUT: 5000,
  COMMAND_TIMEOUT: 5000,

  // Cache TTL (in seconds)
  TTL: {
    SESSION: 3600, // 1 hour
    USER_STATUS: 300, // 5 minutes
    CHAT_LIST: 600, // 10 minutes
    MESSAGE_CACHE: 1800, // 30 minutes
    CONTACT_LIST: 600, // 10 minutes
    TYPING_INDICATOR: 5, // 5 seconds
    PRESENCE: 300, // 5 minutes
  },

  // Cache key prefixes
  KEYS: {
    SESSION: 'session:',
    USER_STATUS: 'user:status:',
    USER_ONLINE: 'user:online:',
    CHAT_LIST: 'chat:list:',
    CHAT_UNREAD: 'chat:unread:',
    MESSAGE: 'message:',
    CONTACT_LIST: 'contact:list:',
    TYPING: 'typing:',
    PRESENCE: 'presence:',
    RATE_LIMIT: 'ratelimit:',
  },

  // Pub/Sub channels
  CHANNELS: {
    MESSAGE_NEW: 'message:new',
    MESSAGE_EDIT: 'message:edit',
    MESSAGE_DELETE: 'message:delete',
    MESSAGE_REACTION: 'message:reaction',
    USER_STATUS: 'user:status',
    TYPING_START: 'typing:start',
    TYPING_STOP: 'typing:stop',
    READ_RECEIPT: 'read:receipt',
    CHAT_UPDATE: 'chat:update',
  },

  // Redis Streams
  STREAMS: {
    MESSAGE_DELIVERY: 'message-delivery-stream',
  },
} as const;

// Create reconnection strategy
function createReconnectStrategy(clientName: string) {
  return (retries: number) => {
    if (retries > REDIS_CONFIG.MAX_RECONNECT_ATTEMPTS) {
      logger.error(
        `${clientName} reconnection failed after ${REDIS_CONFIG.MAX_RECONNECT_ATTEMPTS} attempts`
      );
      return new Error(`Redis ${clientName} reconnection failed`);
    }
    const delay = retries * REDIS_CONFIG.RECONNECT_DELAY_BASE;
    logger.warn(`${clientName} reconnecting... attempt ${retries}, delay ${delay}ms`);
    return delay;
  };
}

// Main Redis client for general operations (caching, data storage)
const redisClient = createClient({
  url: config.REDIS_URL,
  socket: {
    reconnectStrategy: createReconnectStrategy('RedisClient'),
    connectTimeout: REDIS_CONFIG.SOCKET_TIMEOUT,
  },
});

// Dedicated pub/sub clients (required by Socket.IO Redis adapter)
const redisPubClient = createClient({
  url: config.REDIS_URL,
  socket: {
    reconnectStrategy: createReconnectStrategy('RedisPubClient'),
    connectTimeout: REDIS_CONFIG.SOCKET_TIMEOUT,
  },
});

const redisSubClient = createClient({
  url: config.REDIS_URL,
  socket: {
    reconnectStrategy: createReconnectStrategy('RedisSubClient'),
    connectTimeout: REDIS_CONFIG.SOCKET_TIMEOUT,
  },
});

// Event handlers for connection monitoring
redisClient.on('error', err => logger.error('Redis Client Error', err));
redisClient.on('connect', () => logger.info('Redis Client connecting...'));
redisClient.on('ready', () => logger.info('Redis Client ready'));
redisClient.on('reconnecting', () => logger.warn('Redis Client reconnecting...'));
redisClient.on('end', () => logger.warn('Redis Client connection closed'));

redisPubClient.on('error', err => logger.error('Redis Pub Client Error', err));
redisPubClient.on('connect', () => logger.info('Redis Pub Client connecting...'));
redisPubClient.on('ready', () => logger.info('Redis Pub Client ready'));
redisPubClient.on('reconnecting', () => logger.warn('Redis Pub Client reconnecting...'));
redisPubClient.on('end', () => logger.warn('Redis Pub Client connection closed'));

redisSubClient.on('error', err => logger.error('Redis Sub Client Error', err));
redisSubClient.on('connect', () => logger.info('Redis Sub Client connecting...'));
redisSubClient.on('ready', () => logger.info('Redis Sub Client ready'));
redisSubClient.on('reconnecting', () => logger.warn('Redis Sub Client reconnecting...'));
redisSubClient.on('end', () => logger.warn('Redis Sub Client connection closed'));

// Connection management
export async function connectRedis(): Promise<void> {
  try {
    await Promise.all([redisClient.connect(), redisPubClient.connect(), redisSubClient.connect()]);
    logger.info('Redis connections established successfully');
  } catch (error) {
    logger.error('Failed to connect to Redis', error);
    throw error;
  }
}

export async function closeRedis(): Promise<void> {
  try {
    await Promise.all([redisClient.quit(), redisPubClient.quit(), redisSubClient.quit()]);
    logger.info('Redis connections closed gracefully');
  } catch (error) {
    logger.error('Error closing Redis connections', error);
    throw error;
  }
}

// Health check
export async function checkRedisHealth(): Promise<boolean> {
  try {
    const response = await redisClient.ping();
    return response === 'PONG';
  } catch (error) {
    logger.error('Redis health check failed', error);
    return false;
  }
}

// Cache helper functions
export const cacheHelpers = {
  /**
   * Cache-aside pattern: Get from cache or fetch from source
   */
  async getOrSet<T>(key: string, ttl: number, fetchFn: () => Promise<T>): Promise<T> {
    try {
      // Try cache first
      const cached = await redisClient.get(key);
      if (cached) {
        return JSON.parse(cached) as T;
      }

      // Fetch from source
      const value = await fetchFn();

      // Store in cache
      await redisClient.setEx(key, ttl, JSON.stringify(value));

      return value;
    } catch (error) {
      logger.error(`Cache getOrSet error for key ${key}`, error);
      // Fallback to fetch on cache error
      return fetchFn();
    }
  },

  /**
   * Set a value in cache with TTL
   */
  async set(key: string, value: any, ttl: number): Promise<void> {
    try {
      await redisClient.setEx(key, ttl, JSON.stringify(value));
    } catch (error) {
      logger.error(`Cache set error for key ${key}`, error);
    }
  },

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await redisClient.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.error(`Cache get error for key ${key}`, error);
      return null;
    }
  },

  /**
   * Delete a value from cache
   */
  async del(key: string): Promise<void> {
    try {
      await redisClient.del(key);
    } catch (error) {
      logger.error(`Cache delete error for key ${key}`, error);
    }
  },

  /**
   * Delete multiple keys matching a pattern
   * Uses SCAN instead of KEYS to avoid blocking Redis in production
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      let cursor = 0;
      const keysToDelete: string[] = [];
      
      do {
        const result = await redisClient.scan(cursor, {
          MATCH: pattern,
          COUNT: 100,
        });
        
        cursor = result.cursor;
        keysToDelete.push(...result.keys);
      } while (cursor !== 0);
      
      if (keysToDelete.length > 0) {
        // Delete in batches to avoid command size limits
        const batchSize = 1000;
        for (let i = 0; i < keysToDelete.length; i += batchSize) {
          const batch = keysToDelete.slice(i, i + batchSize);
          await redisClient.del(batch);
        }
      }
    } catch (error) {
      logger.error(`Cache delete pattern error for ${pattern}`, error);
    }
  },

  /**
   * Set a value with no expiration
   */
  async setPermanent(key: string, value: any): Promise<void> {
    try {
      await redisClient.set(key, JSON.stringify(value));
    } catch (error) {
      logger.error(`Cache setPermanent error for key ${key}`, error);
    }
  },

  /**
   * Increment a counter
   */
  async incr(key: string): Promise<number> {
    try {
      return await redisClient.incr(key);
    } catch (error) {
      logger.error(`Cache incr error for key ${key}`, error);
      return 0;
    }
  },

  /**
   * Increment with expiry
   */
  async incrWithExpiry(key: string, ttl: number): Promise<number> {
    try {
      const value = await redisClient.incr(key);
      if (value === 1) {
        // First increment, set expiry
        await redisClient.expire(key, ttl);
      }
      return value;
    } catch (error) {
      logger.error(`Cache incrWithExpiry error for key ${key}`, error);
      return 0;
    }
  },

  /**
   * Add to a set
   */
  async sadd(key: string, ...members: string[]): Promise<void> {
    try {
      await redisClient.sAdd(key, members);
    } catch (error) {
      logger.error(`Cache sadd error for key ${key}`, error);
    }
  },

  /**
   * Remove from a set
   */
  async srem(key: string, ...members: string[]): Promise<void> {
    try {
      await redisClient.sRem(key, members);
    } catch (error) {
      logger.error(`Cache srem error for key ${key}`, error);
    }
  },

  /**
   * Get all members of a set
   */
  async smembers(key: string): Promise<string[]> {
    try {
      return await redisClient.sMembers(key);
    } catch (error) {
      logger.error(`Cache smembers error for key ${key}`, error);
      return [];
    }
  },

  /**
   * Check if member exists in set
   */
  async sismember(key: string, member: string): Promise<boolean> {
    try {
      return await redisClient.sIsMember(key, member);
    } catch (error) {
      logger.error(`Cache sismember error for key ${key}`, error);
      return false;
    }
  },
};

// Pub/Sub helper functions
export const pubSubHelpers = {
  /**
   * Publish a message to a channel
   */
  async publish(channel: string, message: any): Promise<void> {
    try {
      await redisPubClient.publish(channel, JSON.stringify(message));
      logger.debug(`Published to channel ${channel}`);
    } catch (error) {
      logger.error(`Pub/Sub publish error for channel ${channel}`, error);
    }
  },

  /**
   * Subscribe to a channel
   */
  async subscribe(channel: string, handler: (message: any) => void): Promise<void> {
    try {
      await redisSubClient.subscribe(channel, message => {
        try {
          const parsed = JSON.parse(message);
          handler(parsed);
        } catch (error) {
          logger.error(`Error parsing pub/sub message from ${channel}`, error);
        }
      });
      logger.info(`Subscribed to channel ${channel}`);
    } catch (error) {
      logger.error(`Pub/Sub subscribe error for channel ${channel}`, error);
    }
  },

  /**
   * Unsubscribe from a channel
   */
  async unsubscribe(channel: string): Promise<void> {
    try {
      await redisSubClient.unsubscribe(channel);
      logger.info(`Unsubscribed from channel ${channel}`);
    } catch (error) {
      logger.error(`Pub/Sub unsubscribe error for channel ${channel}`, error);
    }
  },
};

export { redisClient, redisPubClient, redisSubClient };
export type { RedisClientType };
