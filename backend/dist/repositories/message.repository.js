"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageRepository = void 0;
const database_1 = require("../config/database");
class MessageRepository {
    async create(data) {
        const query = `
      INSERT INTO messages (
        id, chat_id, sender_id, content, content_type, 
        metadata, reply_to_id, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      RETURNING *
    `;
        const values = [
            data.id,
            data.chatId,
            data.senderId,
            data.content,
            data.contentType || 'text',
            JSON.stringify(data.metadata || {}),
            data.replyToId || null,
        ];
        const result = await database_1.pool.query(query, values);
        return this.mapRow(result.rows[0]);
    }
    async findById(id) {
        const query = `
      SELECT * FROM messages 
      WHERE id = $1 AND is_deleted = FALSE
    `;
        const result = await database_1.readPool.query(query, [id]);
        return result.rows[0] ? this.mapRow(result.rows[0]) : null;
    }
    async update(id, data) {
        const fields = [];
        const values = [];
        let paramCount = 1;
        if (data.content !== undefined) {
            fields.push(`content = $${paramCount++}`);
            values.push(data.content);
        }
        if (data.isEdited !== undefined) {
            fields.push(`is_edited = $${paramCount++}`);
            values.push(data.isEdited);
        }
        if (data.editedAt !== undefined) {
            fields.push(`edited_at = $${paramCount++}`);
            values.push(data.editedAt);
        }
        if (data.isDeleted !== undefined) {
            fields.push(`is_deleted = $${paramCount++}`);
            values.push(data.isDeleted);
        }
        if (data.deletedAt !== undefined) {
            fields.push(`deleted_at = $${paramCount++}`);
            values.push(data.deletedAt);
        }
        values.push(id);
        const query = `
      UPDATE messages 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
        const result = await database_1.pool.query(query, values);
        return this.mapRow(result.rows[0]);
    }
    async getMessagesByChatId(chatId, limit = 50, cursor) {
        const query = `
      SELECT m.*, 
             u.username as sender_username,
             u.display_name as sender_display_name,
             u.avatar_url as sender_avatar_url
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.chat_id = $1 
        AND m.is_deleted = FALSE
        ${cursor ? 'AND m.created_at < $3' : ''}
      ORDER BY m.created_at DESC
      LIMIT $2
    `;
        const params = cursor ? [chatId, limit, cursor] : [chatId, limit];
        const result = await database_1.readPool.query(query, params);
        return result.rows.map(row => this.mapRow(row));
    }
    async createDeliveryRecords(messageId, userIds) {
        if (userIds.length === 0) {
            return;
        }
        const values = userIds
            .map((userId, idx) => {
            const base = idx * 3;
            return `($${base + 1}, $${base + 2}, $${base + 3})`;
        })
            .join(', ');
        const query = `
      INSERT INTO message_delivery (message_id, user_id, status)
      VALUES ${values}
    `;
        const params = userIds.flatMap(userId => [messageId, userId, 'sent']);
        await database_1.pool.query(query, params);
    }
    async updateDeliveryStatus(messageId, userId, status) {
        const query = `
      UPDATE message_delivery
      SET status = $1,
          ${status === 'delivered' ? 'delivered_at = CURRENT_TIMESTAMP' : ''}
          ${status === 'read' ? 'read_at = CURRENT_TIMESTAMP' : ''}
      WHERE message_id = $2 AND user_id = $3
    `;
        await database_1.pool.query(query, [status, messageId, userId]);
    }
    async getDeliveryStatus(messageId, userId) {
        const query = `
      SELECT * FROM message_delivery
      WHERE message_id = $1 AND user_id = $2
    `;
        const result = await database_1.readPool.query(query, [messageId, userId]);
        return result.rows[0] || null;
    }
    async getUndeliveredMessages(userId) {
        const query = `
      SELECT m.* FROM messages m
      JOIN message_delivery md ON m.id = md.message_id
      WHERE md.user_id = $1 
        AND md.status = 'sent'
        AND m.is_deleted = FALSE
      ORDER BY m.created_at ASC
      LIMIT 100
    `;
        const result = await database_1.readPool.query(query, [userId]);
        return result.rows.map(row => this.mapRow(row));
    }
    async saveEditHistory(data) {
        const query = `
      INSERT INTO message_edit_history (message_id, old_content, old_metadata)
      VALUES ($1, $2, $3)
    `;
        await database_1.pool.query(query, [data.messageId, data.oldContent, JSON.stringify(data.oldMetadata)]);
    }
    async addReaction(messageId, userId, emoji) {
        const query = `
      INSERT INTO message_reactions (message_id, user_id, emoji)
      VALUES ($1, $2, $3)
      ON CONFLICT (message_id, user_id, emoji) DO NOTHING
      RETURNING *
    `;
        const result = await database_1.pool.query(query, [messageId, userId, emoji]);
        return result.rows[0];
    }
    async findReactionById(id) {
        const query = `SELECT * FROM message_reactions WHERE id = $1`;
        const result = await database_1.readPool.query(query, [id]);
        return result.rows[0] || null;
    }
    async deleteReaction(id) {
        const query = `DELETE FROM message_reactions WHERE id = $1`;
        await database_1.pool.query(query, [id]);
    }
    async getReactionsByMessageId(messageId) {
        const query = `
      SELECT mr.*, u.username, u.avatar_url
      FROM message_reactions mr
      JOIN users u ON mr.user_id = u.id
      WHERE mr.message_id = $1
      ORDER BY mr.created_at ASC
    `;
        const result = await database_1.readPool.query(query, [messageId]);
        return result.rows;
    }
    async searchMessages(userId, searchQuery, chatId) {
        const query = `
      SELECT m.*, c.name as chat_name, u.username as sender_username
      FROM messages m
      JOIN chats c ON m.chat_id = c.id
      JOIN users u ON m.sender_id = u.id
      JOIN chat_participants cp ON c.id = cp.chat_id
      WHERE cp.user_id = $1
        AND cp.left_at IS NULL
        AND m.is_deleted = FALSE
        AND to_tsvector('english', m.content) @@ plainto_tsquery('english', $2)
        ${chatId ? 'AND m.chat_id = $3' : ''}
      ORDER BY m.created_at DESC
      LIMIT 100
    `;
        const params = chatId ? [userId, searchQuery, chatId] : [userId, searchQuery];
        const result = await database_1.readPool.query(query, params);
        return result.rows.map(row => this.mapRow(row));
    }
    mapRow(row) {
        return {
            id: row.id,
            chatId: row.chat_id,
            senderId: row.sender_id,
            content: row.content,
            contentType: row.content_type,
            metadata: row.metadata,
            replyToId: row.reply_to_id,
            isEdited: row.is_edited,
            editedAt: row.edited_at,
            isDeleted: row.is_deleted,
            deletedAt: row.deleted_at,
            createdAt: row.created_at,
        };
    }
}
exports.MessageRepository = MessageRepository;
//# sourceMappingURL=message.repository.js.map