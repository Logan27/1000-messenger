"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatRepository = void 0;
const database_1 = require("../config/database");
const constants_1 = require("../config/constants");
class ChatRepository {
    async create(data) {
        const query = `
      INSERT INTO chats (id, type, name, slug, avatar_url, owner_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;
        const values = [
            data.id,
            data.type,
            data.name || null,
            data.slug || null,
            data.avatarUrl || null,
            data.ownerId || null,
        ];
        const result = await database_1.pool.query(query, values);
        return this.mapRow(result.rows[0]);
    }
    async findById(id) {
        const query = `
      SELECT * FROM chats 
      WHERE id = $1 AND is_deleted = FALSE
    `;
        const result = await database_1.readPool.query(query, [id]);
        return result.rows[0] ? this.mapRow(result.rows[0]) : null;
    }
    async findBySlug(slug) {
        const query = `
      SELECT * FROM chats 
      WHERE slug = $1 AND is_deleted = FALSE
    `;
        const result = await database_1.readPool.query(query, [slug]);
        return result.rows[0] ? this.mapRow(result.rows[0]) : null;
    }
    async findDirectChat(user1Id, user2Id) {
        const query = `
      SELECT c.* FROM chats c
      WHERE c.type = 'direct'
        AND c.is_deleted = FALSE
        AND EXISTS (
          SELECT 1 FROM chat_participants cp1 
          WHERE cp1.chat_id = c.id AND cp1.user_id = $1 AND cp1.left_at IS NULL
        )
        AND EXISTS (
          SELECT 1 FROM chat_participants cp2 
          WHERE cp2.chat_id = c.id AND cp2.user_id = $2 AND cp2.left_at IS NULL
        )
      LIMIT 1
    `;
        const result = await database_1.readPool.query(query, [user1Id, user2Id]);
        return result.rows[0] ? this.mapRow(result.rows[0]) : null;
    }
    async getUserChats(userId) {
        const query = `
      SELECT 
        c.*,
        cp.unread_count,
        cp.last_read_message_id,
        (
          SELECT json_build_object(
            'id', m.id,
            'content', m.content,
            'createdAt', m.created_at,
            'senderId', m.sender_id,
            'senderUsername', u.username
          )
          FROM messages m
          JOIN users u ON m.sender_id = u.id
          WHERE m.chat_id = c.id AND m.is_deleted = FALSE
          ORDER BY m.created_at DESC
          LIMIT 1
        ) as last_message
      FROM chats c
      JOIN chat_participants cp ON c.id = cp.chat_id
      WHERE cp.user_id = $1 
        AND cp.left_at IS NULL
        AND c.is_deleted = FALSE
      ORDER BY c.last_message_at DESC NULLS LAST
    `;
        const result = await database_1.readPool.query(query, [userId]);
        return result.rows;
    }
    async findSharedChats(user1Id, user2Id) {
        const query = `
      SELECT DISTINCT c.id
      FROM chats c
      WHERE EXISTS (
        SELECT 1 FROM chat_participants cp1
        WHERE cp1.chat_id = c.id AND cp1.user_id = $1 AND cp1.left_at IS NULL
      )
      AND EXISTS (
        SELECT 1 FROM chat_participants cp2
        WHERE cp2.chat_id = c.id AND cp2.user_id = $2 AND cp2.left_at IS NULL
      )
    `;
        const result = await database_1.readPool.query(query, [user1Id, user2Id]);
        return result.rows.map(row => row.id);
    }
    async addParticipant(chatId, userId, role = constants_1.PARTICIPANT_ROLE.MEMBER) {
        const query = `
      INSERT INTO chat_participants (chat_id, user_id, role, joined_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (chat_id, user_id) 
      DO UPDATE SET left_at = NULL
    `;
        await database_1.pool.query(query, [chatId, userId, role]);
    }
    async removeParticipant(chatId, userId) {
        const query = `
      UPDATE chat_participants
      SET left_at = CURRENT_TIMESTAMP
      WHERE chat_id = $1 AND user_id = $2
    `;
        await database_1.pool.query(query, [chatId, userId]);
    }
    async getActiveParticipantIds(chatId) {
        const query = `
      SELECT user_id FROM chat_participants
      WHERE chat_id = $1 AND left_at IS NULL
    `;
        const result = await database_1.readPool.query(query, [chatId]);
        return result.rows.map(row => row.user_id);
    }
    async countActiveParticipants(chatId) {
        const query = `
      SELECT COUNT(*) as count FROM chat_participants
      WHERE chat_id = $1 AND left_at IS NULL
    `;
        const result = await database_1.readPool.query(query, [chatId]);
        return parseInt(result.rows[0].count);
    }
    async isUserParticipant(chatId, userId) {
        const query = `
      SELECT 1 FROM chat_participants
      WHERE chat_id = $1 AND user_id = $2 AND left_at IS NULL
      LIMIT 1
    `;
        const result = await database_1.readPool.query(query, [chatId, userId]);
        return result.rows.length > 0;
    }
    async updateLastMessageAt(chatId) {
        const query = `
      UPDATE chats
      SET last_message_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
        await database_1.pool.query(query, [chatId]);
    }
    async incrementUnreadCounts(chatId, userIds) {
        if (userIds.length === 0) {
            return;
        }
        const query = `
      UPDATE chat_participants
      SET unread_count = unread_count + 1
      WHERE chat_id = $1 AND user_id = ANY($2)
    `;
        await database_1.pool.query(query, [chatId, userIds]);
    }
    async resetUnreadCount(chatId, userId) {
        const query = `
      UPDATE chat_participants
      SET unread_count = 0
      WHERE chat_id = $1 AND user_id = $2
    `;
        await database_1.pool.query(query, [chatId, userId]);
    }
    async update(chatId, data) {
        const fields = [];
        const values = [];
        let paramCount = 1;
        if (data.name !== undefined) {
            fields.push(`name = $${paramCount++}`);
            values.push(data.name);
        }
        if (data.avatarUrl !== undefined) {
            fields.push(`avatar_url = $${paramCount++}`);
            values.push(data.avatarUrl);
        }
        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(chatId);
        const query = `
      UPDATE chats 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
        const result = await database_1.pool.query(query, values);
        return this.mapRow(result.rows[0]);
    }
    async delete(chatId) {
        const query = `
      UPDATE chats
      SET is_deleted = TRUE
      WHERE id = $1
    `;
        await database_1.pool.query(query, [chatId]);
    }
    mapRow(row) {
        return {
            id: row.id,
            type: row.type,
            name: row.name,
            slug: row.slug,
            avatarUrl: row.avatar_url,
            ownerId: row.owner_id,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            lastMessageAt: row.last_message_at,
            isDeleted: row.is_deleted,
        };
    }
}
exports.ChatRepository = ChatRepository;
//# sourceMappingURL=chat.repository.js.map