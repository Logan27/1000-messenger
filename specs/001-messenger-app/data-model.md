# Data Model: Real-Time Messenger Application

**Feature Branch**: `001-messenger-app`  
**Created**: October 28, 2025  
**Status**: Complete  
**Database**: PostgreSQL 15+  
**ORM**: Prisma 5+

## Overview

This document defines the complete data model for the messenger application, including all entities, relationships, constraints, and indexes optimized for performance at scale (1,000 concurrent users, 50 messages/second).

---

## Entity Relationship Diagram

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│     users       │         │    contacts      │         │     chats       │
├─────────────────┤         ├──────────────────┤         ├─────────────────┤
│ id (PK)         │────────>│ user_id (FK)     │    ┌────│ id (PK)         │
│ username (UQ)   │         │ contact_id (FK)  │    │    │ type            │
│ password_hash   │         │ status           │    │    │ name            │
│ display_name    │         │ requested_by     │    │    │ slug (UQ)       │
│ avatar_url      │         │ created_at       │    │    │ owner_id (FK)   │
│ status          │         │ accepted_at      │    │    │ created_at      │
│ last_seen       │         └──────────────────┘    │    │ last_message_at │
│ created_at      │                                 │    │ avatar_url      │
│ updated_at      │                                 │    │ is_deleted      │
└─────────────────┘                                 │    └─────────────────┘
        │                                           │              │
        │                                           │              │
        │         ┌──────────────────────┐          │              │
        └────────>│ chat_participants    │<─────────┘              │
                  ├──────────────────────┤                         │
                  │ id (PK)              │                         │
                  │ chat_id (FK)         │                         │
                  │ user_id (FK)         │                         │
                  │ role                 │                         │
                  │ joined_at            │                         │
                  │ left_at              │                         │
                  └──────────────────────┘                         │
                             │                                     │
                             │                                     │
                  ┌──────────┴──────────┐                         │
                  │                     │                         │
                  ↓                     ↓                         │
        ┌──────────────────┐   ┌───────────────────┐             │
        │    messages      │   │ unread_messages   │             │
        ├──────────────────┤   ├───────────────────┤             │
        │ id (PK)          │   │ id (PK)           │             │
        │ chat_id (FK)     │<──┤ chat_id (FK)      │             │
        │ sender_id (FK)   │   │ user_id (FK)      │             │
        │ content          │   │ message_id (FK)   │             │
        │ content_type     │   │ created_at        │             │
        │ metadata         │   └───────────────────┘             │
        │ reply_to_id (FK) │                                     │
        │ is_edited        │                                     │
        │ edited_at        │                                     │
        │ is_deleted       │                                     │
        │ deleted_at       │                                     │
        │ created_at       │                                     │
        └──────────────────┘                                     │
                  │                                               │
                  │                                               │
      ┌───────────┼───────────────┐                             │
      │           │               │                             │
      ↓           ↓               ↓                             │
┌────────────┐ ┌──────────────┐ ┌──────────────┐              │
│attachments │ │message_      │ │message_      │              │
│            │ │reactions     │ │delivery      │              │
├────────────┤ ├──────────────┤ ├──────────────┤              │
│ id (PK)    │ │ id (PK)      │ │ id (PK)      │              │
│message_id  │ │ message_id   │ │ message_id   │              │
│file_name   │ │ user_id (FK) │ │ user_id (FK) │              │
│file_type   │ │ emoji        │ │ status       │              │
│storage_key │ │ created_at   │ │ delivered_at │              │
│thumb_key   │ └──────────────┘ │ read_at      │              │
│url         │                  │ created_at   │              │
│thumb_url   │                  └──────────────┘              │
│file_size   │                                                │
│created_at  │                                                │
└────────────┘                                                │
```

---

## Entity Definitions

### 1. users

**Purpose**: Store user account information and authentication credentials.

**Schema**:

```sql
CREATE TABLE users (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username          VARCHAR(50) UNIQUE NOT NULL,
    password_hash     VARCHAR(255) NOT NULL,
    display_name      VARCHAR(100),
    avatar_url        VARCHAR(500),
    status            VARCHAR(20) DEFAULT 'offline' 
                      CHECK (status IN ('online', 'offline', 'away')),
    last_seen         TIMESTAMP,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Constraints
    CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]{3,50}$')
);

-- Indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_last_seen ON users(last_seen DESC);
CREATE INDEX idx_users_created ON users(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK, Generated | Unique user identifier |
| `username` | VARCHAR(50) | UNIQUE, NOT NULL, Pattern: `^[a-zA-Z0-9_]{3,50}$` | Login username |
| `password_hash` | VARCHAR(255) | NOT NULL | bcrypt hash (12 rounds) |
| `display_name` | VARCHAR(100) | NULL | User's display name |
| `avatar_url` | VARCHAR(500) | NULL | Profile picture URL |
| `status` | VARCHAR(20) | DEFAULT 'offline' | Current online status |
| `last_seen` | TIMESTAMP | NULL | Last active timestamp |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Account creation time |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last profile update |

**Business Rules**:
- Username must be unique (case-sensitive)
- Password must be bcrypt hashed with minimum 12 rounds
- Display name defaults to username if not provided
- Status updates via WebSocket connection/disconnection
- Last seen updated on every activity (message send, chat open)

**Estimated Size**: 10,000 - 100,000 rows | Growth: ~100-500 users/month

---

### 2. contacts

**Purpose**: Manage bidirectional contact relationships between users.

**Schema**:

```sql
CREATE TABLE contacts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contact_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status          VARCHAR(20) NOT NULL 
                    CHECK (status IN ('pending', 'accepted', 'blocked')),
    requested_by    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    accepted_at     TIMESTAMP,
    
    -- Constraints
    CONSTRAINT unique_contact_pair UNIQUE(user_id, contact_id),
    CONSTRAINT no_self_contact CHECK (user_id != contact_id)
);

-- Indexes
CREATE INDEX idx_contacts_user_status ON contacts(user_id, status);
CREATE INDEX idx_contacts_contact_status ON contacts(contact_id, status);
CREATE INDEX idx_contacts_pending ON contacts(contact_id, status) 
    WHERE status = 'pending';
CREATE INDEX idx_contacts_accepted ON contacts(user_id, status, accepted_at DESC)
    WHERE status = 'accepted';
```

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK, Generated | Unique contact relationship ID |
| `user_id` | UUID | FK (users), NOT NULL | User who has this contact |
| `contact_id` | UUID | FK (users), NOT NULL | The contact user |
| `status` | VARCHAR(20) | NOT NULL | Relationship status |
| `requested_by` | UUID | FK (users), NOT NULL | Who initiated the request |
| `created_at` | TIMESTAMP | DEFAULT NOW() | When request was sent |
| `accepted_at` | TIMESTAMP | NULL | When request was accepted |

**Status Values**:
- `pending`: Contact request sent but not yet accepted
- `accepted`: Contact request accepted, users can message
- `blocked`: User blocked this contact

**Business Rules**:
- Bidirectional: Two rows created (user → contact, contact → user)
- When User A sends request to User B:
  - Row 1: `user_id=A, contact_id=B, status=pending, requested_by=A`
  - Row 2: `user_id=B, contact_id=A, status=pending, requested_by=A`
- When User B accepts:
  - Both rows updated to `status=accepted, accepted_at=NOW()`
- When either user removes contact:
  - Both rows deleted
  - Chat history preserved (chats not deleted)

**Estimated Size**: 100,000 - 1,000,000 rows | Growth: ~10-50 contacts per user

---

### 3. chats

**Purpose**: Store chat room metadata for both direct and group chats.

**Schema**:

```sql
CREATE TABLE chats (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type                VARCHAR(20) NOT NULL 
                        CHECK (type IN ('direct', 'group')),
    name                VARCHAR(100),
    slug                VARCHAR(100) UNIQUE,
    avatar_url          VARCHAR(500),
    owner_id            UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_message_at     TIMESTAMP,
    is_deleted          BOOLEAN DEFAULT FALSE NOT NULL,
    
    -- Constraints
    CONSTRAINT group_must_have_name CHECK (type = 'direct' OR name IS NOT NULL)
);

-- Indexes
CREATE INDEX idx_chats_type ON chats(type) WHERE is_deleted = FALSE;
CREATE INDEX idx_chats_slug ON chats(slug) WHERE slug IS NOT NULL;
CREATE INDEX idx_chats_owner ON chats(owner_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_chats_last_message ON chats(last_message_at DESC) 
    WHERE is_deleted = FALSE;

-- Trigger for updated_at
CREATE TRIGGER update_chats_updated_at
    BEFORE UPDATE ON chats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK, Generated | Unique chat identifier |
| `type` | VARCHAR(20) | NOT NULL | 'direct' or 'group' |
| `name` | VARCHAR(100) | NULL (required for groups) | Chat display name |
| `slug` | VARCHAR(100) | UNIQUE | URL-friendly identifier |
| `avatar_url` | VARCHAR(500) | NULL | Group avatar URL |
| `owner_id` | UUID | FK (users) | Group owner (null for direct) |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Chat creation time |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last metadata update |
| `last_message_at` | TIMESTAMP | NULL | Last message timestamp |
| `is_deleted` | BOOLEAN | DEFAULT FALSE | Soft delete flag |

**Business Rules**:
- **Direct Chats**:
  - `type='direct'`, `name=NULL`, `owner_id=NULL`
  - Always exactly 2 participants
  - Reuse existing chat if one exists between two users
  - Slug format: `direct-{user1_id}-{user2_id}` (sorted UUIDs)
  
- **Group Chats**:
  - `type='group'`, `name` required (max 100 chars)
  - 2-300 participants (creator + 1-299 others)
  - `owner_id` points to creator
  - Slug format: `group-{random_id}` or custom slug
  - When owner leaves, ownership transfers to first admin or longest member

**Estimated Size**: 50,000 - 500,000 rows | Growth: Function of user activity

---

### 4. chat_participants

**Purpose**: Track which users are members of which chats.

**Schema**:

```sql
CREATE TABLE chat_participants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id         UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role            VARCHAR(20) DEFAULT 'member' 
                    CHECK (role IN ('owner', 'admin', 'member')),
    joined_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    left_at         TIMESTAMP,
    
    -- Constraints
    CONSTRAINT unique_chat_user UNIQUE(chat_id, user_id)
);

