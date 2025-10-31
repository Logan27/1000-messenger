import * as http from 'http';
import { createApp } from './app';
import { config } from './config/env';
import { testConnection, closeConnections } from './config/database';
import { connectRedis, closeRedis } from './config/redis';
import { initializeStorage } from './config/storage';
import { SocketManager, setSocketManager } from './websocket/socket.manager';
import { MessageDeliveryQueue } from './queues/message-delivery.queue';
import { logger } from './utils/logger.util';

// Import services and repositories
import { UserRepository } from './repositories/user.repository';
import { MessageRepository } from './repositories/message.repository';
import { ChatRepository } from './repositories/chat.repository';
import { AuthService } from './services/auth.service';
import { SessionService } from './services/session.service';
import { MessageService } from './services/message.service';

let server: http.Server;
let socketManager: SocketManager;
let messageQueue: MessageDeliveryQueue;
let messageService: MessageService;
let isShuttingDown = false;

const SHUTDOWN_TIMEOUT = 30000; // 30 seconds max shutdown time
const GRACEFUL_WAIT_TIME = 5000; // 5 seconds to allow in-flight requests to complete

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
    const messageRepo = new MessageRepository();
    const chatRepo = new ChatRepository();

    // Initialize services
    const sessionService = new SessionService();
    const authService = new AuthService(userRepo, sessionService);

    // Create Express app
    const app = createApp();

    // Create HTTP server
    server = http.createServer(app);

    // Initialize WebSocket manager (without MessageService to avoid circular dependency)
    socketManager = new SocketManager(server, authService, sessionService, userRepo, chatRepo);
    
    // Register as global singleton for controllers to access
    setSocketManager(socketManager);

    // Initialize message delivery queue
    messageQueue = new MessageDeliveryQueue(messageRepo, socketManager);
    await messageQueue.initialize();

    // Initialize MessageService with all dependencies
    messageService = new MessageService(messageRepo, chatRepo, messageQueue, socketManager);

    // Complete SocketManager initialization with MessageService
    socketManager.initializeMessageHandlers(messageService);

    // Start message queue processing
    void messageQueue.startProcessing();

    // Start server
    server.listen(config.PORT, () => {
      logger.info(`🚀 Server running on port ${config.PORT}`);
      logger.info(`📡 WebSocket ready for connections`);
      logger.info(`🌍 Environment: ${config.NODE_ENV}`);
    });

    // Graceful shutdown handlers
    process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => void gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions and unhandled rejections
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      void gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      void gracefulShutdown('UNHANDLED_REJECTION');
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

async function gracefulShutdown(signal: string) {
  if (isShuttingDown) {
    logger.warn('Shutdown already in progress, ignoring duplicate signal');
    return;
  }
  isShuttingDown = true;

  logger.info(`${signal} received, starting graceful shutdown...`);

  // Set a hard timeout to force exit if graceful shutdown takes too long
  const forceExitTimer = setTimeout(() => {
    logger.error('Graceful shutdown timeout exceeded, forcing exit');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT);

  try {
    // Step 1: Stop accepting new connections
    logger.info('Step 1/6: Stopping HTTP server from accepting new connections...');
    await new Promise<void>((resolve, reject) => {
      if (!server || !server.listening) {
        resolve();
        return;
      }
      server.close(err => {
        if (err) {
          logger.error('Error closing HTTP server', err);
          reject(err);
        } else {
          logger.info('HTTP server closed successfully');
          resolve();
        }
      });
    });

    // Step 2: Notify all connected WebSocket clients
    logger.info('Step 2/6: Notifying connected WebSocket clients...');
    if (socketManager) {
      try {
        socketManager.getIO().emit('server:shutdown', {
          message: 'Server is shutting down, please reconnect in a moment',
          timestamp: new Date().toISOString(),
        });
        logger.info('Shutdown notification sent to all connected clients');
      } catch (error) {
        logger.error('Error notifying WebSocket clients', error);
      }
    }

    // Step 3: Stop message queue processing
    logger.info('Step 3/6: Stopping message delivery queue...');
    if (messageQueue) {
      try {
        messageQueue.stopProcessing();
        logger.info('Message queue stopped successfully');
      } catch (error) {
        logger.error('Error stopping message queue', error);
      }
    }

    // Step 4: Wait for in-flight requests to complete
    logger.info(`Step 4/6: Waiting ${GRACEFUL_WAIT_TIME}ms for in-flight requests to complete...`);
    await new Promise(resolve => setTimeout(resolve, GRACEFUL_WAIT_TIME));

    // Step 5: Disconnect all WebSocket clients gracefully
    logger.info('Step 5/6: Disconnecting WebSocket clients...');
    if (socketManager) {
      try {
        const sockets = await socketManager.getIO().fetchSockets();
        logger.info(`Disconnecting ${sockets.length} active WebSocket connections`);
        for (const socket of sockets) {
          socket.disconnect(true);
        }
        logger.info('All WebSocket clients disconnected');
      } catch (error) {
        logger.error('Error disconnecting WebSocket clients', error);
      }
    }

    // Step 6: Close database and Redis connections
    logger.info('Step 6/6: Closing database and Redis connections...');
    try {
      await Promise.all([
        closeConnections().catch(err => {
          logger.error('Error closing database connections', err);
        }),
        closeRedis().catch(err => {
          logger.error('Error closing Redis connections', err);
        }),
      ]);
      logger.info('All connections closed successfully');
    } catch (error) {
      logger.error('Error during connection cleanup', error);
    }

    // Clear the force exit timer
    clearTimeout(forceExitTimer);

    logger.info('✅ Graceful shutdown completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown', error);
    clearTimeout(forceExitTimer);
    process.exit(1);
  }
}

// Start the server
void startServer();
