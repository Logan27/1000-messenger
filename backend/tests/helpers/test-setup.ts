/**
 * Test setup helpers for integration tests
 */

import { redisClient } from '../../src/config/redis';

/**
 * Connect to Redis for tests
 */
export async function connectTestRedis(): Promise<void> {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
}

/**
 * Close Redis connection
 */
export async function closeTestRedis(): Promise<void> {
  if (redisClient.isOpen) {
    await redisClient.quit();
  }
}

/**
 * Cleanup rate limit keys
 */
export async function cleanupRateLimitKeys(): Promise<void> {
  if (!redisClient.isOpen) {
    return;
  }
  
  try {
    const keys = await redisClient.keys('ratelimit:*');
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    console.error('Error cleaning up rate limit keys:', error);
  }
}
