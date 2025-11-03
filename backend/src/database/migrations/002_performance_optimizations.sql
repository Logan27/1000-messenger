-- Database Migration 002: Performance Optimizations
-- Real-Time Messenger Application
-- Created: 2025-11-03
-- Description: Additional indexes and optimizations for better query performance

-- ============================================================================
-- ADDITIONAL INDEXES FOR PERFORMANCE
-- ============================================================================

-- Composite index for message_delivery status updates (covers common query pattern)
CREATE INDEX IF NOT EXISTS idx_delivery_message_user 
ON message_delivery(message_id, user_id, status);

-- Index for active chat participants queries (frequently used in message sending)
CREATE INDEX IF NOT EXISTS idx_chat_participants_unread 
ON chat_participants(chat_id, user_id, unread_count) 
WHERE left_at IS NULL;

-- Index for user sessions by token and expiry (used in auth middleware)
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_active 
ON user_sessions(session_token, expires_at, is_active) 
WHERE is_active = TRUE;

-- Partial index for user status queries (online users only)
CREATE INDEX IF NOT EXISTS idx_users_online 
ON users(id, status, last_seen) 
WHERE status = 'online';

-- Index for contact queries by status (frequently filtered)
CREATE INDEX IF NOT EXISTS idx_contacts_both_users 
ON contacts(user_id, contact_id, status);

-- ============================================================================
-- QUERY PERFORMANCE HINTS
-- ============================================================================

-- Add statistics for better query planning
ANALYZE users;
ANALYZE chats;
ANALYZE chat_participants;
ANALYZE messages;
ANALYZE message_delivery;
ANALYZE contacts;
ANALYZE user_sessions;

-- ============================================================================
-- NOTES
-- ============================================================================
-- These indexes improve performance for:
-- 1. Message delivery status updates
-- 2. Chat participant lookups with unread counts
-- 3. Session validation in auth middleware
-- 4. User status queries (presence)
-- 5. Bidirectional contact lookups