-- Indexes
CREATE INDEX idx_participants_chat_active ON chat_participants(chat_id, left_at)
    WHERE left_at IS NULL;
CREATE INDEX idx_participants_user_active ON chat_participants(user_id, left_at)
    WHERE left_at IS NULL;
CREATE INDEX idx_participants_joined ON chat_participants(chat_id, joined_at ASC);
```

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK, Generated | Unique participant record ID |
| `chat_id` | UUID | FK (chats), NOT NULL | Chat they belong to |
| `user_id` | UUID | FK (users), NOT NULL | User who is participant |
| `role` | VARCHAR(20) | DEFAULT 'member' | User's role in chat |
| `joined_at` | TIMESTAMP | DEFAULT NOW() | When user joined |
| `left_at` | TIMESTAMP | NULL | When user left (null = active) |

**Role Values**:
- `owner`: Group creator, full permissions
- `admin`: Can add/remove members, edit group
- `member`: Can send messages only

**Business Rules**:
- Active participants have `left_at IS NULL`
- When user leaves: Set `left_at = NOW()` (soft delete)
- Direct chats: Always 2 participants with `role='member'`
- Group chats: Maximum 300 active participants
- New group members see all historical messages (no `joined_at` filter on messages)
- When owner leaves group:
  - Promote first admin to owner, OR
  - Promote longest-standing member (earliest `joined_at`)

**Estimated Size**: 500,000 - 5,000,000 rows | Growth: Function of chat activity

---

### 5. messages

**Purpose**: Store all chat messages with content and metadata.

**Schema**:

```sql
CREATE TABLE messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id         UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    sender_id       UUID REFERENCES users(id) ON DELETE SET NULL,
    content         TEXT NOT NULL,
    content_type    VARCHAR(20) DEFAULT 'text' 
                    CHECK (content_type IN ('text', 'image', 'system')),
    metadata        JSONB DEFAULT '{}',
    reply_to_id     UUID REFERENCES messages(id) ON DELETE SET NULL,
    is_edited       BOOLEAN DEFAULT FALSE NOT NULL,
    edited_at       TIMESTAMP,
    is_deleted      BOOLEAN DEFAULT FALSE NOT NULL,
    deleted_at      TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Constraints
    CONSTRAINT content_length CHECK (char_length(content) <= 10000),
    CONSTRAINT edit_timestamp CHECK (is_edited = FALSE OR edited_at IS NOT NULL),
    CONSTRAINT delete_timestamp CHECK (is_deleted = FALSE OR deleted_at IS NOT NULL)
);

