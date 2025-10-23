Complete Improved Chat Application Architecture
Project Structure
text

chat-application/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   ├── redis.ts
│   │   │   ├── storage.ts
│   │   │   ├── constants.ts
│   │   │   └── env.ts
│   │   ├── database/
│   │   │   ├── migrations/
│   │   │   └── seeds/
│   │   ├── models/
│   │   │   ├── user.model.ts
│   │   │   ├── chat.model.ts
│   │   │   ├── message.model.ts
│   │   │   └── contact.model.ts
│   │   ├── repositories/
│   │   │   ├── user.repository.ts
│   │   │   ├── chat.repository.ts
│   │   │   ├── message.repository.ts
│   │   │   └── contact.repository.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── user.service.ts
│   │   │   ├── chat.service.ts
│   │   │   ├── message.service.ts
│   │   │   ├── contact.service.ts
│   │   │   ├── storage.service.ts
│   │   │   ├── search.service.ts
│   │   │   ├── notification.service.ts
│   │   │   └── session.service.ts
│   │   ├── websocket/
│   │   │   ├── socket.manager.ts
│   │   │   ├── handlers/
│   │   │   │   ├── message.handler.ts
│   │   │   │   ├── typing.handler.ts
│   │   │   │   ├── presence.handler.ts
│   │   │   │   └── read-receipt.handler.ts
│   │   │   └── middleware/
│   │   │       └── socket-auth.middleware.ts
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── chat.controller.ts
│   │   │   ├── message.controller.ts
│   │   │   ├── contact.controller.ts
│   │   │   └── health.controller.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── validation.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   ├── rate-limit.middleware.ts
│   │   │   └── security.middleware.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── user.routes.ts
│   │   │   ├── chat.routes.ts
│   │   │   ├── message.routes.ts
│   │   │   ├── contact.routes.ts
│   │   │   └── health.routes.ts
│   │   ├── queues/
│   │   │   └── message-delivery.queue.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── jwt.util.ts
│   │   │   ├── password.util.ts
│   │   │   ├── logger.util.ts
│   │   │   └── validators.util.ts
│   │   ├── app.ts
│   │   └── server.ts
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── store/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   └── package.json
├── tools/
│   └── performance-test/
│       └── load-test.ts
├── docker-compose.yml
├── docker-compose.prod.yml
├── k8s/
│   ├── backend-deployment.yaml
│   ├── frontend-deployment.yaml
│   ├── postgres-statefulset.yaml
│   └── redis-statefulset.yaml
└── README.md
1. Complete Database Schema
SQL

-- database/migrations/001_initial_schema.sql

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    avatar_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'offline',
    last_seen TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_last_seen ON users(last_seen);

-- Contact relationships
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'accepted', 'blocked')),
    requested_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP,
    
    CONSTRAINT unique_contact_pair UNIQUE(user_id, contact_id),
    CONSTRAINT no_self_contact CHECK (user_id != contact_id)
);

CREATE INDEX idx_contacts_user_status ON contacts(user_id, status);
CREATE INDEX idx_contacts_pending ON contacts(contact_id, status) WHERE status = 'pending';

-- Chats
CREATE TABLE chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('direct', 'group')),
    name VARCHAR(100),
    slug VARCHAR(100) UNIQUE, -- For URL routing
    avatar_url VARCHAR(500),
    owner_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_message_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_chats_type ON chats(type);
CREATE INDEX idx_chats_slug ON chats(slug) WHERE slug IS NOT NULL;
CREATE INDEX idx_chats_last_message ON chats(last_message_at DESC) WHERE is_deleted = FALSE;

-- Chat participants
CREATE TABLE chat_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP,
    last_read_message_id UUID,
    unread_count INTEGER DEFAULT 0,
    
    CONSTRAINT unique_chat_user UNIQUE(chat_id, user_id)
);

CREATE INDEX idx_participants_user_active ON chat_participants(user_id, left_at) WHERE left_at IS NULL;
CREATE INDEX idx_participants_chat_active ON chat_participants(chat_id, left_at) WHERE left_at IS NULL;
CREATE INDEX idx_participants_unread ON chat_participants(user_id, unread_count) WHERE unread_count > 0;

-- Messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    content_type VARCHAR(20) DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'system')),
    metadata JSONB DEFAULT '{}',
    reply_to_id UUID REFERENCES messages(id),
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_chat_created ON messages(chat_id, created_at DESC) WHERE is_deleted = FALSE;
CREATE INDEX idx_messages_sender ON messages(sender_id, created_at DESC);
CREATE INDEX idx_messages_search ON messages USING gin(to_tsvector('english', content)) WHERE is_deleted = FALSE;

-- Message edit history
CREATE TABLE message_edit_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    old_content TEXT NOT NULL,
    old_metadata JSONB,
    edited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_edit_history_message ON message_edit_history(message_id, edited_at DESC);

-- Message delivery tracking
CREATE TABLE message_delivery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'delivered', 'read')),
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    
    CONSTRAINT unique_message_user UNIQUE(message_id, user_id)
);

CREATE INDEX idx_delivery_user_status ON message_delivery(user_id, status);
CREATE INDEX idx_delivery_unread ON message_delivery(user_id, status, delivered_at) WHERE status != 'read';

-- Message reactions
CREATE TABLE message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_user_message_emoji UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX idx_reactions_message ON message_reactions(message_id);

-- File attachments
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER NOT NULL,
    storage_key VARCHAR(500) NOT NULL,
    thumbnail_key VARCHAR(500),
    medium_key VARCHAR(500),
    url VARCHAR(1000) NOT NULL,
    thumbnail_url VARCHAR(1000),
    medium_url VARCHAR(1000),
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attachments_message ON attachments(message_id);

-- User sessions (for multi-device support)
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

CREATE INDEX idx_sessions_user_active ON user_sessions(user_id, is_active, expires_at);
CREATE INDEX idx_sessions_token ON user_sessions(session_token);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON chats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    2. Backend Configuration
config/constants.ts
TypeScript

export const LIMITS = {
  MESSAGE_MAX_LENGTH: 10000,
  IMAGE_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  IMAGE_MAX_WIDTH: 4096,
  IMAGE_MAX_HEIGHT: 4096,
  GROUP_MAX_PARTICIPANTS: 300,
  MESSAGES_PER_SECOND_PER_USER: 10,
  CONTACT_REQUESTS_PER_DAY: 50,
  GROUPS_PER_USER: 100,
  MAX_SEARCH_RESULTS: 100,
  PAGINATION_DEFAULT_LIMIT: 50,
  PAGINATION_MAX_LIMIT: 100,
  SESSION_DURATION_DAYS: 30,
  ACCESS_TOKEN_DURATION: '15m',
  REFRESH_TOKEN_DURATION: '7d',
};

export const MESSAGE_STATUS = {
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
} as const;

export const CHAT_TYPE = {
  DIRECT: 'direct',
  GROUP: 'group',
} as const;

export const CONTACT_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  BLOCKED: 'blocked',
} as const;

export const USER_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  AWAY: 'away',
} as const;

export const PARTICIPANT_ROLE = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
} as const;
config/database.ts
TypeScript

import { Pool } from 'pg';
import { config } from './env';
import { logger } from '../utils/logger.util';

// Primary database pool
export const pool = new Pool({
  connectionString: config.DATABASE_URL,
  max: 100, // Maximum connections
  min: 20,  // Minimum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  application_name: 'chat-backend-primary',
});

// Read replica pool (for read-heavy operations)
export const readPool = new Pool({
  connectionString: config.DATABASE_REPLICA_URL || config.DATABASE_URL,
  max: 50,
  min: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  application_name: 'chat-backend-replica',
});

pool.on('error', (err) => {
  logger.error('Unexpected database error', err);
});

readPool.on('error', (err) => {
  logger.error('Unexpected read replica error', err);
});

// Test connection
export async function testConnection(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    logger.info('Database connection successful');
    return true;
  } catch (error) {
    logger.error('Database connection failed', error);
    return false;
  }
}

// Graceful shutdown
export async function closeConnections(): Promise<void> {
  await Promise.all([
    pool.end(),
    readPool.end(),
  ]);
  logger.info('Database connections closed');
}
config/redis.ts
TypeScript

import { createClient } from 'redis';
import { config } from './env';
import { logger } from '../utils/logger.util';

const redisClient = createClient({
  url: config.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        logger.error('Redis reconnection failed after 10 attempts');
        return new Error('Redis reconnection failed');
      }
      return retries * 100;
    },
  },
});

const redisPubClient = createClient({
  url: config.REDIS_URL,
});

const redisSubClient = createClient({
  url: config.REDIS_URL,
});

redisClient.on('error', (err) => logger.error('Redis Client Error', err));
redisPubClient.on('error', (err) => logger.error('Redis Pub Error', err));
redisSubClient.on('error', (err) => logger.error('Redis Sub Error', err));

export async function connectRedis(): Promise<void> {
  await Promise.all([
    redisClient.connect(),
    redisPubClient.connect(),
    redisSubClient.connect(),
  ]);
  logger.info('Redis connected');
}

export async function closeRedis(): Promise<void> {
  await Promise.all([
    redisClient.quit(),
    redisPubClient.quit(),
    redisSubClient.quit(),
  ]);
  logger.info('Redis connections closed');
}

export { redisClient, redisPubClient, redisSubClient };
config/storage.ts
TypeScript

import { S3Client } from '@aws-sdk/client-s3';
import { config } from './env';

export const s3Client = new S3Client({
  region: config.AWS_REGION,
  endpoint: config.S3_ENDPOINT, // For MinIO compatibility
  credentials: {
    accessKeyId: config.S3_ACCESS_KEY,
    secretAccessKey: config.S3_SECRET_KEY,
  },
  forcePathStyle: true, // Required for MinIO
});

export const S3_CONFIG = {
  bucket: config.S3_BUCKET,
  region: config.AWS_REGION,
  publicUrl: config.S3_PUBLIC_URL,
};
config/env.ts
TypeScript

import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  
  // Database
  DATABASE_URL: z.string(),
  DATABASE_REPLICA_URL: z.string().optional(),
  
  // Redis
  REDIS_URL: z.string(),
  
  // S3/MinIO
  S3_ENDPOINT: z.string(),
  S3_ACCESS_KEY: z.string(),
  S3_SECRET_KEY: z.string(),
  S3_BUCKET: z.string(),
  S3_PUBLIC_URL: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1'),
  
  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  
  // CORS
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  
  // Monitoring
  ENABLE_METRICS: z.string().default('true'),
});

