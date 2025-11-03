/**
 * Session Service - Redis-Backed Session Management
 * 
 * Provides comprehensive session management with Redis caching for high performance.
 * Supports multi-device sessions, WebSocket integration, and efficient cache invalidation.
 * 
 * Architecture:
 * - PostgreSQL: Persistent session storage (source of truth)
 * - Redis: High-performance caching layer with multiple key patterns
 * 
 * Redis Key Patterns:
 * - session:token:{token} - Session lookup by token (primary)
 * - session:id:{sessionId} - Session lookup by ID (secondary)
 * - session:user:{userId} - Set of active session IDs for a user
 * 
 * Features:
 * - Multi-device session tracking
 * - WebSocket connection mapping (socket ID per session)
 * - Automatic cache invalidation on logout/expiry
 * - Session extension for token refresh
 * - Periodic expired session cleanup
 * - Efficient batch operations
 * 
 * @module services/session
 */

import { pool } from '../config/database';
import { REDIS_CONFIG, cacheHelpers } from '../config/redis';
import { logger } from '../utils/logger.util';
import { v4 as uuidv4 } from 'uuid';

export interface Session {
  id: string;
  userId: string;
  sessionToken: string;
  deviceId?: string;
  deviceType?: string;
  deviceName?: string;
  socketId?: string;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
  lastActivity: Date;
  createdAt: Date;
  expiresAt: Date;
}

export interface SessionMetadata {
  userId: string;
  deviceType?: string | undefined;
  deviceName?: string | undefined;
  lastActivity: Date;
}

/**
 * SessionService Class
 * 
 * Manages user sessions with Redis caching for optimal performance.
 * Implements cache-aside pattern with write-through cache updates.
 */