-- Indexes
CREATE INDEX idx_messages_chat_created ON messages(chat_id, created_at DESC) 
    WHERE is_deleted = FALSE;
CREATE INDEX idx_messages_sender ON messages(sender_id, created_at DESC)
    WHERE sender_id IS NOT NULL;
CREATE INDEX idx_messages_reply ON messages(reply_to_id)
    WHERE reply_to_id IS NOT NULL;
CREATE INDEX idx_messages_search ON messages 
    USING gin(to_tsvector('english', content)) 
    WHERE is_deleted = FALSE AND content_type = 'text';

-- Partitioning (for production scaling)
-- Partition by month for messages older than 3 months
-- Active messages in main table
```

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK, Generated | Unique message identifier |
| `chat_id` | UUID | FK (chats), NOT NULL | Chat this message belongs to |
| `sender_id` | UUID | FK (users), NULL | User who sent message |
| `content` | TEXT | NOT NULL, Max 10,000 chars | Message content |
| `content_type` | VARCHAR(20) | DEFAULT 'text' | Type of message |
| `metadata` | JSONB | DEFAULT '{}' | Additional data |
| `reply_to_id` | UUID | FK (messages), NULL | Message being replied to |
| `is_edited` | BOOLEAN | DEFAULT FALSE | Whether edited |
| `edited_at` | TIMESTAMP | NULL | When last edited |
| `is_deleted` | BOOLEAN | DEFAULT FALSE | Soft delete flag |
| `deleted_at` | TIMESTAMP | NULL | When deleted |
| `created_at` | TIMESTAMP | DEFAULT NOW() | When sent |

**Content Types**:
- `text`: Regular text message (with optional formatting)
- `image`: Message with image attachments
- `system`: System notification (user joined, left, etc.)

**Metadata Format** (JSONB):
```json
{
  "formatting": {
    "bold": [[0, 5], [10, 15]],      // Character ranges
    "italic": [[7, 12]]
  },
  "attachments": ["attachment_id_1", "attachment_id_2"]
}
```

**Business Rules**:
- Messages are immutable once sent (edit creates new version with flag)
- Soft delete: Set `is_deleted=TRUE, deleted_at=NOW()`, content → "[Deleted]"
- `sender_id` can be NULL if user account deleted (shows "[Deleted User]")
- System messages have `sender_id=NULL, content_type='system'`
- Replies preserve link even if original deleted (show "[Message Deleted]")
- Pagination: Load 50 most recent, then infinite scroll backward

**Estimated Size**: 1,000,000 - 10,000,000+ rows | Growth: 50+ messages/second  
**Retention**: Indefinite with archival strategy (partition by month)

---

### 6. attachments

**Purpose**: Store metadata for uploaded images and files.

**Schema**:

```sql
CREATE TABLE attachments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id      UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    file_name       VARCHAR(255) NOT NULL,
    file_type       VARCHAR(50) NOT NULL,
    file_size       INTEGER NOT NULL,
    storage_key     VARCHAR(500) NOT NULL,
    thumbnail_key   VARCHAR(500) NOT NULL,
    url             VARCHAR(500) NOT NULL,
    thumbnail_url   VARCHAR(500) NOT NULL,
    width           INTEGER,
    height          INTEGER,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Constraints
    CONSTRAINT valid_file_size CHECK (file_size > 0 AND file_size <= 10485760),
    CONSTRAINT valid_file_type CHECK (file_type IN ('image/jpeg', 'image/png', 'image/gif', 'image/webp'))
);

