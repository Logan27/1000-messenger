-- Database Migration 001: Initial Schema
-- Real-Time Messenger Application
-- Database: PostgreSQL 15+
-- Created: 2025-10-28
-- Description: Initial database schema for messenger application including users,
--              contacts, chats, messages, attachments, reactions, delivery tracking,
--              and unread messages.

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================================
-- USERS TABLE
-- ============================================================================

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

-- Indexes for users
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_last_seen ON users(last_seen DESC);
CREATE INDEX idx_users_created ON users(created_at DESC);

-- Trigger for users updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- CONTACTS TABLE
-- ============================================================================

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

-- Indexes for contacts
CREATE INDEX idx_contacts_user_status ON contacts(user_id, status);
CREATE INDEX idx_contacts_contact_status ON contacts(contact_id, status);
CREATE INDEX idx_contacts_pending ON contacts(contact_id, status) 
    WHERE status = 'pending';
CREATE INDEX idx_contacts_accepted ON contacts(user_id, status, accepted_at DESC)
    WHERE status = 'accepted';

-- ============================================================================
-- CHATS TABLE
-- ============================================================================

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

-- Indexes for chats
CREATE INDEX idx_chats_type ON chats(type) WHERE is_deleted = FALSE;
CREATE INDEX idx_chats_slug ON chats(slug) WHERE slug IS NOT NULL;
CREATE INDEX idx_chats_owner ON chats(owner_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_chats_last_message ON chats(last_message_at DESC) 
    WHERE is_deleted = FALSE;

-- Trigger for chats updated_at
CREATE TRIGGER update_chats_updated_at
    BEFORE UPDATE ON chats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- CHAT PARTICIPANTS TABLE
-- ============================================================================

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

-- Indexes for chat_participants
CREATE INDEX idx_participants_chat_active ON chat_participants(chat_id, left_at)
    WHERE left_at IS NULL;
CREATE INDEX idx_participants_user_active ON chat_participants(user_id, left_at)
    WHERE left_at IS NULL;
CREATE INDEX idx_participants_joined ON chat_participants(chat_id, joined_at ASC);

-- ============================================================================
-- MESSAGES TABLE
-- ============================================================================

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

-- Indexes for messages
CREATE INDEX idx_messages_chat_created ON messages(chat_id, created_at DESC) 
    WHERE is_deleted = FALSE;
CREATE INDEX idx_messages_sender ON messages(sender_id, created_at DESC)
    WHERE sender_id IS NOT NULL;
CREATE INDEX idx_messages_reply ON messages(reply_to_id)
    WHERE reply_to_id IS NOT NULL;
CREATE INDEX idx_messages_search ON messages 
    USING gin(to_tsvector('english', content)) 
    WHERE is_deleted = FALSE AND content_type = 'text';

-- ============================================================================
-- ATTACHMENTS TABLE
-- ============================================================================

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

-- Indexes for attachments
CREATE INDEX idx_attachments_message ON attachments(message_id);
CREATE INDEX idx_attachments_created ON attachments(created_at DESC);

-- ============================================================================
-- MESSAGE REACTIONS TABLE
-- ============================================================================

CREATE TABLE message_reactions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id      UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emoji           VARCHAR(10) NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Constraints
    CONSTRAINT unique_user_emoji_message UNIQUE(message_id, user_id, emoji)
);

-- Indexes for message_reactions
CREATE INDEX idx_reactions_message ON message_reactions(message_id, emoji);
CREATE INDEX idx_reactions_user ON message_reactions(user_id, created_at DESC);

-- ============================================================================
-- MESSAGE DELIVERY TABLE
-- ============================================================================

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

-- Indexes for message_delivery
CREATE INDEX idx_delivery_message ON message_delivery(message_id, status);
CREATE INDEX idx_delivery_user_status ON message_delivery(user_id, status)
    WHERE status IN ('pending', 'delivered');
CREATE INDEX idx_delivery_pending ON message_delivery(user_id, created_at DESC)
    WHERE status = 'pending';

-- ============================================================================
-- UNREAD MESSAGES TABLE
-- ============================================================================

CREATE TABLE unread_messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chat_id         UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    message_id      UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Constraints
    CONSTRAINT unique_user_chat_message UNIQUE(user_id, chat_id, message_id)
);

-- Indexes for unread_messages
CREATE INDEX idx_unread_user_chat ON unread_messages(user_id, chat_id);
CREATE INDEX idx_unread_user ON unread_messages(user_id, created_at DESC);
CREATE INDEX idx_unread_chat ON unread_messages(chat_id, user_id);

-- ============================================================================
-- USER SESSIONS TABLE
-- ============================================================================
-- Note: This table supports multi-device sessions and WebSocket connection tracking

CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(500) NOT NULL UNIQUE,
    device_id VARCHAR(255),
    device_type VARCHAR(50),
    device_name VARCHAR(255),
    socket_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
);

-- Indexes for user_sessions
CREATE INDEX idx_sessions_user_active ON user_sessions(user_id, is_active, expires_at);
CREATE INDEX idx_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_sessions_socket ON user_sessions(socket_id) WHERE socket_id IS NOT NULL;

-- ============================================================================
-- INITIAL DATA / SEED
-- ============================================================================
-- Add any initial seed data here if needed for development/testing

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE users IS 'User accounts with authentication credentials and profile information';
COMMENT ON TABLE contacts IS 'Bidirectional contact relationships between users';
COMMENT ON TABLE chats IS 'Chat rooms for both direct (1-on-1) and group conversations';
COMMENT ON TABLE chat_participants IS 'User membership in chats with roles and join/leave tracking';
COMMENT ON TABLE messages IS 'All messages sent in chats with content and metadata';
COMMENT ON TABLE attachments IS 'File attachments (images) associated with messages';
COMMENT ON TABLE message_reactions IS 'Emoji reactions to messages';
COMMENT ON TABLE message_delivery IS 'Delivery and read status tracking for each message recipient';
COMMENT ON TABLE unread_messages IS 'Fast lookup table for unread message counts per user/chat';
COMMENT ON TABLE user_sessions IS 'Active user sessions for multi-device support and connection tracking';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
