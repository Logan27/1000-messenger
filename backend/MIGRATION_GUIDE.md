# Database Migration Guide

## Overview

This guide documents the database migration setup for the Real-Time Messenger Application. The initial schema migration (`001_initial_schema.sql`) creates the complete database structure required for all messenger features.

## Migration Files

### Location

All migration files are stored in: `backend/src/database/migrations/`

### Initial Migration (001_initial_schema.sql)

**Created**: 2025-10-28  
**Purpose**: Create initial database schema  
**Size**: 318 lines  
**Database**: PostgreSQL 15+

#### Tables Created

1. **users** - User accounts and authentication
   - Fields: id, username, password_hash, display_name, avatar_url, status, last_seen, created_at, updated_at
   - Constraints: Unique username, username format validation, status enum
   - Indexes: username, status, last_seen, created_at

2. **contacts** - Bidirectional contact relationships
   - Fields: id, user_id, contact_id, status, requested_by, created_at, accepted_at
   - Constraints: Unique pairs, no self-contacts, status enum
   - Indexes: user+status, contact+status, pending requests, accepted contacts

3. **chats** - Direct and group chat rooms
   - Fields: id, type, name, slug, avatar_url, owner_id, created_at, updated_at, last_message_at, is_deleted
   - Constraints: Groups must have names, type enum
   - Indexes: type, slug, owner, last_message_at

4. **chat_participants** - User membership in chats
   - Fields: id, chat_id, user_id, role, joined_at, left_at
   - Constraints: Unique chat+user pairs, role enum
   - Indexes: active participants by chat/user, join order

5. **messages** - All chat messages
   - Fields: id, chat_id, sender_id, content, content_type, metadata (JSONB), reply_to_id, is_edited, edited_at, is_deleted, deleted_at, created_at
   - Constraints: Max 10,000 chars, timestamp consistency, content_type enum
   - Indexes: chat+time, sender, replies, full-text search

6. **attachments** - Image attachments for messages
   - Fields: id, message_id, file_name, file_type, file_size, storage_key, thumbnail_key, url, thumbnail_url, width, height, created_at
   - Constraints: Max 10MB files, valid file types (JPEG, PNG, GIF, WebP)
   - Indexes: message_id, created_at

7. **message_reactions** - Emoji reactions to messages
   - Fields: id, message_id, user_id, emoji, created_at
   - Constraints: Unique user+message+emoji combinations
   - Indexes: message+emoji, user+time

8. **message_delivery** - Delivery and read tracking
   - Fields: id, message_id, user_id, status, delivered_at, read_at, created_at
   - Constraints: Unique message+user pairs, status timestamps, status enum (pending/delivered/read)
   - Indexes: message+status, user+status, pending messages

9. **unread_messages** - Fast unread count lookup
   - Fields: id, user_id, chat_id, message_id, created_at
   - Constraints: Unique user+chat+message combinations
   - Indexes: user+chat, user+time, chat+user

10. **user_sessions** - Multi-device session tracking
    - Fields: id, user_id, session_token, device_id, device_type, device_name, socket_id, ip_address, user_agent, is_active, last_activity, created_at, expires_at
    - Constraints: Unique session tokens
    - Indexes: user+active+expiry, token, socket_id

#### Helper Functions

- **update_updated_at_column()** - Trigger function to auto-update `updated_at` timestamps

#### Triggers

- Users table: Auto-update `updated_at` on row updates
- Chats table: Auto-update `updated_at` on row updates

## Running Migrations

### Method 1: npm Script (Recommended)

```bash
cd backend
npm run migrate
```

This runs the TypeScript migration runner which:
- Creates a `migrations` tracking table
- Tracks which migrations have been executed
- Runs pending migrations in order
- Uses transactions for safety

### Method 2: Direct psql

```bash
psql "$DATABASE_URL" -f src/database/migrations/001_initial_schema.sql
```

### Method 3: Docker Entrypoint

Set the `RUN_MIGRATIONS` environment variable when starting the Docker container:

```bash
docker run -e RUN_MIGRATIONS=true chat-backend
```

## Rollback

To rollback the initial migration:

```bash
psql "$DATABASE_URL" -f src/database/migrations/001_initial_schema_rollback.sql
```

**⚠️ WARNING**: This will delete all data in the database!

## Seeding Test Data

After running migrations, seed the database with test data:

```bash
npm run seed
```

This creates:
- 4 test users (alice, bob, charlie, diana)
- Contact relationships between users
- Direct chats with sample messages
- A group chat with multiple participants
- Sample message delivery statuses

Test credentials (all passwords: `password123`):
- alice / password123
- bob / password123
- charlie / password123
- diana / password123

## Validation

Validate migration files without running them:

```bash
./src/database/validate-migrations.sh
```

## Database Schema Diagram

```
users ──┬── contacts (bidirectional)
        ├── chat_participants ─── chats
        ├── messages ──┬── attachments
        │              ├── message_reactions
        │              ├── message_delivery
        │              └── unread_messages
        └── user_sessions
```

## Performance Features

- **Indexes**: 40+ indexes optimized for common queries
- **Partial Indexes**: Conditional indexes for active/non-deleted records
- **Full-Text Search**: GIN index on message content
- **JSONB**: Flexible metadata storage with indexing support
- **Cascading Deletes**: Automatic cleanup of related data
- **Soft Deletes**: Preserve data history for chats and messages

## Schema Validation

The schema enforces:
- Username format: 3-50 alphanumeric characters and underscores
- Message length: Max 10,000 characters
- File size: Max 10MB (10,485,760 bytes)
- File types: image/jpeg, image/png, image/gif, image/webp
- Status values: online, offline, away
- Chat types: direct, group
- Message types: text, image, system
- Delivery status: pending, delivered, read
- Contact status: pending, accepted, blocked
- Roles: owner, admin, member

## Next Steps

1. **Generate Prisma Client**: `npm run prisma:generate`
2. **Run Migrations**: `npm run migrate`
3. **Seed Database**: `npm run seed`
4. **Verify Schema**: `npm run prisma:studio`
5. **Start Development**: `npm run dev`

## Troubleshooting

### Migration Already Exists Error

If you see "relation already exists", the migration has already run. Check:

```sql
SELECT * FROM migrations;
```

### Connection Refused

Verify PostgreSQL is running and DATABASE_URL is correct:

```bash
psql "$DATABASE_URL" -c "SELECT version();"
```

### Permission Denied

Ensure database user has sufficient privileges:

```sql
GRANT ALL PRIVILEGES ON DATABASE chatapp TO chatuser;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO chatuser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO chatuser;
```

## References

- [Data Model Documentation](../specs/001-messenger-app/data-model.md)
- [Migration README](src/database/README.md)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/15/)
- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)