-- Indexes
CREATE INDEX idx_attachments_message ON attachments(message_id);
CREATE INDEX idx_attachments_created ON attachments(created_at DESC);
```

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK, Generated | Unique attachment ID |
| `message_id` | UUID | FK (messages), NOT NULL | Parent message |
| `file_name` | VARCHAR(255) | NOT NULL | Original filename |
| `file_type` | VARCHAR(50) | NOT NULL | MIME type |
| `file_size` | INTEGER | NOT NULL, Max 10MB | File size in bytes |
| `storage_key` | VARCHAR(500) | NOT NULL | S3/MinIO object key |
| `thumbnail_key` | VARCHAR(500) | NOT NULL | Thumbnail object key |
| `url` | VARCHAR(500) | NOT NULL | Signed URL for original |
| `thumbnail_url` | VARCHAR(500) | NOT NULL | Signed URL for thumbnail |
| `width` | INTEGER | NULL | Image width in pixels |
| `height` | INTEGER | NULL | Image height in pixels |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Upload timestamp |

**Business Rules**:
- Maximum 5 attachments per message
- Maximum 10MB per attachment
- Supported formats: JPEG, PNG, GIF, WebP
- Three versions stored:
  - **Original**: Optimized quality 85%, progressive JPEG
  - **Medium**: 800px max dimension, quality 80%
  - **Thumbnail**: 300px × 300px, quality 75%, cropped
- URLs are signed with 1-hour expiration (regenerate on access)
- Storage keys format: `{chat_id}/{message_id}/{uuid}_{size}.{ext}`

**Estimated Size**: 1,000,000 - 10,000,000 rows | Growth: ~10-20% of messages have images

---

### 7. message_reactions

**Purpose**: Store emoji reactions to messages.

**Schema**:

```sql
CREATE TABLE message_reactions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id      UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emoji           VARCHAR(10) NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Constraints
    CONSTRAINT unique_user_emoji_message UNIQUE(message_id, user_id, emoji)
);

-- Indexes
CREATE INDEX idx_reactions_message ON message_reactions(message_id, emoji);
CREATE INDEX idx_reactions_user ON message_reactions(user_id, created_at DESC);
```

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK, Generated | Unique reaction ID |
| `message_id` | UUID | FK (messages), NOT NULL | Message being reacted to |
| `user_id` | UUID | FK (users), NOT NULL | User who reacted |
| `emoji` | VARCHAR(10) | NOT NULL | Emoji unicode or shortcode |
| `created_at` | TIMESTAMP | DEFAULT NOW() | When reaction added |

**Business Rules**:
- One user can add multiple different emojis to same message
- Same user cannot add duplicate emoji to same message
- Display reactions grouped by emoji with count
- Hover shows list of users who reacted
- Remove reaction: DELETE row

**Estimated Size**: 5,000,000 - 50,000,000 rows | Growth: ~2-5 reactions per message on average

---

### 8. message_delivery

**Purpose**: Track delivery and read status for each message/recipient pair.

**Schema**:

```sql
CREATE TABLE message_delivery (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id      UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status          VARCHAR(20) DEFAULT 'pending' 
                    CHECK (status IN ('pending', 'delivered', 'read')),
    delivered_at    TIMESTAMP,
    read_at         TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Constraints
    CONSTRAINT unique_message_user UNIQUE(message_id, user_id),
    CONSTRAINT status_timestamps CHECK (
        (status = 'pending' OR delivered_at IS NOT NULL) AND
        (status IN ('pending', 'delivered') OR read_at IS NOT NULL)
    )
);

-- Indexes
CREATE INDEX idx_delivery_message ON message_delivery(message_id, status);
CREATE INDEX idx_delivery_user_status ON message_delivery(user_id, status)
    WHERE status IN ('pending', 'delivered');
CREATE INDEX idx_delivery_pending ON message_delivery(user_id, created_at DESC)
    WHERE status = 'pending';
```

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK, Generated | Unique delivery record ID |
| `message_id` | UUID | FK (messages), NOT NULL | Message being tracked |
| `user_id` | UUID | FK (users), NOT NULL | Recipient user |
| `status` | VARCHAR(20) | DEFAULT 'pending' | Delivery status |
| `delivered_at` | TIMESTAMP | NULL | When delivered to client |
| `read_at` | TIMESTAMP | NULL | When marked as read |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation time |

**Status Flow**:
1. `pending`: Message queued, user offline
2. `delivered`: Message sent to user's WebSocket client
3. `read`: User opened chat and viewed message

**Business Rules**:
- One row per recipient (excluding sender)
- Direct chat: 1 delivery row
- Group chat: N-1 delivery rows (all participants except sender)
- Update status when:
  - User connects: Deliver all pending messages
  - User receives via WebSocket: Update to `delivered`
  - User opens chat: Update to `read`
- Display in UI:
  - **Direct**: Show single status (sent/delivered/read)
  - **Group**: Show read count ("Read by 5 of 12")

**Estimated Size**: 10,000,000 - 100,000,000 rows | Growth: (# messages) × (avg participants - 1)

---

### 9. unread_messages

**Purpose**: Fast lookup for unread message counts per user/chat.

**Schema**:

```sql
CREATE TABLE unread_messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chat_id         UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    message_id      UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Constraints
    CONSTRAINT unique_user_chat_message UNIQUE(user_id, chat_id, message_id)
);

