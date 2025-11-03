"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionService = void 0;
const database_1 = require("../config/database");
const redis_1 = require("../config/redis");
const logger_util_1 = require("../utils/logger.util");
const uuid_1 = require("uuid");
class SessionService {
    async createSession(data) {
        const sessionId = (0, uuid_1.v4)();
        const query = `
      INSERT INTO user_sessions (
        id, user_id, session_token, device_id, device_type, 
        device_name, ip_address, user_agent, expires_at, 
        created_at, last_activity
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;
        const values = [
            sessionId,
            data.userId,
            data.sessionToken,
            data.deviceId || null,
            data.deviceType || null,
            data.deviceName || null,
            data.ipAddress || null,
            data.userAgent || null,
            data.expiresAt,
        ];
        try {
            const result = await database_1.pool.query(query, values);
            const session = this.mapRow(result.rows[0]);
            await this.cacheSession(session);
            await this.addSessionToUserSet(data.userId, sessionId);
            logger_util_1.logger.info(`Session created for user ${data.userId}`, {
                sessionId,
                deviceType: data.deviceType,
            });
            return session;
        }
        catch (error) {
            logger_util_1.logger.error('Failed to create session', { error, userId: data.userId });
            throw error;
        }
    }
    async findByToken(token) {
        try {
            const cached = await this.getCachedSessionByToken(token);
            if (cached) {
                logger_util_1.logger.debug('Session found in cache', { hasToken: !!token });
                return cached;
            }
            const query = `
        SELECT * FROM user_sessions 
        WHERE session_token = $1 AND is_active = TRUE AND expires_at > CURRENT_TIMESTAMP
      `;
            const result = await database_1.pool.query(query, [token]);
            const session = result.rows[0] ? this.mapRow(result.rows[0]) : null;
            if (session) {
                await this.cacheSession(session);
                logger_util_1.logger.debug('Session loaded from database and cached', { sessionId: session.id });
            }
            return session;
        }
        catch (error) {
            logger_util_1.logger.error('Error finding session by token', { error });
            return null;
        }
    }
    async findById(sessionId) {
        try {
            const cached = await this.getCachedSessionById(sessionId);
            if (cached) {
                return cached;
            }
            const query = `
        SELECT * FROM user_sessions 
        WHERE id = $1 AND is_active = TRUE AND expires_at > CURRENT_TIMESTAMP
      `;
            const result = await database_1.pool.query(query, [sessionId]);
            const session = result.rows[0] ? this.mapRow(result.rows[0]) : null;
            if (session) {
                await this.cacheSession(session);
            }
            return session;
        }
        catch (error) {
            logger_util_1.logger.error('Error finding session by ID', { error, sessionId });
            return null;
        }
    }
    async getActiveUserSessions(userId) {
        try {
            const sessionIds = await redis_1.cacheHelpers.smembers(this.getUserSessionsKey(userId));
            if (sessionIds.length > 0) {
                const sessions = [];
                for (const sessionId of sessionIds) {
                    const session = await this.getCachedSessionById(sessionId);
                    if (session && session.isActive && new Date(session.expiresAt) > new Date()) {
                        sessions.push(session);
                    }
                }
                if (sessions.length > 0) {
                    sessions.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
                    return sessions;
                }
            }
            const query = `
        SELECT * FROM user_sessions 
        WHERE user_id = $1 AND is_active = TRUE AND expires_at > CURRENT_TIMESTAMP
        ORDER BY last_activity DESC
      `;
            const result = await database_1.pool.query(query, [userId]);
            const sessions = result.rows.map(row => this.mapRow(row));
            if (sessions.length > 0) {
                await this.cacheUserSessions(userId, sessions);
            }
            return sessions;
        }
        catch (error) {
            logger_util_1.logger.error('Error getting active user sessions', { error, userId });
            return [];
        }
    }
    async getSessionCount(userId) {
        try {
            const sessions = await this.getActiveUserSessions(userId);
            return sessions.length;
        }
        catch (error) {
            logger_util_1.logger.error('Error getting session count', { error, userId });
            return 0;
        }
    }
    async updateSocketId(sessionId, socketId) {
        try {
            const query = `
        UPDATE user_sessions
        SET socket_id = $1, last_activity = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;
            const result = await database_1.pool.query(query, [socketId, sessionId]);
            if (result.rows[0]) {
                const session = this.mapRow(result.rows[0]);
                await this.cacheSession(session);
                logger_util_1.logger.debug('Socket ID updated', { sessionId, socketId });
            }
        }
        catch (error) {
            logger_util_1.logger.error('Error updating socket ID', { error, sessionId, socketId });
            throw error;
        }
    }
    async invalidateSession(sessionToken) {
        try {
            const query = `
        UPDATE user_sessions
        SET is_active = FALSE
        WHERE session_token = $1
        RETURNING id, user_id
      `;
            const result = await database_1.pool.query(query, [sessionToken]);
            if (result.rows[0]) {
                const { id, user_id } = result.rows[0];
                await this.removeCachedSession(sessionToken, id, user_id);
                logger_util_1.logger.info('Session invalidated', { sessionId: id, userId: user_id });
            }
        }
        catch (error) {
            logger_util_1.logger.error('Error invalidating session', { error });
            throw error;
        }
    }
    async invalidateAllUserSessions(userId) {
        try {
            const query = `
        UPDATE user_sessions
        SET is_active = FALSE
        WHERE user_id = $1
        RETURNING id, session_token
      `;
            const result = await database_1.pool.query(query, [userId]);
            for (const row of result.rows) {
                await this.removeCachedSession(row.session_token, row.id, userId);
            }
            await redis_1.cacheHelpers.del(this.getUserSessionsKey(userId));
            logger_util_1.logger.info('All user sessions invalidated', { userId, count: result.rows.length });
        }
        catch (error) {
            logger_util_1.logger.error('Error invalidating all user sessions', { error, userId });
            throw error;
        }
    }
    async updateLastActivity(sessionToken) {
        try {
            const query = `
        UPDATE user_sessions
        SET last_activity = CURRENT_TIMESTAMP
        WHERE session_token = $1 AND is_active = TRUE
        RETURNING *
      `;
            const result = await database_1.pool.query(query, [sessionToken]);
            if (result.rows[0]) {
                const session = this.mapRow(result.rows[0]);
                await this.cacheSession(session);
            }
        }
        catch (error) {
            logger_util_1.logger.error('Error updating last activity', { error });
        }
    }
    async extendSession(sessionToken, newExpiryDate) {
        try {
            const query = `
        UPDATE user_sessions
        SET expires_at = $1, last_activity = CURRENT_TIMESTAMP
        WHERE session_token = $2 AND is_active = TRUE
        RETURNING *
      `;
            const result = await database_1.pool.query(query, [newExpiryDate, sessionToken]);
            if (result.rows[0]) {
                const session = this.mapRow(result.rows[0]);
                await this.cacheSession(session);
                logger_util_1.logger.debug('Session extended', { sessionId: session.id, newExpiryDate });
            }
        }
        catch (error) {
            logger_util_1.logger.error('Error extending session', { error });
            throw error;
        }
    }
    async cleanupExpiredSessions() {
        try {
            const query = `
        DELETE FROM user_sessions
        WHERE expires_at < CURRENT_TIMESTAMP
        RETURNING id, user_id, session_token
      `;
            const result = await database_1.pool.query(query);
            for (const row of result.rows) {
                await this.removeCachedSession(row.session_token, row.id, row.user_id);
            }
            const count = result.rows.length;
            if (count > 0) {
                logger_util_1.logger.info(`Cleaned up ${count} expired sessions`);
            }
            return count;
        }
        catch (error) {
            logger_util_1.logger.error('Error cleaning up expired sessions', { error });
            return 0;
        }
    }
    async getSessionMetadata(sessionToken) {
        try {
            const session = await this.findByToken(sessionToken);
            if (!session) {
                return null;
            }
            return {
                userId: session.userId,
                deviceType: session.deviceType,
                deviceName: session.deviceName,
                lastActivity: session.lastActivity,
            };
        }
        catch (error) {
            logger_util_1.logger.error('Error getting session metadata', { error });
            return null;
        }
    }
    async cacheSession(session) {
        try {
            const ttlSeconds = Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000);
            if (ttlSeconds > 0) {
                const cacheTTL = Math.min(ttlSeconds, redis_1.REDIS_CONFIG.TTL.SESSION);
                const tokenKey = this.getSessionTokenKey(session.sessionToken);
                await redis_1.cacheHelpers.set(tokenKey, session, cacheTTL);
                const idKey = this.getSessionIdKey(session.id);
                await redis_1.cacheHelpers.set(idKey, session, cacheTTL);
                logger_util_1.logger.debug('Session cached', {
                    sessionId: session.id,
                    ttl: cacheTTL
                });
            }
        }
        catch (error) {
            logger_util_1.logger.error('Error caching session', { error, sessionId: session.id });
        }
    }
    async cacheUserSessions(userId, sessions) {
        try {
            for (const session of sessions) {
                await this.cacheSession(session);
            }
            const sessionIds = sessions.map(s => s.id);
            const setKey = this.getUserSessionsKey(userId);
            await redis_1.cacheHelpers.del(setKey);
            if (sessionIds.length > 0) {
                await redis_1.cacheHelpers.sadd(setKey, ...sessionIds);
            }
        }
        catch (error) {
            logger_util_1.logger.error('Error caching user sessions', { error, userId });
        }
    }
    async addSessionToUserSet(userId, sessionId) {
        try {
            const setKey = this.getUserSessionsKey(userId);
            await redis_1.cacheHelpers.sadd(setKey, sessionId);
        }
        catch (error) {
            logger_util_1.logger.error('Error adding session to user set', { error, userId, sessionId });
        }
    }
    async removeCachedSession(sessionToken, sessionId, userId) {
        try {
            await redis_1.cacheHelpers.del(this.getSessionTokenKey(sessionToken));
            await redis_1.cacheHelpers.del(this.getSessionIdKey(sessionId));
            await redis_1.cacheHelpers.srem(this.getUserSessionsKey(userId), sessionId);
            logger_util_1.logger.debug('Session removed from cache', { sessionId, userId });
        }
        catch (error) {
            logger_util_1.logger.error('Error removing cached session', { error, sessionId });
        }
    }
    async getCachedSessionByToken(token) {
        try {
            const key = this.getSessionTokenKey(token);
            return await redis_1.cacheHelpers.get(key);
        }
        catch (error) {
            logger_util_1.logger.error('Error getting cached session by token', { error });
            return null;
        }
    }
    async getCachedSessionById(sessionId) {
        try {
            const key = this.getSessionIdKey(sessionId);
            return await redis_1.cacheHelpers.get(key);
        }
        catch (error) {
            logger_util_1.logger.error('Error getting cached session by ID', { error, sessionId });
            return null;
        }
    }
    getSessionTokenKey(token) {
        return `${redis_1.REDIS_CONFIG.KEYS.SESSION}token:${token}`;
    }
    getSessionIdKey(sessionId) {
        return `${redis_1.REDIS_CONFIG.KEYS.SESSION}id:${sessionId}`;
    }
    getUserSessionsKey(userId) {
        return `${redis_1.REDIS_CONFIG.KEYS.SESSION}user:${userId}`;
    }
    mapRow(row) {
        return {
            id: row.id,
            userId: row.user_id,
            sessionToken: row.session_token,
            deviceId: row.device_id,
            deviceType: row.device_type,
            deviceName: row.device_name,
            socketId: row.socket_id,
            ipAddress: row.ip_address,
            userAgent: row.user_agent,
            isActive: row.is_active,
            lastActivity: row.last_activity,
            createdAt: row.created_at,
            expiresAt: row.expires_at,
        };
    }
}
exports.SessionService = SessionService;
//# sourceMappingURL=session.service.js.map