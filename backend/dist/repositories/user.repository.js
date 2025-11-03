"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const database_1 = require("../config/database");
class UserRepository {
    async create(data) {
        const query = `
      INSERT INTO users (username, password_hash, display_name, created_at, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;
        const values = [data.username, data.passwordHash, data.displayName];
        const result = await database_1.pool.query(query, values);
        return this.mapRow(result.rows[0]);
    }
    async findById(id) {
        const query = `SELECT * FROM users WHERE id = $1`;
        const result = await database_1.readPool.query(query, [id]);
        return result.rows[0] ? this.mapRow(result.rows[0]) : null;
    }
    async findByUsername(username) {
        const query = `SELECT * FROM users WHERE username = $1`;
        const result = await database_1.readPool.query(query, [username]);
        return result.rows[0] ? this.mapRow(result.rows[0]) : null;
    }
    async updateStatus(userId, status) {
        const query = `
      UPDATE users 
      SET status = $1, last_seen = CURRENT_TIMESTAMP
      WHERE id = $2
    `;
        await database_1.pool.query(query, [status, userId]);
    }
    async updateLastSeen(userId) {
        const query = `
      UPDATE users 
      SET last_seen = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
        await database_1.pool.query(query, [userId]);
    }
    async update(userId, data) {
        const fields = [];
        const values = [];
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
        const result = await database_1.pool.query(query, values);
        return this.mapRow(result.rows[0]);
    }
    async search(query, limit = 20) {
        const sql = `
      SELECT id, username, display_name, avatar_url, status, last_seen, created_at, updated_at
      FROM users
      WHERE username ILIKE $1
      ORDER BY username
      LIMIT $2
    `;
        const result = await database_1.readPool.query(sql, [`%${query}%`, limit]);
        return result.rows.map(row => this.mapRow(row));
    }
    async findAll(limit = 100, offset = 0) {
        const query = `
      SELECT id, username, display_name, avatar_url, status, last_seen, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;
        const result = await database_1.readPool.query(query, [limit, offset]);
        return result.rows.map(row => this.mapRow(row));
    }
    async findByIds(userIds) {
        if (userIds.length === 0) {
            return [];
        }
        const query = `
      SELECT * FROM users
      WHERE id = ANY($1::uuid[])
    `;
        const result = await database_1.readPool.query(query, [userIds]);
        return result.rows.map(row => this.mapRow(row));
    }
    async updatePassword(userId, newPasswordHash) {
        const query = `
      UPDATE users
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;
        await database_1.pool.query(query, [newPasswordHash, userId]);
    }
    async delete(userId) {
        const query = `DELETE FROM users WHERE id = $1`;
        await database_1.pool.query(query, [userId]);
    }
    async count() {
        const query = `SELECT COUNT(*) as count FROM users`;
        const result = await database_1.readPool.query(query);
        return parseInt(result.rows[0].count, 10);
    }
    mapRow(row) {
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
exports.UserRepository = UserRepository;
//# sourceMappingURL=user.repository.js.map