export const config = envSchema.parse(process.env);
3. Core Services
services/auth.service.ts
TypeScript

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env';
import { LIMITS } from '../config/constants';
import { UserRepository } from '../repositories/user.repository';
import { SessionService } from './session.service';
import { logger } from '../utils/logger.util';

export class AuthService {
  constructor(
    private userRepo: UserRepository,
    private sessionService: SessionService
  ) {}

  async register(username: string, password: string) {
    // Validate username
    if (username.length < 3 || username.length > 50) {
      throw new Error('Username must be between 3 and 50 characters');
    }

    // Check if user exists
    const existingUser = await this.userRepo.findByUsername(username);
    if (existingUser) {
      throw new Error('Username already taken');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await this.userRepo.create({
      username,
      passwordHash,
      displayName: username,
    });

    logger.info(`User registered: ${username}`);

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
    };
  }

  async login(
    username: string, 
    password: string,
    deviceInfo?: {
      deviceId?: string;
      deviceType?: string;
      deviceName?: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ) {
    // Find user
    const user = await this.userRepo.findByUsername(username);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user.id);
    const refreshToken = this.generateRefreshToken(user.id);

    // Create session
    await this.sessionService.createSession({
      userId: user.id,
      sessionToken: refreshToken,
      deviceId: deviceInfo?.deviceId,
      deviceType: deviceInfo?.deviceType,
      deviceName: deviceInfo?.deviceName,
      ipAddress: deviceInfo?.ipAddress,
      userAgent: deviceInfo?.userAgent,
      expiresAt: new Date(Date.now() + LIMITS.SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000),
    });

    // Update last seen
    await this.userRepo.updateLastSeen(user.id);

    logger.info(`User logged in: ${username}`);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      // Verify refresh token
      const payload = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET) as { userId: string };

      // Check if session exists and is valid
      const session = await this.sessionService.findByToken(refreshToken);
      if (!session || !session.isActive || new Date(session.expiresAt) < new Date()) {
        throw new Error('Invalid session');
      }

      // Generate new access token
      const accessToken = this.generateAccessToken(payload.userId);

      return { accessToken };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async logout(userId: string, sessionToken?: string) {
    if (sessionToken) {
      await this.sessionService.invalidateSession(sessionToken);
    } else {
      await this.sessionService.invalidateAllUserSessions(userId);
    }

    logger.info(`User logged out: ${userId}`);
  }

  private generateAccessToken(userId: string): string {
    return jwt.sign(
      { userId, type: 'access' },
      config.JWT_SECRET,
      { expiresIn: LIMITS.ACCESS_TOKEN_DURATION }
    );
  }

  private generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId, type: 'refresh' },
      config.JWT_REFRESH_SECRET,
      { expiresIn: LIMITS.REFRESH_TOKEN_DURATION }
    );
  }

  async verifyAccessToken(token: string): Promise<{ userId: string }> {
    try {
      const payload = jwt.verify(token, config.JWT_SECRET) as { userId: string };
      return payload;
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }
}
services/message.service.ts
TypeScript

import { v4 as uuidv4 } from 'uuid';
import { MessageRepository } from '../repositories/message.repository';
import { ChatRepository } from '../repositories/chat.repository';
import { MessageDeliveryQueue } from '../queues/message-delivery.queue';
import { SocketManager } from '../websocket/socket.manager';
import { LIMITS } from '../config/constants';
import { logger } from '../utils/logger.util';

export interface SendMessageDto {
  chatId: string;
  senderId: string;
  content: string;
  contentType?: 'text' | 'image' | 'system';
  metadata?: Record<string, any>;
  replyToId?: string;
}

export class MessageService {
  constructor(
    private messageRepo: MessageRepository,
    private chatRepo: ChatRepository,
    private deliveryQueue: MessageDeliveryQueue,
    private socketManager: SocketManager
  ) {}

  async sendMessage(dto: SendMessageDto) {
    // Validate message length
    if (dto.content.length > LIMITS.MESSAGE_MAX_LENGTH) {
      throw new Error(`Message exceeds maximum length of ${LIMITS.MESSAGE_MAX_LENGTH} characters`);
    }

    // Verify user is participant
    const isParticipant = await this.chatRepo.isUserParticipant(dto.chatId, dto.senderId);
    if (!isParticipant) {
      throw new Error('User is not a participant of this chat');
    }

    // Create message
    const message = await this.messageRepo.create({
      id: uuidv4(),
      chatId: dto.chatId,
      senderId: dto.senderId,
      content: dto.content,
      contentType: dto.contentType || 'text',
      metadata: dto.metadata || {},
      replyToId: dto.replyToId,
    });

    // Get all participants except sender
    const participants = await this.chatRepo.getActiveParticipantIds(dto.chatId);
    const recipients = participants.filter(id => id !== dto.senderId);

    // Create delivery records
    await this.messageRepo.createDeliveryRecords(message.id, recipients);

    // Update chat last_message_at and increment unread counts
    await this.chatRepo.updateLastMessageAt(dto.chatId);
    await this.chatRepo.incrementUnreadCounts(dto.chatId, recipients);

    // Queue for reliable delivery
    await this.deliveryQueue.addMessage({
      messageId: message.id,
      chatId: dto.chatId,
      recipients,
    });

    // Try immediate WebSocket delivery
    this.socketManager.broadcastToChat(dto.chatId, 'message:new', {
      ...message,
      sender: await this.getUserInfo(dto.senderId),
    });

    logger.info(`Message sent: ${message.id} in chat ${dto.chatId}`);

    return message;
  }

  async editMessage(messageId: string, userId: string, newContent: string) {
    const message = await this.messageRepo.findById(messageId);
    
    if (!message) {
      throw new Error('Message not found');
    }

    if (message.senderId !== userId) {
      throw new Error('Cannot edit message from another user');
    }

    if (newContent.length > LIMITS.MESSAGE_MAX_LENGTH) {
      throw new Error('Message exceeds maximum length');
    }

    // Save edit history
    await this.messageRepo.saveEditHistory({
      messageId,
      oldContent: message.content,
      oldMetadata: message.metadata,
    });

    // Update message
    const updatedMessage = await this.messageRepo.update(messageId, {
      content: newContent,
      isEdited: true,
      editedAt: new Date(),
    });

    // Broadcast update
    this.socketManager.broadcastToChat(message.chatId, 'message:edited', {
      messageId,
      content: newContent,
      editedAt: updatedMessage.editedAt,
    });

    return updatedMessage;
  }

  async deleteMessage(messageId: string, userId: string) {
    const message = await this.messageRepo.findById(messageId);
    
    if (!message) {
      throw new Error('Message not found');
    }

    if (message.senderId !== userId) {
      throw new Error('Cannot delete message from another user');
    }

    // Soft delete
    await this.messageRepo.update(messageId, {
      isDeleted: true,
      deletedAt: new Date(),
      content: '[Deleted]',
    });

    // Broadcast deletion
    this.socketManager.broadcastToChat(message.chatId, 'message:deleted', {
      messageId,
    });
  }

  async getMessages(chatId: string, userId: string, limit: number = 50, cursor?: string) {
    // Verify user is participant
    const isParticipant = await this.chatRepo.isUserParticipant(chatId, userId);
    if (!isParticipant) {
      throw new Error('User is not a participant of this chat');
    }

    const messages = await this.messageRepo.getMessagesByChatId(chatId, limit, cursor);

    return {
      data: messages,
      nextCursor: messages.length > 0 
        ? messages[messages.length - 1].createdAt.toISOString()
        : null,
      hasMore: messages.length === limit,
    };
  }

  async markAsRead(messageId: string, userId: string) {
    const message = await this.messageRepo.findById(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    // Update delivery status
    await this.messageRepo.updateDeliveryStatus(messageId, userId, 'read');

    // Reset unread count for this chat
    await this.chatRepo.resetUnreadCount(message.chatId, userId);

    // Notify sender about read receipt
    this.socketManager.sendToUser(message.senderId, 'message:read', {
      messageId,
      chatId: message.chatId,
      readBy: userId,
      readAt: new Date(),
    });
  }

  async addReaction(messageId: string, userId: string, emoji: string) {
    const message = await this.messageRepo.findById(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    // Verify user is participant
    const isParticipant = await this.chatRepo.isUserParticipant(message.chatId, userId);
    if (!isParticipant) {
      throw new Error('User is not a participant of this chat');
    }

    const reaction = await this.messageRepo.addReaction(messageId, userId, emoji);

    // Broadcast reaction
    this.socketManager.broadcastToChat(message.chatId, 'reaction:added', {
      messageId,
      userId,
      emoji,
      reactionId: reaction.id,
    });

    return reaction;
  }

  async removeReaction(reactionId: string, userId: string) {
    const reaction = await this.messageRepo.findReactionById(reactionId);
    if (!reaction || reaction.userId !== userId) {
      throw new Error('Reaction not found or unauthorized');
    }

    await this.messageRepo.deleteReaction(reactionId);

    const message = await this.messageRepo.findById(reaction.messageId);
    
    // Broadcast reaction removal
    this.socketManager.broadcastToChat(message!.chatId, 'reaction:removed', {
      reactionId,
      messageId: reaction.messageId,
    });
  }

  private async getUserInfo(userId: string) {
    // Simplified - would normally use UserRepository
    return { id: userId, username: 'User' };
  }
}
services/storage.service.ts
TypeScript

import { 
  PutObjectCommand, 
  GetObjectCommand,
  DeleteObjectCommand 
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { s3Client, S3_CONFIG } from '../config/storage';
import { LIMITS } from '../config/constants';
import { logger } from '../utils/logger.util';

export interface UploadResult {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  originalUrl: string;
  thumbnailUrl?: string;
  mediumUrl?: string;
  width?: number;
  height?: number;
  storageKey: string;
  thumbnailKey?: string;
  mediumKey?: string;
}

export class StorageService {
  async uploadImage(
    file: Express.Multer.File,
    userId: string
  ): Promise<UploadResult> {
    // Validate file
    this.validateImage(file);

    const imageId = uuidv4();
    const timestamp = Date.now();
    const basePath = `images/${userId}/${timestamp}`;

    // Process image with sharp
    const imageBuffer = file.buffer;
    const imageMetadata = await sharp(imageBuffer).metadata();

    // Validate dimensions
    if (
      imageMetadata.width! > LIMITS.IMAGE_MAX_WIDTH ||
      imageMetadata.height! > LIMITS.IMAGE_MAX_HEIGHT
    ) {
      throw new Error('Image dimensions exceed maximum allowed size');
    }

    // Upload original
    const originalKey = `${basePath}/original.jpg`;
    const originalUrl = await this.uploadToS3(originalKey, imageBuffer, file.mimetype);

    // Create and upload thumbnail (300x300)
    const thumbnail = await sharp(imageBuffer)
      .resize(300, 300, { fit: 'cover', position: 'center' })
      .jpeg({ quality: 80 })
      .toBuffer();
    
    const thumbnailKey = `${basePath}/thumbnail.jpg`;
    const thumbnailUrl = await this.uploadToS3(thumbnailKey, thumbnail, 'image/jpeg');

    // Create and upload medium size (800x800)
    const medium = await sharp(imageBuffer)
      .resize(800, 800, { fit: 'inside' })
      .jpeg({ quality: 85 })
      .toBuffer();
    
    const mediumKey = `${basePath}/medium.jpg`;
    const mediumUrl = await this.uploadToS3(mediumKey, medium, 'image/jpeg');

    logger.info(`Image uploaded: ${imageId} by user ${userId}`);

    return {
      id: imageId,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      originalUrl,
      thumbnailUrl,
      mediumUrl,
      width: imageMetadata.width,
      height: imageMetadata.height,
      storageKey: originalKey,
      thumbnailKey,
      mediumKey,
    };
  }

  async deleteImage(storageKey: string, thumbnailKey?: string, mediumKey?: string) {
    const deletePromises = [
      this.deleteFromS3(storageKey),
    ];

    if (thumbnailKey) {
      deletePromises.push(this.deleteFromS3(thumbnailKey));
    }

    if (mediumKey) {
      deletePromises.push(this.deleteFromS3(mediumKey));
    }

    await Promise.all(deletePromises);
    logger.info(`Image deleted: ${storageKey}`);
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: S3_CONFIG.bucket,
      Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  }

  private async uploadToS3(
    key: string,
    buffer: Buffer,
    contentType: string
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: S3_CONFIG.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read', // Or use signed URLs for private access
    });

    await s3Client.send(command);

    // Return public URL
    if (S3_CONFIG.publicUrl) {
      return `${S3_CONFIG.publicUrl}/${key}`;
    }

    return `${S3_CONFIG.region}.amazonaws.com/${S3_CONFIG.bucket}/${key}`;
  }

  private async deleteFromS3(key: string) {
    const command = new DeleteObjectCommand({
      Bucket: S3_CONFIG.bucket,
      Key: key,
    });

    await s3Client.send(command);
  }

  private validateImage(file: Express.Multer.File) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error('Invalid file type. Allowed: JPEG, PNG, GIF, WebP');
    }