-- Indexes
CREATE INDEX idx_unread_user_chat ON unread_messages(user_id, chat_id);
CREATE INDEX idx_unread_user ON unread_messages(user_id, created_at DESC);
CREATE INDEX idx_unread_chat ON unread_messages(chat_id, user_id);
```

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK, Generated | Unique record ID |
| `user_id` | UUID | FK (users), NOT NULL | User who hasn't read |
| `chat_id` | UUID | FK (chats), NOT NULL | Chat with unread message |
| `message_id` | UUID | FK (messages), NOT NULL | Unread message |
| `created_at` | TIMESTAMP | DEFAULT NOW() | When message was sent |

**Business Rules**:
- **Insert**: When message sent, create row for each recipient (except sender)
- **Delete**: When user opens chat, delete all rows for that user/chat
- **Count**: `SELECT COUNT(*) FROM unread_messages WHERE user_id = ? AND chat_id = ?`
- **Badge**: Total unread: `SELECT COUNT(DISTINCT chat_id) FROM unread_messages WHERE user_id = ?`
- Performance: Denormalized table for O(1) count queries (vs JOIN on message_delivery)

**Estimated Size**: 10,000,000 - 100,000,000 rows | Growth: Active unread messages only

---

## Indexes Strategy Summary

### High-Impact Indexes

| Table | Index | Purpose | Impact |
|-------|-------|---------|--------|
| `messages` | `(chat_id, created_at DESC)` | Message retrieval | Critical |
| `messages` | `gin(to_tsvector(content))` | Full-text search | High |
| `chat_participants` | `(chat_id, left_at)` WHERE left_at IS NULL | Active members | High |
| `message_delivery` | `(user_id, status)` WHERE status != 'read' | Unread count | High |
| `unread_messages` | `(user_id, chat_id)` | Unread lookup | Critical |
| `contacts` | `(user_id, status)` | Contact list | High |
| `users` | `(username)` | Login/search | Critical |

### Index Maintenance

```sql
-- Monitor index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0 AND schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Rebuild indexes (after bulk operations)
REINDEX TABLE messages;

-- Update statistics for query planner
ANALYZE messages;
VACUUM ANALYZE messages;
```

---

## Performance Optimizations

### 1. Partitioning Strategy

**Messages Table** (high write volume):

```sql
-- Partition by month for messages older than 3 months
CREATE TABLE messages_2024_10 PARTITION OF messages
    FOR VALUES FROM ('2024-10-01') TO ('2024-11-01');

-- Keep active messages (last 3 months) in main table
-- Archive older partitions to cold storage
```

### 2. Connection Pooling

```typescript
// Separate pools for read/write
const writePool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 100,  // (4 cores × 2) + 2 spindles = 10 per backend × 10 backends
  min: 20,
  idleTimeoutMillis: 30000,
});

const readPool = new Pool({
  connectionString: process.env.DATABASE_REPLICA_URL,
  max: 50,
  min: 10,
});
```

### 3. Query Optimization Examples

**Get Chat Messages** (optimized with covering index):

```sql
-- Covering index avoids table lookup
CREATE INDEX idx_messages_chat_covering 
ON messages(chat_id, created_at DESC)
INCLUDE (id, sender_id, content, content_type, is_edited, is_deleted)
WHERE is_deleted = FALSE;

-- Query uses index-only scan
SELECT id, sender_id, content, content_type, is_edited, created_at
FROM messages
WHERE chat_id = $1 AND is_deleted = FALSE
ORDER BY created_at DESC
LIMIT 50;
```

**Get Unread Count** (denormalized table):

```sql
-- Fast O(1) lookup
SELECT COUNT(*) 
FROM unread_messages 
WHERE user_id = $1 AND chat_id = $2;

