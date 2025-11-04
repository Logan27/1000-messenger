import { pool, readPool } from '../config/database';

export interface Message {
  id: string;
  chatId: string;
  senderId: string | null;
  content: string;
  contentType: 'text' | 'image' | 'system';
  metadata: Record<string, any>;
  replyToId?: string;
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
}

export class MessageRepository {
  async create(data: Partial<Message>): Promise<Message> {
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

    const result = await pool.query(query, values);
    return this.mapRow(result.rows[0]);
  }

  async findById(id: string): Promise<Message | null> {
    const query = `
      SELECT * FROM messages 
      WHERE id = $1 AND is_deleted = FALSE
    `;

    const result = await readPool.query(query, [id]);
    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  async update(id: string, data: Partial<Message>): Promise<Message> {
    const fields: string[] = [];
    const values: any[] = [];
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

    const result = await pool.query(query, values);
    return this.mapRow(result.rows[0]);
  }

  async getMessagesByChatId(
    chatId: string,
    limit: number = 50,
    cursor?: string
  ): Promise<Message[]> {
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
    const result = await readPool.query(query, params);

    return result.rows.map(row => this.mapRow(row));
  }

  async createDeliveryRecords(messageId: string, userIds: string[]): Promise<void> {
    if (userIds.length === 0) {
      return;
    }

    const values = userIds
      .map((_userId, idx) => {
        const base = idx * 3;
        return `(${base + 1}, ${base + 2}, ${base + 3})`;
      })
      .join(', ');

    const query = `
      INSERT INTO message_delivery (message_id, user_id, status)
      VALUES ${values}
    `;

    const params = userIds.flatMap(userId => [messageId, userId, 'sent']);
    await pool.query(query, params);
  }

  async updateDeliveryStatus(
    messageId: string,
    userId: string,
    status: 'sent' | 'delivered' | 'read'
  ): Promise<void> {
    const query = `
      UPDATE message_delivery
      SET status = $1,
          ${status === 'delivered' ? 'delivered_at = CURRENT_TIMESTAMP' : ''}
          ${status === 'read' ? 'read_at = CURRENT_TIMESTAMP' : ''}
      WHERE message_id = $2 AND user_id = $3
    `;

    await pool.query(query, [status, messageId, userId]);
  }

  async getDeliveryStatus(messageId: string, userId: string) {
    const query = `
      SELECT * FROM message_delivery
      WHERE message_id = $1 AND user_id = $2
    `;

    const result = await readPool.query(query, [messageId, userId]);
    return result.rows[0] || null;
  }

  async getUndeliveredMessages(userId: string): Promise<Message[]> {
    const query = `
      SELECT m.* FROM messages m
      JOIN message_delivery md ON m.id = md.message_id
      WHERE md.user_id = $1 
        AND md.status = 'sent'
        AND m.is_deleted = FALSE
      ORDER BY m.created_at ASC
      LIMIT 100
    `;

    const result = await readPool.query(query, [userId]);
    return result.rows.map(row => this.mapRow(row));
  }

  async saveEditHistory(data: {
    messageId: string;
    oldContent: string;
    oldMetadata: any;
  }): Promise<void> {
    const query = `
      INSERT INTO message_edit_history (message_id, old_content, old_metadata)
      VALUES ($1, $2, $3)
    `;

    await pool.query(query, [data.messageId, data.oldContent, JSON.stringify(data.oldMetadata)]);
  }

  async addReaction(messageId: string, userId: string, emoji: string) {
    const query = `
      INSERT INTO message_reactions (message_id, user_id, emoji)
      VALUES ($1, $2, $3)
      ON CONFLICT (message_id, user_id, emoji) DO NOTHING
      RETURNING *
    `;

    const result = await pool.query(query, [messageId, userId, emoji]);
    return result.rows[0];
  }

  async findReactionById(id: string) {
    const query = `SELECT * FROM message_reactions WHERE id = $1`;
    const result = await readPool.query(query, [id]);
    return result.rows[0] || null;
  }

  async deleteReaction(id: string): Promise<void> {
    const query = `DELETE FROM message_reactions WHERE id = $1`;
    await pool.query(query, [id]);
  }

  async getReactionsByMessageId(messageId: string) {
    const query = `
      SELECT mr.*, u.username, u.avatar_url
      FROM message_reactions mr
      JOIN users u ON mr.user_id = u.id
      WHERE mr.message_id = $1
      ORDER BY mr.created_at ASC
    `;

    const result = await readPool.query(query, [messageId]);
    return result.rows;
  }

  async searchMessages(userId: string, searchQuery: string, chatId?: string) {
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
    const result = await readPool.query(query, params);

    return result.rows.map(row => this.mapRow(row));
  }

  async findAttachmentById(attachmentId: string) {
    const query = `
      SELECT * FROM attachments WHERE id = $1
    `;
    const result = await readPool.query(query, [attachmentId]);
    return result.rows[0] || null;
  }

  // Transaction support methods (T105 - ACID compliance)
  async beginTransaction() {
    const client = await pool.connect();
    await client.query('BEGIN');
    return client;
  }

  async commitTransaction(client: any) {
    await client.query('COMMIT');
    client.release();
  }

  async rollbackTransaction(client: any) {
    await client.query('ROLLBACK');
    client.release();
  }

  async createWithClient(client: any, data: Partial<Message>): Promise<Message> {
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

    const result = await client.query(query, values);
    return this.mapRow(result.rows[0]);
  }

  async createDeliveryRecordsWithClient(client: any, messageId: string, userIds: string[]): Promise<void> {
    if (userIds.length === 0) {
      return;
    }

    const values = userIds
      .map((_userId, idx) => {
        const base = idx * 3;
        return `($${base + 1}, $${base + 2}, $${base + 3})`;
      })
      .join(', ');

    const query = `
      INSERT INTO message_delivery (message_id, user_id, status)
      VALUES ${values}
    `;

    const params = userIds.flatMap(userId => [messageId, userId, 'sent']);
    await client.query(query, params);
  }

  async bulkMarkAsRead(chatId: string, userId: string): Promise<void> {
    const query = `
      UPDATE message_delivery md
      SET status = 'read', read_at = CURRENT_TIMESTAMP
      FROM messages m
      WHERE md.message_id = m.id
        AND m.chat_id = $1
        AND md.user_id = $2
        AND md.status != 'read'
    `;

    await pool.query(query, [chatId, userId]);
  }

  async getReadCount(messageId: string): Promise<{ total: number; read: number }> {
    const query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'read' THEN 1 ELSE 0 END) as read
      FROM message_delivery
      WHERE message_id = $1
    `;

    const result = await readPool.query(query, [messageId]);
    return {
      total: parseInt(result.rows[0]?.total || '0', 10),
      read: parseInt(result.rows[0]?.read || '0', 10),
    };
  }

  private mapRow(row: any): Message {
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