    if (file.size > LIMITS.IMAGE_MAX_SIZE) {
      throw new Error(`File size exceeds maximum of ${LIMITS.IMAGE_MAX_SIZE / (1024 * 1024)}MB`);
    }
  }
}
4. WebSocket Manager
websocket/socket.manager.ts
TypeScript

import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { createAdapter } from '@socket.io/redis-adapter';
import { redisPubClient, redisSubClient } from '../config/redis';
import { AuthService } from '../services/auth.service';
import { SessionService } from '../services/session.service';
import { UserRepository } from '../repositories/user.repository';
import { logger } from '../utils/logger.util';

interface SocketData {
  userId: string;
  sessionId: string;
}

export class SocketManager {
  private io: SocketServer;
  
  constructor(
    httpServer: HttpServer,
    private authService: AuthService,
    private sessionService: SessionService,
    private userRepo: UserRepository
  ) {
    this.io = new SocketServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL,
        credentials: true,
      },
      transports: ['websocket', 'polling'], // WebSocket with polling fallback
      pingTimeout: 60000,
      pingInterval: 25000,
      maxHttpBufferSize: 1e6, // 1MB
    });

    this.setupRedisAdapter();
    this.setupMiddleware();
    this.setupConnectionHandler();
  }

  private async setupRedisAdapter() {
    this.io.adapter(createAdapter(redisPubClient, redisSubClient));
    logger.info('Socket.IO Redis adapter configured');
  }

  private setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Verify token
        const { userId } = await this.authService.verifyAccessToken(token);
        
        // Store user data in socket
        socket.data = {
          userId,
          sessionId: socket.id,
        } as SocketData;

        next();
      } catch (error) {
        logger.error('Socket authentication failed', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupConnectionHandler() {
    this.io.on('connection', async (socket: Socket) => {
      const { userId, sessionId } = socket.data as SocketData;
      
      logger.info(`User connected: ${userId}, socket: ${socket.id}`);

      // Join user's personal room
      socket.join(`user:${userId}`);

      // Update user status to online
      await this.userRepo.updateStatus(userId, 'online');
      await this.sessionService.updateSocketId(sessionId, socket.id);

      // Join all user's chat rooms
      await this.joinUserChats(userId, socket);

      // Broadcast online status to contacts
      this.broadcastUserStatus(userId, 'online');

      // Setup event handlers
      this.setupEventHandlers(socket);

      // Handle disconnect
      socket.on('disconnect', async () => {
        logger.info(`User disconnected: ${userId}, socket: ${socket.id}`);
        
        // Check if user has other active sessions
        const activeSessions = await this.sessionService.getActiveUserSessions(userId);
        
        if (activeSessions.length === 0) {
          await this.userRepo.updateStatus(userId, 'offline');
          this.broadcastUserStatus(userId, 'offline');
        }
      });
    });
  }

  private setupEventHandlers(socket: Socket) {
    const { userId } = socket.data as SocketData;

    // Typing indicators
    socket.on('typing:start', (data: { chatId: string }) => {
      socket.to(`chat:${data.chatId}`).emit('typing:start', {
        chatId: data.chatId,
        userId,
      });
    });

    socket.on('typing:stop', (data: { chatId: string }) => {
      socket.to(`chat:${data.chatId}`).emit('typing:stop', {
        chatId: data.chatId,
        userId,
      });
    });

    // Online status
    socket.on('presence:update', async (data: { status: 'online' | 'away' }) => {
      await this.userRepo.updateStatus(userId, data.status);
      this.broadcastUserStatus(userId, data.status);
    });
  }

  private async joinUserChats(userId: string, socket: Socket) {
    // Get all user's active chats
    const chatIds = await this.getUserChatIds(userId);
    
    for (const chatId of chatIds) {
      socket.join(`chat:${chatId}`);
    }
  }

  // Public methods for broadcasting

  public broadcastToChat(chatId: string, event: string, data: any) {
    this.io.to(`chat:${chatId}`).emit(event, data);
  }

  public sendToUser(userId: string, event: string, data: any) {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  public broadcastUserStatus(userId: string, status: string) {
    // Broadcast to all contacts
    this.io.emit('user:status', {
      userId,
      status,
      timestamp: new Date(),
    });
  }

  public async addUserToChat(userId: string, chatId: string) {
    // Get all sockets for this user
    const sockets = await this.io.in(`user:${userId}`).fetchSockets();
    
    for (const socket of sockets) {
      socket.join(`chat:${chatId}`);
    }
  }

  public async removeUserFromChat(userId: string, chatId: string) {
    const sockets = await this.io.in(`user:${userId}`).fetchSockets();
    
    for (const socket of sockets) {
      socket.leave(`chat:${chatId}`);
    }
  }

  private async getUserChatIds(userId: string): Promise<string[]> {
    // Simplified - would use ChatRepository
    return [];
  }

  public getIO(): SocketServer {
    return this.io;
  }
}
5. Message Delivery Queue
queues/message-delivery.queue.ts
TypeScript

import { redisClient } from '../config/redis';
import { MessageRepository } from '../repositories/message.repository';
import { SocketManager } from '../websocket/socket.manager';
import { logger } from '../utils/logger.util';

interface QueuedMessage {
  messageId: string;
  chatId: string;
  recipients: string[];
  attempts: number;
  createdAt: Date;
}

export class MessageDeliveryQueue {
  private readonly STREAM_KEY = 'message-delivery-stream';
  private readonly CONSUMER_GROUP = 'message-delivery-workers';
  private readonly CONSUMER_NAME = `worker-${process.pid}`;
  private isProcessing = false;

  constructor(
    private messageRepo: MessageRepository,
    private socketManager: SocketManager
  ) {}

  async initialize() {
    try {
      // Create consumer group if it doesn't exist
      await redisClient.xGroupCreate(
        this.STREAM_KEY,
        this.CONSUMER_GROUP,
        '0',
        { MKSTREAM: true }
      );
    } catch (error: any) {
      if (!error.message.includes('BUSYGROUP')) {
        throw error;
      }
    }
    logger.info('Message delivery queue initialized');
  }

  async addMessage(data: { messageId: string; chatId: string; recipients: string[] }) {
    const message: QueuedMessage = {
      ...data,
      attempts: 0,
      createdAt: new Date(),
    };

    await redisClient.xAdd(
      this.STREAM_KEY,
      '*',
      { data: JSON.stringify(message) }
    );

    logger.debug(`Message queued for delivery: ${data.messageId}`);
  }

  async startProcessing() {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    logger.info('Message delivery queue processing started');

    while (this.isProcessing) {
      try {
        await this.processMessages();
        await this.processPendingMessages();
        await this.sleep(1000); // Check every second
      } catch (error) {
        logger.error('Error in message delivery queue', error);
        await this.sleep(5000); // Wait longer on error
      }
    }
  }

  stopProcessing() {
    this.isProcessing = false;
    logger.info('Message delivery queue processing stopped');
  }

  private async processMessages() {
    const messages = await redisClient.xReadGroup(
      this.CONSUMER_GROUP,
      this.CONSUMER_NAME,
      [{ key: this.STREAM_KEY, id: '>' }],
      { COUNT: 10, BLOCK: 1000 }
    );

    if (!messages || messages.length === 0) {
      return;
    }

    for (const [stream, messageList] of messages) {
      for (const { id, message } of messageList) {
        try {
          const data: QueuedMessage = JSON.parse(message.data);
          await this.deliverMessage(data);
          
          // Acknowledge message
          await redisClient.xAck(this.STREAM_KEY, this.CONSUMER_GROUP, id);
        } catch (error) {
          logger.error(`Failed to process message ${id}`, error);
        }
      }
    }
  }

  private async processPendingMessages() {
    // Process messages that weren't acknowledged (e.g., if worker crashed)
    const pending = await redisClient.xPending(
      this.STREAM_KEY,
      this.CONSUMER_GROUP,
      '-',
      '+',
      10
    );

    if (!pending || pending.length === 0) {
      return;
    }

    for (const item of pending) {
      if (item.millisecondsSinceLastDelivery > 60000) { // 1 minute
        // Claim the message
        const claimed = await redisClient.xClaim(
          this.STREAM_KEY,
          this.CONSUMER_GROUP,
          this.CONSUMER_NAME,
          60000,
          [item.id]
        );

        for (const { id, message } of claimed) {
          try {
            const data: QueuedMessage = JSON.parse(message.data);
            data.attempts++;
            
            if (data.attempts > 5) {
              logger.error(`Message ${data.messageId} failed after 5 attempts`);
              await redisClient.xAck(this.STREAM_KEY, this.CONSUMER_GROUP, id);
              continue;
            }

            await this.deliverMessage(data);
            await redisClient.xAck(this.STREAM_KEY, this.CONSUMER_GROUP, id);
          } catch (error) {
            logger.error(`Failed to process pending message ${id}`, error);
          }
        }
      }
    }
  }

  private async deliverMessage(data: QueuedMessage) {
    const message = await this.messageRepo.findById(data.messageId);
    if (!message) {
      logger.warn(`Message not found: ${data.messageId}`);
      return;
    }

    for (const recipientId of data.recipients) {
      try {
        // Check delivery status
        const deliveryStatus = await this.messageRepo.getDeliveryStatus(
          data.messageId,
          recipientId
        );

        if (deliveryStatus?.status === 'delivered' || deliveryStatus?.status === 'read') {
          continue; // Already delivered
        }

        // Check if user is online
        const isOnline = await this.isUserOnline(recipientId);
        
        if (isOnline) {
          // Send via WebSocket
          this.socketManager.sendToUser(recipientId, 'message:new', message);
          
          // Mark as delivered
          await this.messageRepo.updateDeliveryStatus(
            data.messageId,
            recipientId,
            'delivered'
          );
        }
      } catch (error) {
        logger.error(`Failed to deliver message to user ${recipientId}`, error);
      }
    }
  }

  private async isUserOnline(userId: string): Promise<boolean> {
    // Check if user has active sessions
    const sessions = await redisClient.keys(`session:${userId}:*`);
    return sessions.length > 0;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

6. Repositories
repositories/message.repository.ts
TypeScript

import { pool, readPool } from '../config/database';
import { logger } from '../utils/logger.util';

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
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
    if (userIds.length === 0) return;

    const values = userIds.map((userId, idx) => {
      const base = idx * 3;
      return `($${base + 1}, $${base + 2}, $${base + 3})`;
    }).join(', ');

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

    await pool.query(query, [
      data.messageId,
      data.oldContent,
      JSON.stringify(data.oldMetadata),
    ]);
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
repositories/chat.repository.ts
TypeScript

import { pool, readPool } from '../config/database';
import { CHAT_TYPE, PARTICIPANT_ROLE } from '../config/constants';

export interface Chat {
  id: string;
  type: typeof CHAT_TYPE[keyof typeof CHAT_TYPE];
  name?: string;
  slug?: string;
  avatarUrl?: string;
  ownerId?: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt?: Date;
  isDeleted: boolean;
}

export class ChatRepository {
  async create(data: Partial<Chat>): Promise<Chat> {
    const query = `
      INSERT INTO chats (id, type, name, slug, avatar_url, owner_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const values = [
      data.id,
      data.type,
      data.name || null,
      data.slug || null,
      data.avatarUrl || null,
      data.ownerId || null,
    ];

    const result = await pool.query(query, values);
    return this.mapRow(result.rows[0]);
  }

  async findById(id: string): Promise<Chat | null> {
    const query = `
      SELECT * FROM chats 
      WHERE id = $1 AND is_deleted = FALSE
    `;
    
    const result = await readPool.query(query, [id]);
    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  async findBySlug(slug: string): Promise<Chat | null> {
    const query = `
      SELECT * FROM chats 
      WHERE slug = $1 AND is_deleted = FALSE
    `;
    
    const result = await readPool.query(query, [slug]);
    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  async findDirectChat(user1Id: string, user2Id: string): Promise<Chat | null> {
    const query = `
      SELECT c.* FROM chats c
      WHERE c.type = 'direct'
        AND c.is_deleted = FALSE
        AND EXISTS (
          SELECT 1 FROM chat_participants cp1 
          WHERE cp1.chat_id = c.id AND cp1.user_id = $1 AND cp1.left_at IS NULL
        )
        AND EXISTS (
          SELECT 1 FROM chat_participants cp2 
          WHERE cp2.chat_id = c.id AND cp2.user_id = $2 AND cp2.left_at IS NULL
        )
      LIMIT 1
    `;

    const result = await readPool.query(query, [user1Id, user2Id]);
    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  async getUserChats(userId: string): Promise<any[]> {
    const query = `
      SELECT 
        c.*,
        cp.unread_count,
        cp.last_read_message_id,
        (
          SELECT json_build_object(
            'id', m.id,
            'content', m.content,
            'createdAt', m.created_at,
            'senderId', m.sender_id,
            'senderUsername', u.username
          )
          FROM messages m
          JOIN users u ON m.sender_id = u.id
          WHERE m.chat_id = c.id AND m.is_deleted = FALSE
          ORDER BY m.created_at DESC
          LIMIT 1
        ) as last_message
      FROM chats c
      JOIN chat_participants cp ON c.id = cp.chat_id
      WHERE cp.user_id = $1 
        AND cp.left_at IS NULL
        AND c.is_deleted = FALSE
      ORDER BY c.last_message_at DESC NULLS LAST
    `;

    const result = await readPool.query(query, [userId]);
    return result.rows;
  }

  async addParticipant(
    chatId: string,
    userId: string,
    role: string = PARTICIPANT_ROLE.MEMBER
  ): Promise<void> {
    const query = `
      INSERT INTO chat_participants (chat_id, user_id, role, joined_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (chat_id, user_id) 
      DO UPDATE SET left_at = NULL
    `;

    await pool.query(query, [chatId, userId, role]);
  }

  async removeParticipant(chatId: string, userId: string): Promise<void> {
    const query = `
      UPDATE chat_participants
      SET left_at = CURRENT_TIMESTAMP
      WHERE chat_id = $1 AND user_id = $2
    `;

    await pool.query(query, [chatId, userId]);
  }

  async getActiveParticipantIds(chatId: string): Promise<string[]> {
    const query = `
      SELECT user_id FROM chat_participants
      WHERE chat_id = $1 AND left_at IS NULL
    `;

    const result = await readPool.query(query, [chatId]);
    return result.rows.map(row => row.user_id);
  }

  async countActiveParticipants(chatId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count FROM chat_participants
      WHERE chat_id = $1 AND left_at IS NULL
    `;

    const result = await readPool.query(query, [chatId]);
    return parseInt(result.rows[0].count);
  }

  async isUserParticipant(chatId: string, userId: string): Promise<boolean> {
    const query = `
      SELECT 1 FROM chat_participants
      WHERE chat_id = $1 AND user_id = $2 AND left_at IS NULL
      LIMIT 1
    `;

    const result = await readPool.query(query, [chatId, userId]);
    return result.rows.length > 0;
  }

  async updateLastMessageAt(chatId: string): Promise<void> {
    const query = `
      UPDATE chats
      SET last_message_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    await pool.query(query, [chatId]);
  }

  async incrementUnreadCounts(chatId: string, userIds: string[]): Promise<void> {
    if (userIds.length === 0) return;

    const query = `
      UPDATE chat_participants
      SET unread_count = unread_count + 1
      WHERE chat_id = $1 AND user_id = ANY($2)
    `;

    await pool.query(query, [chatId, userIds]);
  }

  async resetUnreadCount(chatId: string, userId: string): Promise<void> {
    const query = `
      UPDATE chat_participants
      SET unread_count = 0
      WHERE chat_id = $1 AND user_id = $2
    `;

    await pool.query(query, [chatId, userId]);
  }

  async update(chatId: string, data: Partial<Chat>): Promise<Chat> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(data.name);
    }

    if (data.avatarUrl !== undefined) {
      fields.push(`avatar_url = $${paramCount++}`);
      values.push(data.avatarUrl);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(chatId);

    const query = `
      UPDATE chats 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return this.mapRow(result.rows[0]);
  }

  async delete(chatId: string): Promise<void> {
    const query = `
      UPDATE chats
      SET is_deleted = TRUE
      WHERE id = $1
    `;

    await pool.query(query, [chatId]);
  }

  private mapRow(row: any): Chat {
    return {
      id: row.id,
      type: row.type,
      name: row.name,
      slug: row.slug,
      avatarUrl: row.avatar_url,
      ownerId: row.owner_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastMessageAt: row.last_message_at,
      isDeleted: row.is_deleted,
    };
  }
}
repositories/user.repository.ts
TypeScript

import { pool, readPool } from '../config/database';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  displayName?: string;
  avatarUrl?: string;
  status: string;
  lastSeen?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class UserRepository {
  async create(data: Partial<User>): Promise<User> {
    const query = `
      INSERT INTO users (username, password_hash, display_name, created_at, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const values = [data.username, data.passwordHash, data.displayName];
    const result = await pool.query(query, values);
    return this.mapRow(result.rows[0]);
  }

  async findById(id: string): Promise<User | null> {
    const query = `SELECT * FROM users WHERE id = $1`;
    const result = await readPool.query(query, [id]);
    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const query = `SELECT * FROM users WHERE username = $1`;
    const result = await readPool.query(query, [username]);
    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  async updateStatus(userId: string, status: string): Promise<void> {
    const query = `
      UPDATE users 
      SET status = $1, last_seen = CURRENT_TIMESTAMP
      WHERE id = $2
    `;
    await pool.query(query, [status, userId]);
  }

  async updateLastSeen(userId: string): Promise<void> {
    const query = `
      UPDATE users 
      SET last_seen = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await pool.query(query, [userId]);
  }

  async update(userId: string, data: Partial<User>): Promise<User> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.displayName !== undefined) {
      fields.push(`display_name = $${paramCount++}`);
      values.push(data.displayName);
    }

    if (data.avatarUrl !== undefined) {
      fields.push(`avatar_url = $${paramCount++}`);
      values.push(data.avatarUrl);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const query = `
      UPDATE users 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return this.mapRow(result.rows[0]);
  }

  async search(query: string, limit: number = 20): Promise<User[]> {
    const sql = `
      SELECT id, username, display_name, avatar_url, status
      FROM users
      WHERE username ILIKE $1
      ORDER BY username
      LIMIT $2
    `;

    const result = await readPool.query(sql, [`%${query}%`, limit]);
    return result.rows.map(row => this.mapRow(row));
  }

  private mapRow(row: any): User {
    return {
      id: row.id,
      username: row.username,
      passwordHash: row.password_hash,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      status: row.status,
      lastSeen: row.last_seen,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
7. Controllers
controllers/chat.controller.ts
TypeScript

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ChatService } from '../services/chat.service';
import { LIMITS } from '../config/constants';
import { logger } from '../utils/logger.util';

export class ChatController {
  constructor(private chatService: ChatService) {}

  getUserChats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const chats = await this.chatService.getUserChats(userId);
      
      res.json({ chats });
    } catch (error) {
      next(error);
    }
  };

  getChatById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { chatId } = req.params;
      const userId = req.user!.userId;

      const chat = await this.chatService.getChatById(chatId, userId);
      
      res.json({ chat });
    } catch (error) {
      next(error);
    }
  };

  getChatBySlug = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;
      const userId = req.user!.userId;

      const chat = await this.chatService.getChatBySlug(slug, userId);
      
      res.json({ chat });
    } catch (error) {
      next(error);
    }
  };

  createDirectChat = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { contactId } = req.body;

      const chat = await this.chatService.createDirectChat(userId, contactId);
      
      res.status(201).json({ chat });
    } catch (error) {
      next(error);
    }
  };

  createGroupChat = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { name, participantIds } = req.body;

      if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: 'Group name is required' });
      }

      if (!participantIds || participantIds.length === 0) {
        return res.status(400).json({ error: 'At least one participant is required' });
      }

      if (participantIds.length > LIMITS.GROUP_MAX_PARTICIPANTS - 1) {
        return res.status(400).json({ 
          error: `Maximum ${LIMITS.GROUP_MAX_PARTICIPANTS} participants allowed` 
        });
      }

      const chat = await this.chatService.createGroupChat(userId, name, participantIds);
      
      res.status(201).json({ chat });
    } catch (error) {
      next(error);
    }
  };

  updateChat = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { chatId } = req.params;
      const userId = req.user!.userId;
      const { name, avatarUrl } = req.body;

      const chat = await this.chatService.updateChat(chatId, userId, { name, avatarUrl });
      
      res.json({ chat });
    } catch (error) {
      next(error);
    }
  };

  addParticipants = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { chatId } = req.params;
      const userId = req.user!.userId;
      const { participantIds } = req.body;

      if (!participantIds || participantIds.length === 0) {
        return res.status(400).json({ error: 'Participant IDs required' });
      }

      await this.chatService.addParticipants(chatId, userId, participantIds);
      
      res.json({ message: 'Participants added successfully' });
    } catch (error) {
      next(error);
    }
  };

  removeParticipant = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { chatId, userId: targetUserId } = req.params;
      const userId = req.user!.userId;

      await this.chatService.removeParticipant(chatId, userId, targetUserId);
      
      res.json({ message: 'Participant removed successfully' });
    } catch (error) {
      next(error);
    }
  };

  leaveChat = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { chatId } = req.params;
      const userId = req.user!.userId;

      await this.chatService.leaveChat(chatId, userId);
      
      res.json({ message: 'Left chat successfully' });
    } catch (error) {
      next(error);
    }
  };

  deleteChat = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { chatId } = req.params;
      const userId = req.user!.userId;

      await this.chatService.deleteChat(chatId, userId);
      
      res.json({ message: 'Chat deleted successfully' });
    } catch (error) {
      next(error);
    }
  };
}
8. Middleware
middleware/security.middleware.ts
TypeScript

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import sanitizeHtml from 'sanitize-html';
import { LIMITS } from '../config/constants';

// Helmet security headers
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.S3_PUBLIC_URL || ""],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

// Rate limiting
export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later',
  skipSuccessfulRequests: true,
});

export const messageRateLimit = rateLimit({
  windowMs: 1000, // 1 second
  max: LIMITS.MESSAGES_PER_SECOND_PER_USER,
  keyGenerator: (req) => req.user?.userId || req.ip,
  message: 'Too many messages, slow down',
});

// Sanitize HTML content
export const sanitizeContent = (content: string): string => {
  return sanitizeHtml(content, {
    allowedTags: ['b', 'i', 'em', 'strong', 'u'],
    allowedAttributes: {},
    allowedIframeHostnames: [],
  });
};

// File upload validation
export const validateImageUpload = (req: any, res: any, next: any) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({ 
      error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP' 
    });
  }

  if (req.file.size > LIMITS.IMAGE_MAX_SIZE) {
    return res.status(400).json({ 
      error: `File too large. Maximum size: ${LIMITS.IMAGE_MAX_SIZE / (1024 * 1024)}MB` 
    });
  }

  next();
};
middleware/auth.middleware.ts
TypeScript

import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
      };
    }
  }
}

export class AuthMiddleware {
  constructor(private authService: AuthService) {}

  authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const token = authHeader.substring(7);
      const payload = await this.authService.verifyAccessToken(token);

      req.user = { userId: payload.userId };
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
}
9. Main Application Setup
app.ts
TypeScript

import express from 'express';
import cors from 'cors';
import { securityHeaders, apiRateLimit } from './middleware/security.middleware';
import { errorHandler } from './middleware/error.middleware';
import { authRoutes } from './routes/auth.routes';
import { userRoutes } from './routes/user.routes';
import { chatRoutes } from './routes/chat.routes';
import { messageRoutes } from './routes/message.routes';
import { contactRoutes } from './routes/contact.routes';
import { healthRoutes } from './routes/health.routes';
import { config } from './config/env';
import { logger } from './utils/logger.util';

export function createApp() {
  const app = express();

  // Security middleware
  app.use(securityHeaders);
  app.use(cors({
    origin: config.FRONTEND_URL,
    credentials: true,
  }));

  // Body parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Rate limiting
  app.use('/api/', apiRateLimit);

  // Health checks (no auth required)
  app.use('/health', healthRoutes);

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/chats', chatRoutes);
  app.use('/api/messages', messageRoutes);
  app.use('/api/contacts', contactRoutes);

  // Error handler (must be last)
  app.use(errorHandler);

  logger.info('Express app initialized');

  return app;
}
server.ts
TypeScript

import http from 'http';
import { createApp } from './app';
import { config } from './config/env';
import { testConnection, closeConnections } from './config/database';
import { connectRedis, closeRedis } from './config/redis';
import { SocketManager } from './websocket/socket.manager';
import { MessageDeliveryQueue } from './queues/message-delivery.queue';
import { logger } from './utils/logger.util';

// Import services and repositories
import { UserRepository } from './repositories/user.repository';
import { ChatRepository } from './repositories/chat.repository';
import { MessageRepository } from './repositories/message.repository';
import { AuthService } from './services/auth.service';
import { SessionService } from './services/session.service';
import { MessageService } from './services/message.service';

let server: http.Server;
let socketManager: SocketManager;
let messageQueue: MessageDeliveryQueue;
let isShuttingDown = false;

async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }

    // Connect to Redis
    await connectRedis();

    // Initialize repositories
    const userRepo = new UserRepository();
    const chatRepo = new ChatRepository();
    const messageRepo = new MessageRepository();

    // Initialize services
    const sessionService = new SessionService();
    const authService = new AuthService(userRepo, sessionService);

    // Create Express app
    const app = createApp();

    // Create HTTP server
    server = http.createServer(app);

    // Initialize WebSocket manager
    socketManager = new SocketManager(
      server,
      authService,
      sessionService,
      userRepo
    );

    // Initialize message delivery queue
    messageQueue = new MessageDeliveryQueue(
      messageRepo,
      socketManager
    );
    await messageQueue.initialize();
    messageQueue.startProcessing();

    // Start server
    const port = parseInt(config.PORT);
    server.listen(port, () => {
      logger.info(`🚀 Server running on port ${port}`);
      logger.info(`📡 WebSocket ready for connections`);
      logger.info(`🌍 Environment: ${config.NODE_ENV}`);
    });

    // Graceful shutdown handlers
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

async function gracefulShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`${signal} received, starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(() => {
    logger.info('HTTP server closed');
  });

  // Notify all connected clients
  if (socketManager) {
    socketManager.getIO().emit('server:shutdown', {
      message: 'Server is shutting down, please reconnect in a moment',
    });
  }

  // Stop message queue processing
  if (messageQueue) {
    messageQueue.stopProcessing();
  }

  // Wait a bit for in-flight requests
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Close database connections
  await closeConnections();

  // Close Redis connections
  await closeRedis();

  logger.info('Graceful shutdown completed');
  process.exit(0);
}

// Start the server
startServer();
10. Frontend Implementation
src/services/websocket.service.ts
TypeScript

import { io, Socket } from 'socket.io-client';
import { config } from '../config';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string) {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(config.WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
    });

    this.socket.on('reconnect_attempt', (attempt) => {
      console.log(`Reconnection attempt ${attempt}/${this.maxReconnectAttempts}`);
    });

    this.socket.on('server:shutdown', (data) => {
      console.warn('Server shutdown:', data.message);
      // Show notification to user
    });
  }

  on(event: string, callback: (data: any) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (data: any) => void) {
    this.socket?.off(event, callback);
  }

  emit(event: string, data: any) {
    this.socket?.emit(event, data);
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const wsService = new WebSocketService();
src/hooks/useWebSocket.ts
TypeScript

import { useEffect, useCallback } from 'react';
import { wsService } from '../services/websocket.service';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';

export const useWebSocket = () => {
  const { token, isAuthenticated } = useAuthStore();
  const { addMessage, updateMessageStatus, addReaction } = useChatStore();

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    // Connect to WebSocket
    wsService.connect(token);

    // Listen for new messages
    wsService.on('message:new', (message) => {
      addMessage(message);
    });

    // Listen for message read receipts
    wsService.on('message:read', (data) => {
      updateMessageStatus(data.messageId, 'read', data.readBy);
    });

    // Listen for message edits
    wsService.on('message:edited', (data) => {
      // Update message in store
    });

    // Listen for message deletions
    wsService.on('message:deleted', (data) => {
      // Remove message from store
    });

    // Listen for reactions
    wsService.on('reaction:added', (data) => {
      addReaction(data.messageId, data.emoji, data.userId);
    });

    // Listen for typing indicators
    wsService.on('typing:start', (data) => {
      // Show typing indicator
    });

    wsService.on('typing:stop', (data) => {
      // Hide typing indicator
    });

    // Listen for user status changes
    wsService.on('user:status', (data) => {
      // Update user status in store
    });

    return () => {
      wsService.disconnect();
    };
  }, [isAuthenticated, token]);

  const sendMessage = useCallback((chatId: string, content: string) => {
    wsService.emit('message:send', { chatId, content });
  }, []);

  const startTyping = useCallback((chatId: string) => {
    wsService.emit('typing:start', { chatId });
  }, []);

  const stopTyping = useCallback((chatId: string) => {
    wsService.emit('typing:stop', { chatId });
  }, []);

  return {
    sendMessage,
    startTyping,
    stopTyping,
    isConnected: wsService.isConnected(),
  };
};

11. Frontend Store (Zustand)
src/store/chatStore.ts
TypeScript

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  contentType: 'text' | 'image' | 'system';
  metadata?: any;
  createdAt: string;
  isEdited: boolean;
  reactions?: Reaction[];
}

interface Reaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
}

