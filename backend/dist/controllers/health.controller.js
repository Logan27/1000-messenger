"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const database_1 = require("../config/database");
const redis_1 = require("../config/redis");
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
                replica: false,
            };
            try {
                checks.database = await (0, database_1.testConnection)();
            }
            catch (error) {
                logger_util_1.logger.error('Database health check failed', error);
            }
            try {
                checks.redis = await (0, redis_1.checkRedisHealth)();
            }
            catch (error) {
                logger_util_1.logger.error('Redis health check failed', error);
            }
            try {
                checks.replica = await (0, database_1.checkReplicaHealth)();
            }
            catch (error) {
                logger_util_1.logger.error('Replica health check failed', error);
            }
            const isReady = checks.database && checks.redis;
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
    metrics = async (_req, res, next) => {
        try {
            const poolStats = (0, database_1.getPoolStats)();
            res.json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                database: {
                    primary: {
                        ...poolStats.primary,
                        utilization: poolStats.primary.totalCount > 0
                            ? ((poolStats.primary.totalCount - poolStats.primary.idleCount) / poolStats.primary.totalCount * 100).toFixed(2) + '%'
                            : '0%',
                    },
                    replica: {
                        ...poolStats.replica,
                        utilization: poolStats.replica.totalCount > 0
                            ? ((poolStats.replica.totalCount - poolStats.replica.idleCount) / poolStats.replica.totalCount * 100).toFixed(2) + '%'
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
        }
        catch (error) {
            next(error);
        }
    };
}
exports.HealthController = HealthController;
//# sourceMappingURL=health.controller.js.map