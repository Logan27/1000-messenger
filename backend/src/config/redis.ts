import { createClient } from 'redis';
import { config } from './env';
import { logger } from '../utils/logger.util';

const redisClient = createClient({
  url: config.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        logger.error('Redis reconnection failed after 10 attempts');
        return new Error('Redis reconnection failed');
      }
      return retries * 100;
    },
  },
});

const redisPubClient = createClient({
  url: config.REDIS_URL,
});

const redisSubClient = createClient({
  url: config.REDIS_URL,
});

redisClient.on('error', (err) => logger.error('Redis Client Error', err));
redisPubClient.on('error', (err) => logger.error('Redis Pub Error', err));
redisSubClient.on('error', (err) => logger.error('Redis Sub Error', err));

export async function connectRedis(): Promise<void> {
  await Promise.all([
    redisClient.connect(),
    redisPubClient.connect(),
    redisSubClient.connect(),
  ]);
  logger.info('Redis connected');
}

export async function closeRedis(): Promise<void> {
  await Promise.all([
    redisClient.quit(),
    redisPubClient.quit(),
    redisSubClient.quit(),
  ]);
  logger.info('Redis connections closed');
}

export { redisClient, redisPubClient, redisSubClient };