interface Chat {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  slug?: string;
  avatarUrl?: string;
  participants: any[];
  lastMessage?: Message;
  unreadCount: number;
  lastMessageAt?: string;
}

interface ChatState {
  chats: Chat[];
  messages: Record<string, Message[]>;
  activeChat: string | null;
  typingUsers: Record<string, string[]>;
  
  // Actions
  setChats: (chats: Chat[]) => void;
  addChat: (chat: Chat) => void;
  setActiveChat: (chatId: string | null) => void;
  
  setMessages: (chatId: string, messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (messageId: string) => void;
  
  addReaction: (messageId: string, emoji: string, userId: string) => void;
  removeReaction: (messageId: string, reactionId: string) => void;
  
  updateMessageStatus: (messageId: string, status: string, userId: string) => void;
  
  setTyping: (chatId: string, userId: string, isTyping: boolean) => void;
  
  incrementUnread: (chatId: string) => void;
  resetUnread: (chatId: string) => void;
}

export const useChatStore = create<ChatState>()(
  devtools(
    persist(
      (set, get) => ({
        chats: [],
        messages: {},
        activeChat: null,
        typingUsers: {},

        setChats: (chats) => set({ chats }),

        addChat: (chat) =>
          set((state) => ({
            chats: [chat, ...state.chats],
          })),

        setActiveChat: (chatId) => set({ activeChat: chatId }),

        setMessages: (chatId, messages) =>
          set((state) => ({
            messages: {
              ...state.messages,
              [chatId]: messages,
            },
          })),

        addMessage: (message) =>
          set((state) => {
            const chatMessages = state.messages[message.chatId] || [];
            
            // Check if message already exists
            if (chatMessages.some(m => m.id === message.id)) {
              return state;
            }

            return {
              messages: {
                ...state.messages,
                [message.chatId]: [...chatMessages, message],
              },
              chats: state.chats.map(chat =>
                chat.id === message.chatId
                  ? {
                      ...chat,
                      lastMessage: message,
                      lastMessageAt: message.createdAt,
                    }
                  : chat
              ),
            };
          }),

        updateMessage: (messageId, updates) =>
          set((state) => {
            const newMessages = { ...state.messages };
            
            for (const chatId in newMessages) {
              newMessages[chatId] = newMessages[chatId].map(msg =>
                msg.id === messageId ? { ...msg, ...updates } : msg
              );
            }

            return { messages: newMessages };
          }),

        deleteMessage: (messageId) =>
          set((state) => {
            const newMessages = { ...state.messages };
            
            for (const chatId in newMessages) {
              newMessages[chatId] = newMessages[chatId].filter(
                msg => msg.id !== messageId
              );
            }

            return { messages: newMessages };
          }),

        addReaction: (messageId, emoji, userId) =>
          set((state) => {
            const newMessages = { ...state.messages };
            
            for (const chatId in newMessages) {
              newMessages[chatId] = newMessages[chatId].map(msg => {
                if (msg.id === messageId) {
                  const reactions = msg.reactions || [];
                  return {
                    ...msg,
                    reactions: [
                      ...reactions,
                      { id: Date.now().toString(), messageId, userId, emoji },
                    ],
                  };
                }
                return msg;
              });
            }

            return { messages: newMessages };
          }),

        removeReaction: (messageId, reactionId) =>
          set((state) => {
            const newMessages = { ...state.messages };
            
            for (const chatId in newMessages) {
              newMessages[chatId] = newMessages[chatId].map(msg => {
                if (msg.id === messageId) {
                  return {
                    ...msg,
                    reactions: (msg.reactions || []).filter(r => r.id !== reactionId),
                  };
                }
                return msg;
              });
            }

            return { messages: newMessages };
          }),

        updateMessageStatus: (messageId, status, userId) =>
          set((state) => {
            // Update delivery status metadata
            return state;
          }),

        setTyping: (chatId, userId, isTyping) =>
          set((state) => {
            const typingUsers = state.typingUsers[chatId] || [];
            
            return {
              typingUsers: {
                ...state.typingUsers,
                [chatId]: isTyping
                  ? [...typingUsers.filter(id => id !== userId), userId]
                  : typingUsers.filter(id => id !== userId),
              },
            };
          }),

        incrementUnread: (chatId) =>
          set((state) => ({
            chats: state.chats.map(chat =>
              chat.id === chatId
                ? { ...chat, unreadCount: chat.unreadCount + 1 }
                : chat
            ),
          })),

        resetUnread: (chatId) =>
          set((state) => ({
            chats: state.chats.map(chat =>
              chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
            ),
          })),
      }),
      {
        name: 'chat-storage',
        partialize: (state) => ({
          chats: state.chats,
          activeChat: state.activeChat,
        }),
      }
    )
  )
);
src/store/authStore.ts
TypeScript

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  
  setAuth: (user: User, token: string, refreshToken: string) => void;
  clearAuth: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, token, refreshToken) =>
        set({
          user,
          token,
          refreshToken,
          isAuthenticated: true,
        }),

      clearAuth: () =>
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: 'auth-storage',
    }
  )
);
12. Frontend Components
src/components/chat/ChatWindow.tsx
TypeScript

