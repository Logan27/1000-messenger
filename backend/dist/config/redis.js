"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisSubClient = exports.redisPubClient = exports.redisClient = exports.pubSubHelpers = exports.cacheHelpers = exports.REDIS_CONFIG = void 0;
exports.connectRedis = connectRedis;
exports.closeRedis = closeRedis;
exports.checkRedisHealth = checkRedisHealth;
const redis_1 = require("redis");
const env_1 = require("./env");
const logger_util_1 = require("../utils/logger.util");
exports.REDIS_CONFIG = {
    MAX_RECONNECT_ATTEMPTS: 10,
    RECONNECT_DELAY_BASE: 100,
    SOCKET_TIMEOUT: 5000,
    COMMAND_TIMEOUT: 5000,
    TTL: {
        SESSION: 3600,
        USER_STATUS: 300,
        CHAT_LIST: 600,
        MESSAGE_CACHE: 1800,
        CONTACT_LIST: 600,
        TYPING_INDICATOR: 5,
        PRESENCE: 300,
    },
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
    STREAMS: {
        MESSAGE_DELIVERY: 'message-delivery-stream',
    },
};
function createReconnectStrategy(clientName) {
    return (retries) => {
        if (retries > exports.REDIS_CONFIG.MAX_RECONNECT_ATTEMPTS) {
            logger_util_1.logger.error(`${clientName} reconnection failed after ${exports.REDIS_CONFIG.MAX_RECONNECT_ATTEMPTS} attempts`);
            return new Error(`Redis ${clientName} reconnection failed`);
        }
        const delay = retries * exports.REDIS_CONFIG.RECONNECT_DELAY_BASE;
        logger_util_1.logger.warn(`${clientName} reconnecting... attempt ${retries}, delay ${delay}ms`);
        return delay;
    };
}
const redisClient = (0, redis_1.createClient)({
    url: env_1.config.REDIS_URL,
    socket: {
        reconnectStrategy: createReconnectStrategy('RedisClient'),
        connectTimeout: exports.REDIS_CONFIG.SOCKET_TIMEOUT,
    },
});
exports.redisClient = redisClient;
const redisPubClient = (0, redis_1.createClient)({
    url: env_1.config.REDIS_URL,
    socket: {
        reconnectStrategy: createReconnectStrategy('RedisPubClient'),
        connectTimeout: exports.REDIS_CONFIG.SOCKET_TIMEOUT,
    },
});
exports.redisPubClient = redisPubClient;
const redisSubClient = (0, redis_1.createClient)({
    url: env_1.config.REDIS_URL,
    socket: {
        reconnectStrategy: createReconnectStrategy('RedisSubClient'),
        connectTimeout: exports.REDIS_CONFIG.SOCKET_TIMEOUT,
    },
});
exports.redisSubClient = redisSubClient;
redisClient.on('error', err => logger_util_1.logger.error('Redis Client Error', err));
redisClient.on('connect', () => logger_util_1.logger.info('Redis Client connecting...'));
redisClient.on('ready', () => logger_util_1.logger.info('Redis Client ready'));
redisClient.on('reconnecting', () => logger_util_1.logger.warn('Redis Client reconnecting...'));
redisClient.on('end', () => logger_util_1.logger.warn('Redis Client connection closed'));
redisPubClient.on('error', err => logger_util_1.logger.error('Redis Pub Client Error', err));
redisPubClient.on('connect', () => logger_util_1.logger.info('Redis Pub Client connecting...'));
redisPubClient.on('ready', () => logger_util_1.logger.info('Redis Pub Client ready'));
redisPubClient.on('reconnecting', () => logger_util_1.logger.warn('Redis Pub Client reconnecting...'));
redisPubClient.on('end', () => logger_util_1.logger.warn('Redis Pub Client connection closed'));
redisSubClient.on('error', err => logger_util_1.logger.error('Redis Sub Client Error', err));
redisSubClient.on('connect', () => logger_util_1.logger.info('Redis Sub Client connecting...'));
redisSubClient.on('ready', () => logger_util_1.logger.info('Redis Sub Client ready'));
redisSubClient.on('reconnecting', () => logger_util_1.logger.warn('Redis Sub Client reconnecting...'));
redisSubClient.on('end', () => logger_util_1.logger.warn('Redis Sub Client connection closed'));
async function connectRedis() {
    try {
        await Promise.all([
            redisClient.connect(),
            redisPubClient.connect(),
            redisSubClient.connect(),
        ]);
        logger_util_1.logger.info('Redis connections established successfully');
    }
    catch (error) {
        logger_util_1.logger.error('Failed to connect to Redis', error);
        throw error;
    }
}
async function closeRedis() {
    try {
        await Promise.all([
            redisClient.quit(),
            redisPubClient.quit(),
            redisSubClient.quit(),
        ]);
        logger_util_1.logger.info('Redis connections closed gracefully');
    }
    catch (error) {
        logger_util_1.logger.error('Error closing Redis connections', error);
        throw error;
    }
}
async function checkRedisHealth() {
    try {
        const response = await redisClient.ping();
        return response === 'PONG';
    }
    catch (error) {
        logger_util_1.logger.error('Redis health check failed', error);
        return false;
    }
}
exports.cacheHelpers = {
    async getOrSet(key, ttl, fetchFn) {
        try {
            const cached = await redisClient.get(key);
            if (cached) {
                return JSON.parse(cached);
            }
            const value = await fetchFn();
            await redisClient.setEx(key, ttl, JSON.stringify(value));
            return value;
        }
        catch (error) {
            logger_util_1.logger.error(`Cache getOrSet error for key ${key}`, error);
            return fetchFn();
        }
    },
    async set(key, value, ttl) {
        try {
            await redisClient.setEx(key, ttl, JSON.stringify(value));
        }
        catch (error) {
            logger_util_1.logger.error(`Cache set error for key ${key}`, error);
        }
    },
    async get(key) {
        try {
            const cached = await redisClient.get(key);
            return cached ? JSON.parse(cached) : null;
        }
        catch (error) {
            logger_util_1.logger.error(`Cache get error for key ${key}`, error);
            return null;
        }
    },
    async del(key) {
        try {
            await redisClient.del(key);
        }
        catch (error) {
            logger_util_1.logger.error(`Cache delete error for key ${key}`, error);
        }
    },
    async delPattern(pattern) {
        try {
            const keys = await redisClient.keys(pattern);
            if (keys.length > 0) {
                await redisClient.del(keys);
            }
        }
        catch (error) {
            logger_util_1.logger.error(`Cache delete pattern error for ${pattern}`, error);
        }
    },
    async setPermanent(key, value) {
        try {
            await redisClient.set(key, JSON.stringify(value));
        }
        catch (error) {
            logger_util_1.logger.error(`Cache setPermanent error for key ${key}`, error);
        }
    },
    async incr(key) {
        try {
            return await redisClient.incr(key);
        }
        catch (error) {
            logger_util_1.logger.error(`Cache incr error for key ${key}`, error);
            return 0;
        }
    },
    async incrWithExpiry(key, ttl) {
        try {
            const value = await redisClient.incr(key);
            if (value === 1) {
                await redisClient.expire(key, ttl);
            }
            return value;
        }
        catch (error) {
            logger_util_1.logger.error(`Cache incrWithExpiry error for key ${key}`, error);
            return 0;
        }
    },
    async sadd(key, ...members) {
        try {
            await redisClient.sAdd(key, members);
        }
        catch (error) {
            logger_util_1.logger.error(`Cache sadd error for key ${key}`, error);
        }
    },
    async srem(key, ...members) {
        try {
            await redisClient.sRem(key, members);
        }
        catch (error) {
            logger_util_1.logger.error(`Cache srem error for key ${key}`, error);
        }
    },
    async smembers(key) {
        try {
            return await redisClient.sMembers(key);
        }
        catch (error) {
            logger_util_1.logger.error(`Cache smembers error for key ${key}`, error);
            return [];
        }
    },
    async sismember(key, member) {
        try {
            return await redisClient.sIsMember(key, member);
        }
        catch (error) {
            logger_util_1.logger.error(`Cache sismember error for key ${key}`, error);
            return false;
        }
    },
};
exports.pubSubHelpers = {
    async publish(channel, message) {
        try {
            await redisPubClient.publish(channel, JSON.stringify(message));
            logger_util_1.logger.debug(`Published to channel ${channel}`);
        }
        catch (error) {
            logger_util_1.logger.error(`Pub/Sub publish error for channel ${channel}`, error);
        }
    },
    async subscribe(channel, handler) {
        try {
            await redisSubClient.subscribe(channel, (message) => {
                try {
                    const parsed = JSON.parse(message);
                    handler(parsed);
                }
                catch (error) {
                    logger_util_1.logger.error(`Error parsing pub/sub message from ${channel}`, error);
                }
            });
            logger_util_1.logger.info(`Subscribed to channel ${channel}`);
        }
        catch (error) {
            logger_util_1.logger.error(`Pub/Sub subscribe error for channel ${channel}`, error);
        }
    },
    async unsubscribe(channel) {
        try {
            await redisSubClient.unsubscribe(channel);
            logger_util_1.logger.info(`Unsubscribed from channel ${channel}`);
        }
        catch (error) {
            logger_util_1.logger.error(`Pub/Sub unsubscribe error for channel ${channel}`, error);
        }
    },
};
//# sourceMappingURL=redis.js.map