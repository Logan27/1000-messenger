# Database Migrations

This directory contains SQL migration files for the database schema.

## Overview

The messenger application uses PostgreSQL as its primary database. Migrations are managed through two approaches:

1. **SQL Migrations** (in this directory) - Raw SQL files for the initial schema and complex migrations
2. **Prisma Migrations** (in `/backend/prisma/migrations/`) - Generated from Prisma schema changes

## Migration Files

### 001_initial_schema.sql

The initial database schema migration that creates all core tables:

- **users** - User accounts with authentication credentials and profile information
- **contacts** - Bidirectional contact relationships between users
- **chats** - Chat rooms for both direct (1-on-1) and group conversations
- **chat_participants** - User membership in chats with roles and join/leave tracking
- **messages** - All messages sent in chats with content and metadata
- **attachments** - File attachments (images) associated with messages
- **message_reactions** - Emoji reactions to messages
- **message_delivery** - Delivery and read status tracking for each message recipient
- **unread_messages** - Fast lookup table for unread message counts per user/chat
- **user_sessions** - Active user sessions for multi-device support and connection tracking

## Running Migrations

### Using the Migration Runner Script

```bash
# From the backend directory
npm run migrate
```

This will:
1. Connect to the database using the `DATABASE_URL` environment variable
2. Create a `migrations` table to track executed migrations
3. Run any pending migrations in order
4. Skip migrations that have already been executed

### Using Prisma Migrations

For Prisma-managed migrations:

```bash
# Development (creates and applies migration)
npm run prisma:migrate

# Production (applies existing migrations)
npm run prisma:migrate:deploy
```

### Using Docker

Migrations can be automatically run when starting the Docker container by setting the `RUN_MIGRATIONS` environment variable:

```bash
docker run -e RUN_MIGRATIONS=true chat-backend
```

Or with Docker Compose:

```yaml
environment:
  RUN_MIGRATIONS: "true"
```

## Manual Migration

To run a migration manually:

```bash
# Connect to PostgreSQL
psql postgresql://chatuser:chatpass@localhost:5432/chatapp

# Run migration file
\i src/database/migrations/001_initial_schema.sql
```

## Migration Best Practices

1. **Always test migrations** on a development database first
2. **Create backups** before running migrations on production
3. **Use transactions** for all schema changes (BEGIN/COMMIT)
4. **Make migrations reversible** when possible
5. **Document breaking changes** in migration comments
6. **Test rollback procedures** before deploying

## Schema Overview

The database schema follows a normalized relational design optimized for:
- Real-time message delivery (1,000 concurrent users)
- Message history queries (50 messages/second)
- Full-text search on messages
- Efficient unread count lookups
- Multi-device session support

### Key Relationships

```
users
  ├─→ contacts (bidirectional)
  ├─→ chats (via chat_participants)
  └─→ messages (as sender)

chats
  ├─→ chat_participants
  └─→ messages

messages
  ├─→ attachments
  ├─→ message_reactions
  ├─→ message_delivery
  └─→ unread_messages
```

## Environment Variables

The migration runner requires the following environment variable:

```bash
DATABASE_URL=postgresql://username:password@host:port/database
```

Example:
```bash
DATABASE_URL=postgresql://chatuser:chatpass@localhost:5432/chatapp
```

## Troubleshooting

### Migration fails with "relation already exists"

The migration has already been run. Check the `migrations` table:

```sql
SELECT * FROM migrations;
```

### Cannot connect to database

Verify your `DATABASE_URL` is correct and the database server is running:

```bash
# Test connection
psql "$DATABASE_URL" -c "SELECT version();"
```

### Permission denied errors

Ensure the database user has sufficient permissions:

```sql
GRANT ALL PRIVILEGES ON DATABASE chatapp TO chatuser;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO chatuser;
```

## Next Steps

After running migrations:

1. **Generate Prisma Client**: `npm run prisma:generate`
2. **Seed test data** (optional): `npm run seed`
3. **Verify schema**: `npm run prisma:studio`

## References

- [Database Schema Documentation](../../specs/001-messenger-app/data-model.md)
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
