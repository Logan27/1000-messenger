"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const database_1 = require("../config/database");
const redis_1 = require("../config/redis");
const storage_1 = require("../config/storage");
const logger_util_1 = require("../utils/logger.util");
class HealthController {
    health = async (_req, res, next) => {
        try {
            res.json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
            });
        }
        catch (error) {
            next(error);
        }
    };
    ready = async (_req, res, next) => {
        try {
            const checks = {
                database: false,
                redis: false,
                storage: false,
            };
            try {
                checks.database = await (0, database_1.testConnection)();
            }
            catch (error) {
                logger_util_1.logger.error('Database health check failed', error);
            }
            try {
                checks.redis = await checkRedisHealth();
            }
            catch (error) {
                logger_util_1.logger.error('Redis health check failed', error);
            }
            try {
                const storageHealth = await (0, storage_1.healthCheck)();
                checks.storage = storageHealth.healthy;
                if (!storageHealth.healthy) {
                    logger_util_1.logger.warn(`Storage health check failed: ${storageHealth.message}`);
                }
            }
            catch (error) {
                logger_util_1.logger.error('Storage health check failed', error);
            }
            const isReady = checks.database && checks.redis && checks.storage;
            if (isReady) {
                res.json({
                    status: 'ready',
                    checks,
                    timestamp: new Date().toISOString(),
                });
            }
            else {
                res.status(503).json({
                    status: 'not ready',
                    checks,
                    timestamp: new Date().toISOString(),
                });
            }
        }
        catch (error) {
            next(error);
        }
    };
    detailed = async (_req, res, next) => {
        try {
            const checks = {
                database: { healthy: false, message: '' },
                redis: { healthy: false, message: '' },
                storage: { healthy: false, message: '', info: {} },
            };
            try {
                checks.database.healthy = await (0, database_1.testConnection)();
                checks.database.message = checks.database.healthy
                    ? 'Database connection successful'
                    : 'Database connection failed';
            }
            catch (error) {
                checks.database.message = error.message || 'Database check failed';
                logger_util_1.logger.error('Database health check failed', error);
            }
            try {
                await redis_1.redisClient.ping();
                checks.redis.healthy = true;
                checks.redis.message = 'Redis connection successful';
            }
            catch (error) {
                checks.redis.message = error.message || 'Redis check failed';
                logger_util_1.logger.error('Redis health check failed', error);
            }
            try {
                const storageHealth = await (0, storage_1.healthCheck)();
                checks.storage.healthy = storageHealth.healthy;
                checks.storage.message = storageHealth.message;
                checks.storage.info = (0, storage_1.getStorageInfo)();
            }
            catch (error) {
                checks.storage.message = error.message || 'Storage check failed';
                logger_util_1.logger.error('Storage health check failed', error);
            }
            const allHealthy = checks.database.healthy && checks.redis.healthy && checks.storage.healthy;
            res.status(allHealthy ? 200 : 503).json({
                status: allHealthy ? 'healthy' : 'unhealthy',
                checks,
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.HealthController = HealthController;
//# sourceMappingURL=health.controller.js.map