export class SessionService {
  async createSession(data: {
    userId: string;
    sessionToken: string;
    deviceId?: string;
    deviceType?: string;
    deviceName?: string;
    ipAddress?: string;
    userAgent?: string;
    expiresAt: Date;
  }): Promise<Session> {
    const sessionId = uuidv4();
    
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
      const result = await pool.query(query, values);
      const session = this.mapRow(result.rows[0]);

      // Cache session in Redis with multiple keys for efficient lookups
      await this.cacheSession(session);
      
      // Add session ID to user's session set
      await this.addSessionToUserSet(data.userId, sessionId);

      logger.info(`Session created for user ${data.userId}`, {
        sessionId,
        deviceType: data.deviceType,
      });

      return session;
    } catch (error) {
      logger.error('Failed to create session', { error, userId: data.userId });
      throw error;
    }
  }

  async findByToken(token: string): Promise<Session | null> {
    try {
      // Try Redis first for fast lookup
      const cached = await this.getCachedSessionByToken(token);
      if (cached) {
        logger.debug('Session found in cache', { hasToken: !!token });
        return cached;
      }

      // Fallback to database
      const query = `
        SELECT * FROM user_sessions 
        WHERE session_token = $1 AND is_active = TRUE AND expires_at > CURRENT_TIMESTAMP
      `;

      const result = await pool.query(query, [token]);
      const session = result.rows[0] ? this.mapRow(result.rows[0]) : null;

      if (session) {
        // Cache the session for future lookups
        await this.cacheSession(session);
        logger.debug('Session loaded from database and cached', { sessionId: session.id });
      }

      return session;
    } catch (error) {
      logger.error('Error finding session by token', { error });
      return null;
    }
  }

  async findById(sessionId: string): Promise<Session | null> {
    try {
      // Try Redis first
      const cached = await this.getCachedSessionById(sessionId);
      if (cached) {
        return cached;
      }

      // Fallback to database
      const query = `
        SELECT * FROM user_sessions 
        WHERE id = $1 AND is_active = TRUE AND expires_at > CURRENT_TIMESTAMP
      `;

      const result = await pool.query(query, [sessionId]);
      const session = result.rows[0] ? this.mapRow(result.rows[0]) : null;

      if (session) {
        await this.cacheSession(session);
      }

      return session;
    } catch (error) {
      logger.error('Error finding session by ID', { error, sessionId });
      return null;
    }
  }

  async getActiveUserSessions(userId: string): Promise<Session[]> {
    try {
      // Try to get from Redis first
      const sessionIds = await cacheHelpers.smembers(this.getUserSessionsKey(userId));
      
      if (sessionIds.length > 0) {
        // Batch fetch all sessions using pipeline for better performance
        const pipeline = [];
        for (const sessionId of sessionIds) {
          pipeline.push(this.getCachedSessionById(sessionId));
        }
        
        const sessionResults = await Promise.all(pipeline);
        const sessions = sessionResults.filter(
          (session): session is Session => 
            session !== null && 
            session.isActive && 
            new Date(session.expiresAt) > new Date()
        );
        
        if (sessions.length > 0) {
          // Sort by last activity
          sessions.sort((a, b) => 
            new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
          );
          return sessions;
        }
      }

      // Fallback to database
      const query = `
        SELECT * FROM user_sessions 
        WHERE user_id = $1 AND is_active = TRUE AND expires_at > CURRENT_TIMESTAMP
        ORDER BY last_activity DESC
      `;

      const result = await pool.query(query, [userId]);
      const sessions = result.rows.map(row => this.mapRow(row));

      // Re-populate cache
      if (sessions.length > 0) {
        await this.cacheUserSessions(userId, sessions);
      }

      return sessions;
    } catch (error) {
      logger.error('Error getting active user sessions', { error, userId });
      return [];
    }
  }

  async getSessionCount(userId: string): Promise<number> {
    try {
      const sessions = await this.getActiveUserSessions(userId);
      return sessions.length;
    } catch (error) {
      logger.error('Error getting session count', { error, userId });
      return 0;
    }
  }

  async updateSocketId(sessionId: string, socketId: string): Promise<void> {
    try {
      const query = `
        UPDATE user_sessions
        SET socket_id = $1, last_activity = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;

      const result = await pool.query(query, [socketId, sessionId]);
      
      if (result.rows[0]) {
        const session = this.mapRow(result.rows[0]);
        // Update cache with new socket ID
        await this.cacheSession(session);
        logger.debug('Socket ID updated', { sessionId, socketId });
      }
    } catch (error) {
      logger.error('Error updating socket ID', { error, sessionId, socketId });
      throw error;
    }
  }

  async invalidateSession(sessionToken: string): Promise<void> {
    try {
      const query = `
        UPDATE user_sessions
        SET is_active = FALSE
        WHERE session_token = $1
        RETURNING id, user_id
      `;

      const result = await pool.query(query, [sessionToken]);
      
      if (result.rows[0]) {
        const { id, user_id } = result.rows[0];
        
        // Remove from all Redis caches
        await this.removeCachedSession(sessionToken, id, user_id);
        
        logger.info('Session invalidated', { sessionId: id, userId: user_id });
      }
    } catch (error) {
      logger.error('Error invalidating session', { error });
      throw error;
    }
  }

  async invalidateAllUserSessions(userId: string): Promise<void> {
    try {
      const query = `
        UPDATE user_sessions
        SET is_active = FALSE
        WHERE user_id = $1
        RETURNING id, session_token
      `;

      const result = await pool.query(query, [userId]);
      
      // Remove all sessions from Redis
      for (const row of result.rows) {
        await this.removeCachedSession(row.session_token, row.id, userId);
      }
      
      // Clear user sessions set
      await cacheHelpers.del(this.getUserSessionsKey(userId));

      logger.info('All user sessions invalidated', { userId, count: result.rows.length });
    } catch (error) {
      logger.error('Error invalidating all user sessions', { error, userId });
      throw error;
    }
  }

  async updateLastActivity(sessionToken: string): Promise<void> {
    try {
      const query = `
        UPDATE user_sessions
        SET last_activity = CURRENT_TIMESTAMP
        WHERE session_token = $1 AND is_active = TRUE
        RETURNING *
      `;

      const result = await pool.query(query, [sessionToken]);
      
      if (result.rows[0]) {
        const session = this.mapRow(result.rows[0]);
        // Update cache with new last activity time
        await this.cacheSession(session);
      }
    } catch (error) {
      logger.error('Error updating last activity', { error });
    }
  }

  async extendSession(sessionToken: string, newExpiryDate: Date): Promise<void> {
    try {
      const query = `
        UPDATE user_sessions
        SET expires_at = $1, last_activity = CURRENT_TIMESTAMP
        WHERE session_token = $2 AND is_active = TRUE
        RETURNING *
      `;

      const result = await pool.query(query, [newExpiryDate, sessionToken]);
      
      if (result.rows[0]) {
        const session = this.mapRow(result.rows[0]);
        await this.cacheSession(session);
        logger.debug('Session extended', { sessionId: session.id, newExpiryDate });
      }
    } catch (error) {
      logger.error('Error extending session', { error });
      throw error;
    }
  }

  async cleanupExpiredSessions(): Promise<number> {
    try {
      const query = `
        DELETE FROM user_sessions
        WHERE expires_at < CURRENT_TIMESTAMP
        RETURNING id, user_id, session_token
      `;

      const result = await pool.query(query);
      
      // Remove from Redis cache
      for (const row of result.rows) {
        await this.removeCachedSession(row.session_token, row.id, row.user_id);
      }

      const count = result.rows.length;
      if (count > 0) {
        logger.info(`Cleaned up ${count} expired sessions`);
      }
      
      return count;
    } catch (error) {
      logger.error('Error cleaning up expired sessions', { error });
      return 0;
    }
  }

  async getSessionMetadata(sessionToken: string): Promise<SessionMetadata | null> {
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
    } catch (error) {
      logger.error('Error getting session metadata', { error });
      return null;
    }
  }

  private async cacheSession(session: Session): Promise<void> {
    try {
      const ttlSeconds = Math.floor(
        (new Date(session.expiresAt).getTime() - Date.now()) / 1000
      );
      
      // Only cache if session hasn't expired
      if (ttlSeconds > 0) {
        const cacheTTL = Math.min(ttlSeconds, REDIS_CONFIG.TTL.SESSION);
        
        // Cache by token (primary lookup)
        const tokenKey = this.getSessionTokenKey(session.sessionToken);
        await cacheHelpers.set(tokenKey, session, cacheTTL);
        
        // Cache by ID (secondary lookup)
        const idKey = this.getSessionIdKey(session.id);
        await cacheHelpers.set(idKey, session, cacheTTL);
        
        logger.debug('Session cached', { 
          sessionId: session.id, 
          ttl: cacheTTL 
        });
      }
    } catch (error) {
      logger.error('Error caching session', { error, sessionId: session.id });
    }
  }

  private async cacheUserSessions(userId: string, sessions: Session[]): Promise<void> {
    try {
      // Cache individual sessions
      for (const session of sessions) {
        await this.cacheSession(session);
      }
      
      // Update user sessions set
      const sessionIds = sessions.map(s => s.id);
      const setKey = this.getUserSessionsKey(userId);
      
      // Clear and repopulate the set
      await cacheHelpers.del(setKey);
      if (sessionIds.length > 0) {
        await cacheHelpers.sadd(setKey, ...sessionIds);
      }
    } catch (error) {
      logger.error('Error caching user sessions', { error, userId });
    }
  }

  private async addSessionToUserSet(userId: string, sessionId: string): Promise<void> {
    try {
      const setKey = this.getUserSessionsKey(userId);
      await cacheHelpers.sadd(setKey, sessionId);
    } catch (error) {
      logger.error('Error adding session to user set', { error, userId, sessionId });
    }
  }

  private async removeCachedSession(
    sessionToken: string, 
    sessionId: string, 
    userId: string
  ): Promise<void> {
    try {
      // Remove from token-based cache
      await cacheHelpers.del(this.getSessionTokenKey(sessionToken));
      
      // Remove from ID-based cache
      await cacheHelpers.del(this.getSessionIdKey(sessionId));
      
      // Remove from user sessions set
      await cacheHelpers.srem(this.getUserSessionsKey(userId), sessionId);
      
      logger.debug('Session removed from cache', { sessionId, userId });
    } catch (error) {
      logger.error('Error removing cached session', { error, sessionId });
    }
  }

  private async getCachedSessionByToken(token: string): Promise<Session | null> {
    try {
      const key = this.getSessionTokenKey(token);
      return await cacheHelpers.get<Session>(key);
    } catch (error) {
      logger.error('Error getting cached session by token', { error });
      return null;
    }
  }

  private async getCachedSessionById(sessionId: string): Promise<Session | null> {
    try {
      const key = this.getSessionIdKey(sessionId);
      return await cacheHelpers.get<Session>(key);
    } catch (error) {
      logger.error('Error getting cached session by ID', { error, sessionId });
      return null;
    }
  }

  private getSessionTokenKey(token: string): string {
    return `${REDIS_CONFIG.KEYS.SESSION}token:${token}`;
  }

  private getSessionIdKey(sessionId: string): string {
    return `${REDIS_CONFIG.KEYS.SESSION}id:${sessionId}`;
  }

  private getUserSessionsKey(userId: string): string {
    return `${REDIS_CONFIG.KEYS.SESSION}user:${userId}`;
  }

  private mapRow(row: any): Session {
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
