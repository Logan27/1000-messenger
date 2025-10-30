import { Request, Response, NextFunction } from 'express';
import { testConnection, getPoolStats, checkReplicaHealth } from '../config/database';
import { redisClient } from '../config/redis';
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
        replica: false,
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

      // Check read replica health
      try {
        checks.replica = await checkReplicaHealth();
      } catch (error) {
        logger.error('Replica health check failed', error);
      }

      const isReady = checks.database && checks.redis;

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

  metrics = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const poolStats = getPoolStats();

      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: {
          primary: {
            ...poolStats.primary,
            utilization:
              poolStats.primary.totalCount > 0
                ? (
                    ((poolStats.primary.totalCount - poolStats.primary.idleCount) /
                      poolStats.primary.totalCount) *
                    100
                  ).toFixed(2) + '%'
                : '0%',
          },
          replica: {
            ...poolStats.replica,
            utilization:
              poolStats.replica.totalCount > 0
                ? (
                    ((poolStats.replica.totalCount - poolStats.replica.idleCount) /
                      poolStats.replica.totalCount) *
                    100
                  ).toFixed(2) + '%'
                : '0%',
          },
        },
        memory: {
          heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
          heapTotal: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`,
          rss: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`,
        },
        process: {
          uptime: process.uptime(),
          pid: process.pid,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
