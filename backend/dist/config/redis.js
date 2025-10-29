"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisSubClient = exports.redisPubClient = exports.redisClient = void 0;
exports.connectRedis = connectRedis;
exports.closeRedis = closeRedis;
const redis_1 = require("redis");
const env_1 = require("./env");
const logger_util_1 = require("../utils/logger.util");
const redisClient = (0, redis_1.createClient)({
    url: env_1.config.REDIS_URL,
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 10) {
                logger_util_1.logger.error('Redis reconnection failed after 10 attempts');
                return new Error('Redis reconnection failed');
            }
            return retries * 100;
        },
    },
});
exports.redisClient = redisClient;
const redisPubClient = (0, redis_1.createClient)({
    url: env_1.config.REDIS_URL,
});
exports.redisPubClient = redisPubClient;
const redisSubClient = (0, redis_1.createClient)({
    url: env_1.config.REDIS_URL,
});
exports.redisSubClient = redisSubClient;
redisClient.on('error', (err) => logger_util_1.logger.error('Redis Client Error', err));
redisPubClient.on('error', (err) => logger_util_1.logger.error('Redis Pub Error', err));
redisSubClient.on('error', (err) => logger_util_1.logger.error('Redis Sub Error', err));
async function connectRedis() {
    await Promise.all([
        redisClient.connect(),
        redisPubClient.connect(),
        redisSubClient.connect(),
    ]);
    logger_util_1.logger.info('Redis connected');
}
async function closeRedis() {
    await Promise.all([
        redisClient.quit(),
        redisPubClient.quit(),
        redisSubClient.quit(),
    ]);
    logger_util_1.logger.info('Redis connections closed');
}
//# sourceMappingURL=redis.js.map