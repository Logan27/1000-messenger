import http from 'http';
import { createApp } from './app';
import { config } from './config/env';
import { testConnection, closeConnections } from './config/database';
import { connectRedis, closeRedis } from './config/redis';
import { initializeStorage } from './config/storage';
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

    // Initialize storage (MinIO/S3)
    await initializeStorage();

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
    socketManager = new SocketManager(server, authService, sessionService, userRepo);

    // Initialize message delivery queue
    messageQueue = new MessageDeliveryQueue(messageRepo, socketManager);
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
