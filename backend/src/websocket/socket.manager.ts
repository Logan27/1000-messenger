import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { createAdapter } from '@socket.io/redis-adapter';
import { redisPubClient, redisSubClient } from '../config/redis';
import { AuthService } from '../services/auth.service';
import { SessionService } from '../services/session.service';
import { UserRepository } from '../repositories/user.repository';
import { logger } from '../utils/logger.util';
import { config } from '../config/env';

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
        origin: config.FRONTEND_URL,
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

  private async getUserChatIds(_userId: string): Promise<string[]> {
    // Simplified - would use ChatRepository
    return [];
  }

  public getIO(): SocketServer {
    return this.io;
  }
}
