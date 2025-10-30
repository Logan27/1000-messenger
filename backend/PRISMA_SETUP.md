# Prisma Setup Documentation

## Overview

Prisma has been initialized in the backend project as specified in task T013. This document provides information about the Prisma setup and how to use it.

## What Was Done

1. **Installed Prisma Dependencies**
   - `@prisma/client` (v6.18.0) - Added to dependencies
   - `prisma` (v6.18.0) - Added to devDependencies

2. **Initialized Prisma**
   - Ran `npx prisma init` to create the initial Prisma setup
   - Created `prisma/schema.prisma` - Prisma schema file
   - Created `prisma.config.ts` - Prisma configuration file

3. **Configured Prisma**
   - Set database provider to PostgreSQL
   - Configured client generation to `src/generated/prisma`
   - Added dotenv support to prisma.config.ts for environment variable loading
   - DATABASE_URL is read from `.env` file (see `.env.example` for format)

4. **Added NPM Scripts**
   - `prisma:generate` - Generate Prisma client
   - `prisma:migrate` - Run migrations in development
   - `prisma:migrate:deploy` - Deploy migrations in production
   - `prisma:studio` - Open Prisma Studio (database GUI)

5. **Updated Documentation**
   - Updated backend README.md with Prisma information
   - Updated project structure to reflect Prisma files

6. **Updated .gitignore**
   - Added `**/src/generated/` to ignore Prisma client code

## File Structure

```
backend/
├── prisma/
│   ├── schema.prisma         # Prisma schema definition
│   └── migrations/           # Prisma migrations (generated)
├── prisma.config.ts          # Prisma configuration
├── src/
│   └── generated/
│       └── prisma/           # Generated Prisma client (gitignored)
└── .env                      # Environment variables (contains DATABASE_URL)
```

## Usage

### Generate Prisma Client

After making changes to `prisma/schema.prisma`, regenerate the client:

```bash
npm run prisma:generate
```

### Create Migrations

To create a new migration in development:

```bash
npm run prisma:migrate
```

### Deploy Migrations

To deploy migrations in production:

```bash
npm run prisma:migrate:deploy
```

### Open Prisma Studio

To open the database GUI:

```bash
npm run prisma:studio
```

## Next Steps

The following tasks will build upon this Prisma setup:

- **T019**: Define Prisma schema with all 9 entities (users, contacts, chats, chat_participants, messages, attachments, message_reactions, message_delivery, unread_messages)
- **T020**: Create initial database migration
- **T021**: Setup database configuration for connection pooling

## Database Configuration

The database connection is configured via the `DATABASE_URL` environment variable:

```
DATABASE_URL=postgresql://chatuser:chatpass@localhost:5432/chatapp
```

See `.env.example` for the full list of environment variables.

## Prisma Client Import

To use the Prisma client in your code:

```typescript
import { PrismaClient } from '../generated/prisma/client';

const prisma = new PrismaClient();
```

## Reference

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
