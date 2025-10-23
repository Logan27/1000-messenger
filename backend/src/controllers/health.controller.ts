import { Request, Response, NextFunction } from 'express';
import { testConnection } from '../config/database';
import { redisClient } from '../config/redis';
import { logger } from '../utils/logger.util';

export class HealthController {
  health = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    } catch (error) {
      next(error);
    }
  };

  ready = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const checks = {
        database: false,
        redis: false,
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

      const isReady = checks.database && checks.redis;

      if (isReady) {
        res.json({ 
          status: 'ready', 
          checks,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(503).json({ 
          status: 'not ready', 
          checks,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      next(error);
    }
  };
}
