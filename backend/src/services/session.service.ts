import { pool } from '../config/database';
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
      uuidv4(),
      data.userId,
      data.sessionToken,
      data.deviceId || null,
      data.deviceType || null,
      data.deviceName || null,
      data.ipAddress || null,
      data.userAgent || null,
      data.expiresAt,
    ];

    const result = await pool.query(query, values);
    const session = this.mapRow(result.rows[0]);

    // Store in Redis for fast access
    await this.cacheSession(session);

    return session;
  }

  async findByToken(token: string): Promise<Session | null> {
    // Try Redis first
    const cached = await this.getCachedSession(token);
    if (cached) {
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
      await this.cacheSession(session);
    }

    return session;
  }

  async getActiveUserSessions(userId: string): Promise<Session[]> {
    const query = `
      SELECT * FROM user_sessions 
      WHERE user_id = $1 AND is_active = TRUE AND expires_at > CURRENT_TIMESTAMP
      ORDER BY last_activity DESC
    `;

    const result = await pool.query(query, [userId]);
    return result.rows.map(row => this.mapRow(row));
  }

  async updateSocketId(sessionId: string, socketId: string): Promise<void> {
    const query = `
      UPDATE user_sessions
      SET socket_id = $1, last_activity = CURRENT_TIMESTAMP
      WHERE id = $2
    `;

    await pool.query(query, [socketId, sessionId]);
  }

  async invalidateSession(sessionToken: string): Promise<void> {
    const query = `
      UPDATE user_sessions
      SET is_active = FALSE
      WHERE session_token = $1
    `;

    await pool.query(query, [sessionToken]);

    // Remove from Redis
    const { REDIS_CONFIG, cacheHelpers } = await import('../config/redis');
    await cacheHelpers.del(`${REDIS_CONFIG.KEYS.SESSION}${sessionToken}`);
  }

  async invalidateAllUserSessions(userId: string): Promise<void> {
    const query = `
      UPDATE user_sessions
      SET is_active = FALSE
      WHERE user_id = $1
    `;

    await pool.query(query, [userId]);

    // Remove all user sessions from Redis
    const { REDIS_CONFIG, cacheHelpers } = await import('../config/redis');
    const pattern = `${REDIS_CONFIG.KEYS.SESSION}${userId}:*`;
    await cacheHelpers.delPattern(pattern);
  }

  async updateLastActivity(sessionToken: string): Promise<void> {
    const query = `
      UPDATE user_sessions
      SET last_activity = CURRENT_TIMESTAMP
      WHERE session_token = $1 AND is_active = TRUE
    `;

    await pool.query(query, [sessionToken]);
  }

  private async cacheSession(session: Session): Promise<void> {
    const { REDIS_CONFIG, cacheHelpers } = await import('../config/redis');
    const key = `${REDIS_CONFIG.KEYS.SESSION}${session.sessionToken}`;
    await cacheHelpers.set(key, session, REDIS_CONFIG.TTL.SESSION);
  }

  private async getCachedSession(token: string): Promise<Session | null> {
    const { REDIS_CONFIG, cacheHelpers } = await import('../config/redis');
    const key = `${REDIS_CONFIG.KEYS.SESSION}${token}`;
    return await cacheHelpers.get<Session>(key);
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
