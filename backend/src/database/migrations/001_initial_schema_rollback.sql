-- Database Migration 001 Rollback: Drop Initial Schema
-- Real-Time Messenger Application
-- Database: PostgreSQL 15+
-- Created: 2025-10-28
-- Description: Rollback script to drop all tables created by 001_initial_schema.sql
-- WARNING: This will delete all data in the database!

-- ============================================================================
-- DROP TABLES (in reverse order of dependencies)
-- ============================================================================

-- Drop tables that reference messages
DROP TABLE IF EXISTS unread_messages CASCADE;
DROP TABLE IF EXISTS message_delivery CASCADE;
DROP TABLE IF EXISTS message_reactions CASCADE;
DROP TABLE IF EXISTS attachments CASCADE;

-- Drop messages table
DROP TABLE IF EXISTS messages CASCADE;

-- Drop chat_participants
DROP TABLE IF EXISTS chat_participants CASCADE;

-- Drop chats
DROP TABLE IF EXISTS chats CASCADE;

-- Drop contacts
DROP TABLE IF EXISTS contacts CASCADE;

-- Drop user_sessions
DROP TABLE IF EXISTS user_sessions CASCADE;

-- Drop users
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- DROP FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ============================================================================
-- ROLLBACK COMPLETE
-- ============================================================================

-- Note: The migrations tracking table is NOT dropped to preserve migration history