-- Alternative: Index on message_delivery
SELECT COUNT(*)
FROM message_delivery
WHERE user_id = $1 AND status != 'read';
```

---

## Data Retention & Archival

### Archival Strategy

```sql
-- Archive messages older than 1 year
CREATE TABLE messages_archive (LIKE messages INCLUDING ALL);

INSERT INTO messages_archive
SELECT * FROM messages
WHERE created_at < NOW() - INTERVAL '1 year';

DELETE FROM messages
WHERE created_at < NOW() - INTERVAL '1 year';

-- Move archived messages to cheaper storage tier
-- Keep last 3 months in hot storage for fast search
```

### Backup Strategy

- **Daily**: Incremental backups of changed data
- **Weekly**: Full database backup
- **Monthly**: Archive to cold storage (S3 Glacier)
- **Retention**: 30 days hot, 1 year warm, 7 years cold

---

## Schema Migrations

### Migration Tool

Using Prisma Migrate:

```bash
# Create migration
npx prisma migrate dev --name add_message_reactions

# Apply to production
npx prisma migrate deploy
```

### Migration Best Practices

1. **Backward Compatible**: Add columns with defaults, never drop immediately
2. **Online Migrations**: Use `CREATE INDEX CONCURRENTLY` (no locks)
3. **Zero Downtime**: Deploy schema changes before code changes
4. **Rollback Plan**: Always have a rollback script ready
5. **Test Migrations**: Run on staging with production-like data volume

---

## Prisma Schema

**File**: `backend/prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String   @id @default(uuid()) @db.Uuid
  username      String   @unique @db.VarChar(50)
  passwordHash  String   @map("password_hash") @db.VarChar(255)
  displayName   String?  @map("display_name") @db.VarChar(100)
  avatarUrl     String?  @map("avatar_url") @db.VarChar(500)
  status        String   @default("offline") @db.VarChar(20)
  lastSeen      DateTime? @map("last_seen") @db.Timestamp
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamp
  updatedAt     DateTime @updatedAt @map("updated_at") @db.Timestamp

  contactsFrom  Contact[] @relation("UserContacts")
  contactsTo    Contact[] @relation("ContactUser")
  sentMessages  Message[] @relation("MessageSender")
  participants  ChatParticipant[]
  reactions     MessageReaction[]
  deliveries    MessageDelivery[]
  unreadMessages UnreadMessage[]

  @@index([username])
  @@index([status])
  @@index([lastSeen])
  @@map("users")
}

model Contact {
  id          String   @id @default(uuid()) @db.Uuid
  userId      String   @map("user_id") @db.Uuid
  contactId   String   @map("contact_id") @db.Uuid
  status      String   @db.VarChar(20)
  requestedBy String   @map("requested_by") @db.Uuid
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamp
  acceptedAt  DateTime? @map("accepted_at") @db.Timestamp

  user        User     @relation("UserContacts", fields: [userId], references: [id], onDelete: Cascade)
  contact     User     @relation("ContactUser", fields: [contactId], references: [id], onDelete: Cascade)

  @@unique([userId, contactId])
  @@index([userId, status])
  @@index([contactId, status])
  @@map("contacts")
}

model Chat {
  id            String   @id @default(uuid()) @db.Uuid
  type          String   @db.VarChar(20)
  name          String?  @db.VarChar(100)
  slug          String?  @unique @db.VarChar(100)
  avatarUrl     String?  @map("avatar_url") @db.VarChar(500)
  ownerId       String?  @map("owner_id") @db.Uuid
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamp
  updatedAt     DateTime @updatedAt @map("updated_at") @db.Timestamp
  lastMessageAt DateTime? @map("last_message_at") @db.Timestamp
  isDeleted     Boolean  @default(false) @map("is_deleted")

  participants  ChatParticipant[]
  messages      Message[]
  unreadMessages UnreadMessage[]

  @@index([type])
  @@index([slug])
  @@index([lastMessageAt])
  @@map("chats")
}

