import { Request, Response, NextFunction } from 'express';
import { testConnection } from '../config/database';
import { redisClient } from '../config/redis';
import { healthCheck as storageHealthCheck, getStorageInfo } from '../config/storage';
import { logger } from '../utils/logger.util';

export class HealthController {
  health = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    } catch (error) {
      next(error);
    }
  };

  ready = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const checks = {
        database: false,
        redis: false,
        storage: false,
      };

      // Check database
      try {
        checks.database = await testConnection();
      } catch (error) {
        logger.error('Database health check failed', error);
      }

      // Check Redis
      try {
        await redisClient.ping();
        checks.redis = true;
      } catch (error) {
        logger.error('Redis health check failed', error);
      }

      // Check storage
      try {
        const storageHealth = await storageHealthCheck();
        checks.storage = storageHealth.healthy;
        if (!storageHealth.healthy) {
          logger.warn(`Storage health check failed: ${storageHealth.message}`);
        }
      } catch (error) {
        logger.error('Storage health check failed', error);
      }

      const isReady = checks.database && checks.redis && checks.storage;

      if (isReady) {
        res.json({
          status: 'ready',
          checks,
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(503).json({
          status: 'not ready',
          checks,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      next(error);
    }
  };

  detailed = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const checks = {
        database: { healthy: false, message: '' },
        redis: { healthy: false, message: '' },
        storage: { healthy: false, message: '', info: {} },
      };

      // Check database
      try {
        checks.database.healthy = await testConnection();
        checks.database.message = checks.database.healthy
          ? 'Database connection successful'
          : 'Database connection failed';
      } catch (error: any) {
        checks.database.message = error.message || 'Database check failed';
        logger.error('Database health check failed', error);
      }

      // Check Redis
      try {
        await redisClient.ping();
        checks.redis.healthy = true;
        checks.redis.message = 'Redis connection successful';
      } catch (error: any) {
        checks.redis.message = error.message || 'Redis check failed';
        logger.error('Redis health check failed', error);
      }

      // Check storage
      try {
        const storageHealth = await storageHealthCheck();
        checks.storage.healthy = storageHealth.healthy;
        checks.storage.message = storageHealth.message;
        checks.storage.info = getStorageInfo();
      } catch (error: any) {
        checks.storage.message = error.message || 'Storage check failed';
        logger.error('Storage health check failed', error);
      }

      const allHealthy = checks.database.healthy && checks.redis.healthy && checks.storage.healthy;

      res.status(allHealthy ? 200 : 503).json({
        status: allHealthy ? 'healthy' : 'unhealthy',
        checks,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    } catch (error) {
      next(error);
    }
  };
}
