-- Database Migration 003: Search Optimizations
-- Real-Time Messenger Application
-- Created: 2025-11-04
-- Description: Add full-text search support for messages

-- ============================================================================
-- FULL-TEXT SEARCH INDEXES
-- ============================================================================

-- Add tsvector column for full-text search on messages
-- This allows PostgreSQL to efficiently search message content
ALTER TABLE messages ADD COLUMN IF NOT EXISTS content_tsvector tsvector;

-- Create GIN index for full-text search performance
-- GIN (Generalized Inverted Index) is optimized for full-text search
CREATE INDEX IF NOT EXISTS idx_messages_fulltext
ON messages USING GIN(content_tsvector);

-- Function to update tsvector column automatically
CREATE OR REPLACE FUNCTION messages_content_tsvector_update() RETURNS trigger AS $$
BEGIN
  NEW.content_tsvector := to_tsvector('english', COALESCE(NEW.content, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update tsvector on insert/update
DROP TRIGGER IF EXISTS messages_content_tsvector_trigger ON messages;
CREATE TRIGGER messages_content_tsvector_trigger
BEFORE INSERT OR UPDATE OF content ON messages
FOR EACH ROW EXECUTE FUNCTION messages_content_tsvector_update();

-- Update existing messages to populate tsvector column
UPDATE messages SET content_tsvector = to_tsvector('english', COALESCE(content, ''));

-- ============================================================================
-- SEARCH PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Composite index for chat-specific message searches
CREATE INDEX IF NOT EXISTS idx_messages_chat_created
ON messages(chat_id, created_at DESC)
WHERE is_deleted = FALSE;

-- ============================================================================
-- QUERY PERFORMANCE HINTS
-- ============================================================================

-- Update statistics for query planner
ANALYZE messages;

-- ============================================================================
-- NOTES
-- ============================================================================
-- This migration adds:
-- 1. tsvector column for efficient full-text search
-- 2. GIN index for fast text search queries
-- 3. Automatic trigger to keep search index up-to-date
-- 4. Composite index for chat-filtered searches
--
-- Usage example:
-- SELECT * FROM messages
-- WHERE content_tsvector @@ to_tsquery('english', 'search & terms')
-- ORDER BY ts_rank(content_tsvector, to_tsquery('english', 'search & terms')) DESC;
