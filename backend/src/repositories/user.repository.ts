import { pool, readPool } from '../config/database';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  displayName?: string;
  avatarUrl?: string;
  status: string;
  lastSeen?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class UserRepository {
  async create(data: Partial<User>): Promise<User> {
    const query = `
      INSERT INTO users (username, password_hash, display_name, created_at, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const values = [data.username, data.passwordHash, data.displayName];
    const result = await pool.query(query, values);
    return this.mapRow(result.rows[0]);
  }

  async findById(id: string): Promise<User | null> {
    const query = `SELECT * FROM users WHERE id = $1`;
    const result = await readPool.query(query, [id]);
    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const query = `SELECT * FROM users WHERE username = $1`;
    const result = await readPool.query(query, [username]);
    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  async updateStatus(userId: string, status: string): Promise<void> {
    const query = `
      UPDATE users 
      SET status = $1, last_seen = CURRENT_TIMESTAMP
      WHERE id = $2
    `;
    await pool.query(query, [status, userId]);
  }

  async updateLastSeen(userId: string): Promise<void> {
    const query = `
      UPDATE users 
      SET last_seen = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await pool.query(query, [userId]);
  }

  async update(userId: string, data: Partial<User>): Promise<User> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.displayName !== undefined) {
      fields.push(`display_name = $${paramCount++}`);
      values.push(data.displayName);
    }

    if (data.avatarUrl !== undefined) {
      fields.push(`avatar_url = $${paramCount++}`);
      values.push(data.avatarUrl);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const query = `
      UPDATE users 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return this.mapRow(result.rows[0]);
  }

  async search(query: string, limit: number = 20): Promise<User[]> {
    const sql = `
      SELECT id, username, display_name, avatar_url, status
      FROM users
      WHERE username ILIKE $1
      ORDER BY username
      LIMIT $2
    `;

    const result = await readPool.query(sql, [`%${query}%`, limit]);
    return result.rows.map(row => this.mapRow(row));
  }

  private mapRow(row: any): User {
    return {
      id: row.id,
      username: row.username,
      passwordHash: row.password_hash,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      status: row.status,
      lastSeen: row.last_seen,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