model ChatParticipant {
  id        String   @id @default(uuid()) @db.Uuid
  chatId    String   @map("chat_id") @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  role      String   @default("member") @db.VarChar(20)
  joinedAt  DateTime @default(now()) @map("joined_at") @db.Timestamp
  leftAt    DateTime? @map("left_at") @db.Timestamp

  chat      Chat     @relation(fields: [chatId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([chatId, userId])
  @@index([chatId, leftAt])
  @@index([userId, leftAt])
  @@map("chat_participants")
}

model Message {
  id          String   @id @default(uuid()) @db.Uuid
  chatId      String   @map("chat_id") @db.Uuid
  senderId    String?  @map("sender_id") @db.Uuid
  content     String   @db.Text
  contentType String   @default("text") @map("content_type") @db.VarChar(20)
  metadata    Json     @default("{}") @db.JsonB
  replyToId   String?  @map("reply_to_id") @db.Uuid
  isEdited    Boolean  @default(false) @map("is_edited")
  editedAt    DateTime? @map("edited_at") @db.Timestamp
  isDeleted   Boolean  @default(false) @map("is_deleted")
  deletedAt   DateTime? @map("deleted_at") @db.Timestamp
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamp

  chat        Chat     @relation(fields: [chatId], references: [id], onDelete: Cascade)
  sender      User?    @relation("MessageSender", fields: [senderId], references: [id], onDelete: SetNull)
  
  attachments Attachment[]
  reactions   MessageReaction[]
  deliveries  MessageDelivery[]
  unreadMessages UnreadMessage[]

  @@index([chatId, createdAt(sort: Desc)])
  @@index([senderId, createdAt(sort: Desc)])
  @@map("messages")
}

model Attachment {
  id           String   @id @default(uuid()) @db.Uuid
  messageId    String   @map("message_id") @db.Uuid
  fileName     String   @map("file_name") @db.VarChar(255)
  fileType     String   @map("file_type") @db.VarChar(50)
  fileSize     Int      @map("file_size")
  storageKey   String   @map("storage_key") @db.VarChar(500)
  thumbnailKey String   @map("thumbnail_key") @db.VarChar(500)
  url          String   @db.VarChar(500)
  thumbnailUrl String   @map("thumbnail_url") @db.VarChar(500)
  width        Int?
  height       Int?
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamp

  message      Message  @relation(fields: [messageId], references: [id], onDelete: Cascade)

  @@index([messageId])
  @@map("attachments")
}

model MessageReaction {
  id        String   @id @default(uuid()) @db.Uuid
  messageId String   @map("message_id") @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  emoji     String   @db.VarChar(10)
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamp

  message   Message  @relation(fields: [messageId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([messageId, userId, emoji])
  @@index([messageId, emoji])
  @@map("message_reactions")
}

model MessageDelivery {
  id          String   @id @default(uuid()) @db.Uuid
  messageId   String   @map("message_id") @db.Uuid
  userId      String   @map("user_id") @db.Uuid
  status      String   @default("pending") @db.VarChar(20)
  deliveredAt DateTime? @map("delivered_at") @db.Timestamp
  readAt      DateTime? @map("read_at") @db.Timestamp
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamp

  message     Message  @relation(fields: [messageId], references: [id], onDelete: Cascade)
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([messageId, userId])
  @@index([messageId, status])
  @@index([userId, status])
  @@map("message_delivery")
}

model UnreadMessage {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  chatId    String   @map("chat_id") @db.Uuid
  messageId String   @map("message_id") @db.Uuid
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamp

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  chat      Chat     @relation(fields: [chatId], references: [id], onDelete: Cascade)
  message   Message  @relation(fields: [messageId], references: [id], onDelete: Cascade)

  @@unique([userId, chatId, messageId])
  @@index([userId, chatId])
  @@map("unread_messages")
}
```

---

## Summary

This data model provides:

✅ **Complete Entity Coverage**: All 9 core entities with proper relationships  
✅ **Performance Optimized**: Strategic indexes for common queries  
✅ **Scalability Ready**: Partitioning strategy for high-volume tables  
✅ **Data Integrity**: Foreign keys, constraints, and transaction safety  
✅ **Soft Deletes**: Preserve data while hiding from users  
✅ **Audit Trail**: Timestamps for all critical operations  
✅ **Flexible Metadata**: JSONB for extensibility  
✅ **Read/Write Split**: Optimized for replicas  
✅ **Production Ready**: Handles 1,000 users, 50 msg/sec  

**Next Steps**: Proceed to API contract generation (OpenAPI specification)
