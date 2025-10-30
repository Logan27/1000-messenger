"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionService = void 0;
const database_1 = require("../config/database");
const redis_1 = require("../config/redis");
const uuid_1 = require("uuid");
class SessionService {
    async createSession(data) {
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
            (0, uuid_1.v4)(),
            data.userId,
            data.sessionToken,
            data.deviceId || null,
            data.deviceType || null,
            data.deviceName || null,
            data.ipAddress || null,
            data.userAgent || null,
            data.expiresAt,
        ];
        const result = await database_1.pool.query(query, values);
        const session = this.mapRow(result.rows[0]);
        await this.cacheSession(session);
        return session;
    }
    async findByToken(token) {
        const cached = await this.getCachedSession(token);
        if (cached) {
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
        }
        return session;
    }
    async getActiveUserSessions(userId) {
        const query = `
      SELECT * FROM user_sessions 
      WHERE user_id = $1 AND is_active = TRUE AND expires_at > CURRENT_TIMESTAMP
      ORDER BY last_activity DESC
    `;
        const result = await database_1.pool.query(query, [userId]);
        return result.rows.map(row => this.mapRow(row));
    }
    async updateSocketId(sessionId, socketId) {
        const query = `
      UPDATE user_sessions
      SET socket_id = $1, last_activity = CURRENT_TIMESTAMP
      WHERE id = $2
    `;
        await database_1.pool.query(query, [socketId, sessionId]);
    }
    async invalidateSession(sessionToken) {
        const query = `
      UPDATE user_sessions
      SET is_active = FALSE
      WHERE session_token = $1
    `;
        await database_1.pool.query(query, [sessionToken]);
        await redis_1.redisClient.del(`session:${sessionToken}`);
    }
    async invalidateAllUserSessions(userId) {
        const query = `
      UPDATE user_sessions
      SET is_active = FALSE
      WHERE user_id = $1
    `;
        await database_1.pool.query(query, [userId]);
        const pattern = `session:${userId}:*`;
        const keys = await redis_1.redisClient.keys(pattern);
        if (keys.length > 0) {
            await redis_1.redisClient.del(keys);
        }
    }
    async updateLastActivity(sessionToken) {
        const query = `
      UPDATE user_sessions
      SET last_activity = CURRENT_TIMESTAMP
      WHERE session_token = $1 AND is_active = TRUE
    `;
        await database_1.pool.query(query, [sessionToken]);
    }
    async cacheSession(session) {
        const key = `session:${session.sessionToken}`;
        await redis_1.redisClient.setEx(key, 3600, JSON.stringify(session));
    }
    async getCachedSession(token) {
        const key = `session:${token}`;
        const cached = await redis_1.redisClient.get(key);
        return cached ? JSON.parse(cached) : null;
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