import React, { useEffect, useRef } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ChatHeader } from './ChatHeader';
import { TypingIndicator } from './TypingIndicator';
import { useChatStore } from '../../store/chatStore';
import { useWebSocket } from '../../hooks/useWebSocket';
import { apiService } from '../../services/api.service';

export const ChatWindow: React.FC = () => {
  const { activeChat, messages, typingUsers } = useChatStore();
  const { startTyping, stopTyping } = useWebSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const currentMessages = activeChat ? messages[activeChat] || [] : [];
  const currentTypingUsers = activeChat ? typingUsers[activeChat] || [] : [];

  useEffect(() => {
    if (activeChat) {
      loadMessages(activeChat);
    }
  }, [activeChat]);

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);

  const loadMessages = async (chatId: string) => {
    try {
      const response = await apiService.getMessages(chatId);
      useChatStore.getState().setMessages(chatId, response.data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleSendMessage = async (content: string, files?: File[]) => {
    if (!activeChat) return;

    try {
      // Upload images first if any
      let metadata = {};
      
      if (files && files.length > 0) {
        const uploadedImages = await Promise.all(
          files.map(file => apiService.uploadImage(file))
        );
        
        metadata = {
          images: uploadedImages.map(img => ({
            url: img.mediumUrl,
            thumbnailUrl: img.thumbnailUrl,
            originalUrl: img.originalUrl,
          })),
        };
      }

      await apiService.sendMessage(activeChat, {
        content,
        contentType: files && files.length > 0 ? 'image' : 'text',
        metadata,
      });

      stopTyping(activeChat);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleTyping = () => {
    if (!activeChat) return;

    startTyping(activeChat);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(activeChat);
    }, 3000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!activeChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <p className="text-xl">Select a chat to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <ChatHeader chatId={activeChat} />
      
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <MessageList messages={currentMessages} />
        <div ref={messagesEndRef} />
      </div>

      {currentTypingUsers.length > 0 && (
        <TypingIndicator users={currentTypingUsers} />
      )}

      <MessageInput 
        onSend={handleSendMessage}
        onTyping={handleTyping}
      />
    </div>
  );
};
src/components/chat/MessageInput.tsx
TypeScript

import React, { useState, useRef, KeyboardEvent } from 'react';
import { 
  PaperAirplaneIcon, 
  PhotoIcon,
  FaceSmileIcon,
} from '@heroicons/react/24/outline';

interface MessageInputProps {
  onSend: (content: string, files?: File[]) => void;
  onTyping: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSend, onTyping }) => {
  const [content, setContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!content.trim() && selectedFiles.length === 0) return;

    let formattedContent = content;

    // Apply formatting
    if (isBold) {
      formattedContent = `<strong>${formattedContent}</strong>`;
    }
    if (isItalic) {
      formattedContent = `<em>${formattedContent}</em>`;
    }

    onSend(formattedContent, selectedFiles);
    setContent('');
    setSelectedFiles([]);
    setIsBold(false);
    setIsItalic(false);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else {
      onTyping();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 5) {
      alert('Maximum 5 images allowed');
      return;
    }

    setSelectedFiles(imageFiles);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index));
  };

  return (
    <div className="border-t bg-white p-4">
      {/* Selected files preview */}
      {selectedFiles.length > 0 && (
        <div className="flex gap-2 mb-2 overflow-x-auto">
          {selectedFiles.map((file, index) => (
            <div key={index} className="relative">
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                className="h-20 w-20 object-cover rounded"
              />
              <button
                onClick={() => removeFile(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Formatting buttons */}
        <div className="flex gap-1">
          <button
            onClick={() => setIsBold(!isBold)}
            className={`p-2 rounded hover:bg-gray-100 ${isBold ? 'bg-gray-200' : ''}`}
            title="Bold"
          >
            <strong>B</strong>
          </button>
          <button
            onClick={() => setIsItalic(!isItalic)}
            className={`p-2 rounded hover:bg-gray-100 ${isItalic ? 'bg-gray-200' : ''}`}
            title="Italic"
          >
            <em>I</em>
          </button>
        </div>

        {/* Text input */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="flex-1 resize-none border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={1}
          style={{ maxHeight: '120px' }}
        />

        {/* Image upload */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-lg hover:bg-gray-100"
          title="Attach image"
        >
          <PhotoIcon className="w-6 h-6 text-gray-600" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!content.trim() && selectedFiles.length === 0}
          className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          <PaperAirplaneIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
src/components/chat/Message.tsx
TypeScript

import React, { useState } from 'react';
import { format } from 'date-fns';
import { useAuthStore } from '../../store/authStore';
import { apiService } from '../../services/api.service';

interface MessageProps {
  message: {
    id: string;
    senderId: string;
    content: string;
    contentType: string;
    metadata?: any;
    createdAt: string;
    isEdited: boolean;
    reactions?: Array<{ id: string; emoji: string; userId: string }>;
  };
  senderName: string;
  senderAvatar?: string;
}

export const Message: React.FC<MessageProps> = ({ 
  message, 
  senderName, 
  senderAvatar 
}) => {
  const { user } = useAuthStore();
  const [showReactions, setShowReactions] = useState(false);
  const isOwnMessage = message.senderId === user?.id;

  const handleAddReaction = async (emoji: string) => {
    try {
      await apiService.addReaction(message.id, emoji);
      setShowReactions(false);
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  const renderContent = () => {
    if (message.contentType === 'image' && message.metadata?.images) {
      return (
        <div className="space-y-2">
          {message.content && (
            <div dangerouslySetInnerHTML={{ __html: message.content }} />
          )}
          <div className="grid grid-cols-2 gap-2">
            {message.metadata.images.map((img: any, idx: number) => (
              <img
                key={idx}
                src={img.url}
                alt="Uploaded"
                className="rounded cursor-pointer hover:opacity-90"
                onClick={() => window.open(img.originalUrl, '_blank')}
              />
            ))}
          </div>
        </div>
      );
    }

    return (
      <div 
        dangerouslySetInnerHTML={{ __html: message.content }}
        className="break-words"
      />
    );
  };

  const groupedReactions = message.reactions?.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, typeof message.reactions>);

  return (
    <div className={`flex gap-2 mb-4 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        {senderAvatar ? (
          <img
            src={senderAvatar}
            alt={senderName}
            className="w-10 h-10 rounded-full"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
            <span className="text-sm font-medium">
              {senderName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Message bubble */}
      <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-sm font-medium">{senderName}</span>
          <span className="text-xs text-gray-500">
            {format(new Date(message.createdAt), 'HH:mm')}
          </span>
          {message.isEdited && (
            <span className="text-xs text-gray-400">(edited)</span>
          )}
        </div>

        <div
          className={`relative group max-w-md px-4 py-2 rounded-lg ${
            isOwnMessage
              ? 'bg-blue-500 text-white'
              : 'bg-white border border-gray-200'
          }`}
          onMouseEnter={() => setShowReactions(true)}
          onMouseLeave={() => setShowReactions(false)}
        >
          {renderContent()}

          {/* Reaction picker */}
          {showReactions && (
            <div className="absolute -top-8 left-0 bg-white border rounded-lg shadow-lg p-2 flex gap-1">
              {['👍', '❤️', '😂', '😮', '😢', '🎉'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleAddReaction(emoji)}
                  className="hover:bg-gray-100 rounded p-1 text-lg"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reactions display */}
        {groupedReactions && Object.keys(groupedReactions).length > 0 && (
          <div className="flex gap-1 mt-1">
            {Object.entries(groupedReactions).map(([emoji, reactions]) => (
              <div
                key={emoji}
                className="bg-gray-100 rounded-full px-2 py-1 text-xs flex items-center gap-1"
                title={reactions.map(r => r.userId).join(', ')}
              >
                <span>{emoji}</span>
                <span>{reactions.length}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
13. Docker Configuration
backend/Dockerfile
Dockerfile

# Multi-stage build for production
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src
COPY prisma ./prisma

# Build TypeScript
RUN npm run build

# Generate Prisma client
RUN npx prisma generate

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 3000

CMD ["node", "dist/server.js"]
frontend/Dockerfile
Dockerfile

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
frontend/nginx.conf
nginx

server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Enable gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
docker-compose.yml
YAML

version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: chat-postgres
    environment:
      POSTGRES_DB: chatapp
      POSTGRES_USER: chatuser
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-chatpass}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/migrations:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U chatuser -d chatapp"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - chat-network

  # Redis
  redis:
    image: redis:7-alpine
    container_name: chat-redis
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD:-redispass}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - chat-network

  # MinIO (S3-compatible storage)
  minio:
    image: minio/minio:latest
    container_name: chat-minio
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER:-minioadmin}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD:-minioadmin}
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"
      - "9001:9001"
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - chat-network

  # MinIO Client - Create bucket
  minio-init:
    image: minio/mc:latest
    depends_on:
      - minio
    entrypoint: >
      /bin/sh -c "
      sleep 5;
      /usr/bin/mc alias set myminio http://minio:9000 minioadmin minioadmin;
      /usr/bin/mc mb myminio/chat-images --ignore-existing;
      /usr/bin/mc anonymous set download myminio/chat-images;
      exit 0;
      "
    networks:
      - chat-network

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: chat-backend
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: postgresql://chatuser:${POSTGRES_PASSWORD:-chatpass}@postgres:5432/chatapp
      REDIS_URL: redis://:${REDIS_PASSWORD:-redispass}@redis:6379
      S3_ENDPOINT: http://minio:9000
      S3_ACCESS_KEY: ${MINIO_ROOT_USER:-minioadmin}
      S3_SECRET_KEY: ${MINIO_ROOT_PASSWORD:-minioadmin}
      S3_BUCKET: chat-images
      S3_PUBLIC_URL: http://localhost:9000
      AWS_REGION: us-east-1
      JWT_SECRET: ${JWT_SECRET:-your-secret-key-change-in-production}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET:-your-refresh-secret-key-change-in-production}
      FRONTEND_URL: http://localhost
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      minio:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - chat-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: chat-frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - chat-network

  # Nginx Load Balancer (for multiple backend instances)
  nginx:
    image: nginx:alpine
    container_name: chat-nginx
    volumes:
      - ./nginx-lb.conf:/etc/nginx/nginx.conf:ro
    ports:
      - "8080:80"
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - chat-network

volumes:
  postgres_data:
  redis_data:
  minio_data:

networks:
  chat-network:
    driver: bridge
docker-compose.prod.yml (Production with scaling)
YAML

version: '3.8'

services:
  postgres:
    # ... same as above
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G

  redis:
    # ... same as above
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M

  backend:
    # ... same as above
    deploy:
      replicas: 3  # Scale to 3 instances
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
14. Kubernetes Deployment
k8s/namespace.yaml
YAML

apiVersion: v1
kind: Namespace
metadata:
  name: chat-app
k8s/postgres-statefulset.yaml
YAML

apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: chat-app
spec:
  ports:
  - port: 5432
  clusterIP: None
  selector:
    app: postgres
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: chat-app
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_DB
          value: chatapp
        - name: POSTGRES_USER
          value: chatuser
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: chat-secrets
              key: postgres-password
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 20Gi
k8s/redis-statefulset.yaml
YAML

apiVersion: v1
kind: Service
metadata:
  name: redis
  namespace: chat-app
spec:
  ports:
  - port: 6379
  clusterIP: None
  selector:
    app: redis
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: redis
  namespace: chat-app
spec:
  serviceName: redis
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
        command:
        - redis-server
        - --appendonly
        - "yes"
        - --requirepass
        - $(REDIS_PASSWORD)
        env:
        - name: REDIS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: chat-secrets
              key: redis-password
        volumeMounts:
        - name: redis-storage
          mountPath: /data
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
  volumeClaimTemplates:
  - metadata:
      name: redis-storage
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 5Gi
k8s/backend-deployment.yaml
YAML

apiVersion: v1
kind: Service
metadata:
  name: backend
  namespace: chat-app
spec:
  type: ClusterIP
  ports:
  - port: 3000
    targetPort: 3000
  selector:
    app: backend
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: chat-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: your-registry/chat-backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: chat-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: chat-secrets
              key: redis-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: chat-secrets
              key: jwt-secret
        - name: S3_ENDPOINT
          valueFrom:
            configMapKeyRef:
              name: chat-config
              key: s3-endpoint
        - name: S3_BUCKET
          value: chat-images
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
  namespace: chat-app
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
k8s/ingress.yaml
YAML

apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: chat-ingress
  namespace: chat-app
  annotations:
    nginx.ingress.kubernetes.io/websocket-services: backend
    nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - chat.example.com
    secretName: chat-tls
  rules:
  - host: chat.example.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend
            port:
              number: 3000
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 80
15. Performance Testing Tool
tools/performance-test/load-test.ts
TypeScript

import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import { faker } from '@faker-js/faker';

interface TestConfig {
  baseUrl: string;
  wsUrl: string;
  numberOfUsers: number;
  messagesPerSecond: number;
  testDurationSeconds: number;
}

interface Metrics {
  totalMessagesSent: number;
  totalMessagesReceived: number;
  averageLatency: number;
  successRate: number;
  errors: number;
  connectionErrors: number;
}

class LoadTester {
  private config: TestConfig;
  private users: Array<{
    id: string;
    username: string;
    token: string;
    socket: Socket;
  }> = [];
  private metrics: Metrics = {
    totalMessagesSent: 0,
    totalMessagesReceived: 0,
    averageLatency: 0,
    successRate: 0,
    errors: 0,
    connectionErrors: 0,
  };
  private latencies: number[] = [];

  constructor(config: TestConfig) {
    this.config = config;
  }

  async run() {
    console.log('🚀 Starting load test...');
    console.log(`👥 Simulating ${this.config.numberOfUsers} users`);
    console.log(`📨 Target: ${this.config.messagesPerSecond} messages/second`);
    console.log(`⏱️  Duration: ${this.config.testDurationSeconds} seconds\n`);

    try {
      // Phase 1: Register and authenticate users
      await this.createUsers();

      // Phase 2: Connect users via WebSocket
      await this.connectUsers();

      // Phase 3: Create test chats
      const chatId = await this.createTestChat();

      // Phase 4: Simulate message sending
      await this.simulateMessaging(chatId);

      // Phase 5: Cleanup
      await this.cleanup();

      // Display results
      this.displayResults();
    } catch (error) {
      console.error('❌ Load test failed:', error);
    }
  }

  private async createUsers() {
    console.log('📝 Creating users...');
    const startTime = Date.now();

    const createPromises = Array.from({ length: this.config.numberOfUsers }, async (_, i) => {
      const username = `testuser_${i}_${faker.string.alphanumeric(6)}`;
      const password = 'Test123!';

      try {
        const response = await axios.post(`${this.config.baseUrl}/api/auth/register`, {
          username,
          password,
          passwordConfirm: password,
        });

        const loginResponse = await axios.post(`${this.config.baseUrl}/api/auth/login`, {
          username,
          password,
        });

        this.users.push({
          id: loginResponse.data.user.id,
          username,
          token: loginResponse.data.accessToken,
          socket: null as any,
        });
      } catch (error) {
        console.error(`Failed to create user ${username}:`, error);
        this.metrics.errors++;
      }
    });

    await Promise.all(createPromises);

    const duration = Date.now() - startTime;
    console.log(`✅ Created ${this.users.length} users in ${duration}ms\n`);
  }

  private async connectUsers() {
    console.log('🔌 Connecting users via WebSocket...');
    const startTime = Date.now();

    const connectPromises = this.users.map((user) => {
      return new Promise<void>((resolve, reject) => {
        const socket = io(this.config.wsUrl, {
          auth: { token: user.token },
          transports: ['websocket', 'polling'],
        });

        socket.on('connect', () => {
          user.socket = socket;
          resolve();
        });

        socket.on('connect_error', (error) => {
          console.error(`Connection error for ${user.username}:`, error);
          this.metrics.connectionErrors++;
          reject(error);
        });

        socket.on('message:new', (message) => {
          this.metrics.totalMessagesReceived++;
          
          // Calculate latency
          const sentAt = message.metadata?.sentAt;
          if (sentAt) {
            const latency = Date.now() - sentAt;
            this.latencies.push(latency);
          }
        });

        // Timeout after 10 seconds
        setTimeout(() => reject(new Error('Connection timeout')), 10000);
      });
    });

    try {
      await Promise.all(connectPromises);
      const duration = Date.now() - startTime;
      console.log(`✅ Connected ${this.users.length} users in ${duration}ms\n`);
    } catch (error) {
      console.error('Some users failed to connect');
    }
  }

  private async createTestChat(): Promise<string> {
    console.log('💬 Creating test group chat...');

    const owner = this.users[0];
    const participantIds = this.users.slice(1, 50).map(u => u.id); // Group of 50

    const response = await axios.post(
      `${this.config.baseUrl}/api/chats/group`,
      {
        name: 'Load Test Group',
        participantIds,
      },
      {
        headers: { Authorization: `Bearer ${owner.token}` },
      }
    );

    console.log(`✅ Created chat: ${response.data.chat.id}\n`);
    return response.data.chat.id;
  }

  private async simulateMessaging(chatId: string) {
    console.log('📤 Starting message simulation...');
    
    const interval = 1000 / this.config.messagesPerSecond;
    const totalMessages = this.config.messagesPerSecond * this.config.testDurationSeconds;

    let messagesSent = 0;
    const startTime = Date.now();

    return new Promise<void>((resolve) => {
      const intervalId = setInterval(() => {
        if (messagesSent >= totalMessages) {
          clearInterval(intervalId);
          const duration = Date.now() - startTime;
          console.log(`\n✅ Sent ${messagesSent} messages in ${duration}ms`);
          resolve();
          return;
        }

        // Pick random user
        const user = this.users[Math.floor(Math.random() * this.users.length)];
        
        if (user.socket && user.socket.connected) {
          const message = {
            chatId,
            content: faker.lorem.sentence(),
            metadata: { sentAt: Date.now() },
          };

          user.socket.emit('message:send', message);
          this.metrics.totalMessagesSent++;
          messagesSent++;

          // Progress indicator
          if (messagesSent % 100 === 0) {
            process.stdout.write(`\r📨 Sent: ${messagesSent}/${totalMessages} messages`);
          }
        }
      }, interval);
    });
  }

  private async cleanup() {
    console.log('\n🧹 Cleaning up...');

    // Disconnect all sockets
    this.users.forEach(user => {
      if (user.socket) {
        user.socket.disconnect();
      }
    });

    console.log('✅ Cleanup complete\n');
  }

  private displayResults() {
    // Calculate metrics
    this.metrics.averageLatency = this.latencies.length > 0
      ? this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length
      : 0;

    this.metrics.successRate = this.metrics.totalMessagesSent > 0
      ? (this.metrics.totalMessagesReceived / this.metrics.totalMessagesSent) * 100
      : 0;

    const p50 = this.percentile(this.latencies, 0.5);
    const p95 = this.percentile(this.latencies, 0.95);
    const p99 = this.percentile(this.latencies, 0.99);

    console.log('═══════════════════════════════════════════════════════');
    console.log('                    TEST RESULTS                       ');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`👥 Total Users:              ${this.config.numberOfUsers}`);
    console.log(`📤 Messages Sent:            ${this.metrics.totalMessagesSent}`);
    console.log(`📥 Messages Received:        ${this.metrics.totalMessagesReceived}`);
    console.log(`✅ Success Rate:             ${this.metrics.successRate.toFixed(2)}%`);
    console.log(`❌ Errors:                   ${this.metrics.errors}`);
    console.log(`🔌 Connection Errors:        ${this.metrics.connectionErrors}`);
    console.log('───────────────────────────────────────────────────────');
    console.log('                      LATENCY                          ');
    console.log('───────────────────────────────────────────────────────');
    console.log(`⏱️  Average:                 ${this.metrics.averageLatency.toFixed(2)}ms`);
    console.log(`📊 P50 (median):             ${p50.toFixed(2)}ms`);
    console.log(`📊 P95:                      ${p95.toFixed(2)}ms`);
    console.log(`📊 P99:                      ${p99.toFixed(2)}ms`);
    console.log(`📊 Min:                      ${Math.min(...this.latencies).toFixed(2)}ms`);
    console.log(`📊 Max:                      ${Math.max(...this.latencies).toFixed(2)}ms`);
    console.log('═══════════════════════════════════════════════════════\n');
  }

  private percentile(arr: number[], p: number): number {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[index];
  }
}

// Run the test
const config: TestConfig = {
  baseUrl: process.env.API_URL || 'http://localhost:3000',
  wsUrl: process.env.WS_URL || 'http://localhost:3000',
  numberOfUsers: parseInt(process.env.NUM_USERS || '1000'),
  messagesPerSecond: parseInt(process.env.MSG_PER_SEC || '50'),
  testDurationSeconds: parseInt(process.env.DURATION || '60'),
};

const tester = new LoadTester(config);
tester.run().catch(console.error);
tools/performance-test/package.json
JSON

{
  "name": "chat-load-test",
  "version": "1.0.0",
  "scripts": {
    "test": "ts-node load-test.ts"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "socket.io-client": "^4.6.0",
    "@faker-js/faker": "^8.3.1"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "ts-node": "^10.9.0"
  }
}
Usage:
Bash

# Run with defaults (1000 users, 50 msg/s, 60s duration)
npm test

# Custom configuration
NUM_USERS=500 MSG_PER_SEC=100 DURATION=120 npm test
16. Environment Variables
backend/.env.example
env

# Environment
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://chatuser:chatpass@localhost:5432/chatapp
DATABASE_REPLICA_URL=postgresql://chatuser:chatpass@localhost:5433/chatapp

# Redis
REDIS_URL=redis://:redispass@localhost:6379

# S3/MinIO
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=chat-images
S3_PUBLIC_URL=http://localhost:9000
AWS_REGION=us-east-1

# JWT Secrets (CHANGE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-characters

# CORS
FRONTEND_URL=http://localhost:5173

# Monitoring
ENABLE_METRICS=true
LOG_LEVEL=info
17. README.md
Markdown

# Chat Application - Skype Alternative

A modern, scalable chat application with real-time messaging, group chats, and file sharing.

## Features

- ✅ User registration and authentication
- ✅ Direct messaging (1-on-1)
- ✅ Group chats (up to 300 participants)
- ✅ Real-time messaging with WebSocket (fallback to polling)
- ✅ Message formatting (bold, italic)
- ✅ Image sharing
- ✅ Message reactions
- ✅ Read receipts
- ✅ Typing indicators
- ✅ Message search
- ✅ Deep links to chats and messages
- ✅ Multi-device support
- ✅ Persistent message history

## Tech Stack

### Backend
- Node.js 20+ with TypeScript
- Express.js
- Socket.IO (WebSocket with fallback)
- PostgreSQL 15
- Redis 7
- MinIO / AWS S3

### Frontend
- React 18+ with TypeScript
- Zustand (state management)
- Socket.IO Client
- TailwindCSS
- Vite

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)

### Using Docker Compose (Recommended)

```bash
# Clone repository
git clone <repo-url>
cd chat-application

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
Access the application:

Frontend: http://localhost
Backend API: http://localhost:3000
MinIO Console: http://localhost:9001
Local Development
Backend
Bash

cd backend
npm install
cp .env.example .env
# Edit .env with your configuration

# Run migrations
npm run migrate

# Start development server
npm run dev
Frontend
Bash

cd frontend
npm install
cp .env.example .env

# Start development server
npm run dev
Deployment
Docker Swarm
Bash

docker stack deploy -c docker-compose.prod.yml chat-app
Kubernetes
Bash

# Apply configurations
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/postgres-statefulset.yaml
kubectl apply -f k8s/redis-statefulset.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/ingress.yaml

# Check status
kubectl get pods -n chat-app
Performance Testing
Bash

cd tools/performance-test
npm install

# Run load test
NUM_USERS=1000 MSG_PER_SEC=50 DURATION=60 npm test
API Documentation
Authentication
POST /api/auth/register - Register new user
POST /api/auth/login - Login
POST /api/auth/refresh - Refresh access token
Chats
GET /api/chats - Get user's chats
POST /api/chats/direct - Create direct chat
POST /api/chats/group - Create group chat
GET /api/chats/:id - Get chat details
POST /api/chats/:id/messages - Send message
See full API documentation in /docs/api.md

Architecture
Horizontal Scaling: Multiple backend instances with Redis Pub/Sub
Reliable Delivery: Redis Streams + PostgreSQL delivery tracking
Cloud Agnostic: Runs locally with Docker or in any cloud (AWS, GCP, Azure)
WebSocket with Fallback: Automatic fallback to long-polling
License
MIT



---
