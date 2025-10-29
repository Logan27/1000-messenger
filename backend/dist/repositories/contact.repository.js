"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactRepository = void 0;
const database_1 = require("../config/database");
class ContactRepository {
    async create(data) {
        const query = `
      INSERT INTO contacts (user_id, contact_id, status, requested_by, created_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      RETURNING *
    `;
        const values = [data.userId, data.contactId, data.status, data.requestedBy];
        const result = await database_1.pool.query(query, values);
        return this.mapRow(result.rows[0]);
    }
    async findByUserAndContact(userId, contactId) {
        const query = `
      SELECT * FROM contacts 
      WHERE user_id = $1 AND contact_id = $2
    `;
        const result = await database_1.readPool.query(query, [userId, contactId]);
        return result.rows[0] ? this.mapRow(result.rows[0]) : null;
    }
    async areContacts(user1Id, user2Id) {
        const query = `
      SELECT 1 FROM contacts
      WHERE ((user_id = $1 AND contact_id = $2) 
         OR (user_id = $2 AND contact_id = $1))
        AND status = 'accepted'
      LIMIT 1
    `;
        const result = await database_1.readPool.query(query, [user1Id, user2Id]);
        return result.rows.length > 0;
    }
    async getUserContacts(userId) {
        const query = `
      SELECT c.*, u.username, u.display_name, u.avatar_url, u.status as user_status
      FROM contacts c
      JOIN users u ON c.contact_id = u.id
      WHERE c.user_id = $1 AND c.status = 'accepted'
      ORDER BY u.username
    `;
        const result = await database_1.readPool.query(query, [userId]);
        return result.rows.map(row => this.mapRow(row));
    }
    async getPendingRequests(userId) {
        const query = `
      SELECT c.*, u.username, u.display_name, u.avatar_url
      FROM contacts c
      JOIN users u ON c.requested_by = u.id
      WHERE c.contact_id = $1 AND c.status = 'pending'
      ORDER BY c.created_at DESC
    `;
        const result = await database_1.readPool.query(query, [userId]);
        return result.rows.map(row => this.mapRow(row));
    }
    async updateStatus(contactId, status) {
        const query = `
      UPDATE contacts
      SET status = $1, accepted_at = ${status === 'accepted' ? 'CURRENT_TIMESTAMP' : 'NULL'}
      WHERE id = $2
    `;
        await database_1.pool.query(query, [status, contactId]);
    }
    async delete(contactId) {
        const query = `DELETE FROM contacts WHERE id = $1`;
        await database_1.pool.query(query, [contactId]);
    }
    mapRow(row) {
        return {
            id: row.id,
            userId: row.user_id,
            contactId: row.contact_id,
            status: row.status,
            requestedBy: row.requested_by,
            createdAt: row.created_at,
            acceptedAt: row.accepted_at,
        };
    }
}
exports.ContactRepository = ContactRepository;
//# sourceMappingURL=contact.repository.js.map