import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { createAdapter } from '@socket.io/redis-adapter';
import { redisPubClient, redisSubClient } from '../config/redis';
import { AuthService } from '../services/auth.service';
import { SessionService } from '../services/session.service';
import { MessageService } from '../services/message.service';
import { UserRepository } from '../repositories/user.repository';
import { ChatRepository } from '../repositories/chat.repository';
import { MessageHandler } from './handlers/message.handler';
import { PresenceHandler } from './handlers/presence.handler';
import { TypingHandler } from './handlers/typing.handler';
import { ReadReceiptHandler } from './handlers/read-receipt.handler';
import { logger } from '../utils/logger.util';
import { config } from '../config/env';

interface SocketData {
  userId: string;
  sessionId: string;
}

export class SocketManager {
  private io: SocketServer;
  private messageHandler?: MessageHandler;
  private presenceHandler: PresenceHandler;
  private typingHandler: TypingHandler;
  private readReceiptHandler?: ReadReceiptHandler;
  private initialized = false;

  constructor(
    httpServer: HttpServer,
    private authService: AuthService,
    private sessionService: SessionService,
    private userRepo: UserRepository,
    private chatRepo: ChatRepository
  ) {
    this.io = new SocketServer(httpServer, {
      cors: {
        origin: config.FRONTEND_URL,
        credentials: true,
      },
      transports: ['websocket', 'polling'], // WebSocket with polling fallback
      pingTimeout: 60000,
      pingInterval: 25000,
      maxHttpBufferSize: 1e6, // 1MB
      connectTimeout: 45000,
    });

    // Initialize handlers that don't depend on MessageService
    this.presenceHandler = new PresenceHandler(userRepo);
    this.typingHandler = new TypingHandler();

    this.setupRedisAdapter();
    this.setupMiddleware();
    this.setupConnectionHandler();
  }

  /**
   * Initialize message-related handlers after MessageService is created
   * This resolves circular dependency between SocketManager and MessageService
   */
  public initializeMessageHandlers(messageService: MessageService): void {
    if (this.initialized) {
      logger.warn('Message handlers already initialized');
      return;
    }

    this.messageHandler = new MessageHandler(messageService);
    this.readReceiptHandler = new ReadReceiptHandler(messageService);
    this.initialized = true;

    logger.info('Message handlers initialized successfully');
  }

  private setupRedisAdapter() {
    try {
      this.io.adapter(createAdapter(redisPubClient, redisSubClient));
      logger.info('Socket.IO Redis adapter configured for horizontal scaling');
    } catch (error) {
      logger.error('Failed to setup Redis adapter', error);
      throw error;
    }
  }

  private setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth['token'];

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
      try {
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

        // Send connection success acknowledgment
        socket.emit('connection:success', {
          userId,
          timestamp: new Date(),
        });

        // Handle disconnect
        socket.on('disconnect', async (reason: string) => {
          try {
            logger.info(`User disconnected: ${userId}, socket: ${socket.id}, reason: ${reason}`);

            // Check if user has other active sessions
            const activeSessions = await this.sessionService.getActiveUserSessions(userId);

            if (activeSessions.length === 0) {
              await this.userRepo.updateStatus(userId, 'offline');
              this.broadcastUserStatus(userId, 'offline');
            }
          } catch (error) {
            logger.error(`Error handling disconnect for user ${userId}`, error);
          }
        });

        // Handle errors
        socket.on('error', (error: Error) => {
          logger.error(`Socket error for user ${userId}`, error);
        });
      } catch (error) {
        logger.error('Error in connection handler', error);
        socket.disconnect(true);
      }
    });

    // Handle Redis adapter errors
    this.io.of('/').adapter.on('error', (error: Error) => {
      logger.error('Redis adapter error', error);
    });
  }

  private setupEventHandlers(socket: Socket) {
    try {
      // Setup handlers (message handlers are optional until initialized)
      if (this.messageHandler) {
        this.messageHandler.setupHandlers(socket);
      }
      this.presenceHandler.setupHandlers(socket);
      this.typingHandler.setupHandlers(socket);
      if (this.readReceiptHandler) {
        this.readReceiptHandler.setupHandlers(socket);
      }

      logger.debug(`Event handlers registered for socket ${socket.id}`);
    } catch (error) {
      logger.error('Failed to setup event handlers', error);
    }
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
    try {
      const chats = await this.chatRepo.getUserChats(userId);
      return chats.map(chat => chat.id);
    } catch (error) {
      logger.error(`Failed to get user chats for user ${userId}`, error);
      return [];
    }
  }

  public getIO(): SocketServer {
    return this.io;
  }

  /**
   * Get connection statistics
   */
  public async getStats() {
    const sockets = await this.io.fetchSockets();
    return {
      totalConnections: sockets.length,
      initialized: this.initialized,
    };
  }

  /**
   * Broadcast to all connected clients
   */
  public broadcast(event: string, data: any) {
    this.io.emit(event, data);
  }

  /**
   * Get all active users in a chat room
   */
  public async getChatUsers(chatId: string): Promise<string[]> {
    const sockets = await this.io.in(`chat:${chatId}`).fetchSockets();
    const userIds = new Set<string>();
    
    for (const socket of sockets) {
      const { userId } = socket.data as SocketData;
      if (userId) {
        userIds.add(userId);
      }
    }
    
    return Array.from(userIds);
  }

  /**
   * Check if a user is currently connected
   */
  public async isUserOnline(userId: string): Promise<boolean> {
    const sockets = await this.io.in(`user:${userId}`).fetchSockets();
    return sockets.length > 0;
  }

  /**
   * Disconnect all sessions for a user (useful for forced logout)
   */
  public async disconnectUser(userId: string): Promise<void> {
    const sockets = await this.io.in(`user:${userId}`).fetchSockets();
    
    for (const socket of sockets) {
      socket.disconnect(true);
    }
    
    logger.info(`Disconnected all sessions for user ${userId}`);
  }
}
