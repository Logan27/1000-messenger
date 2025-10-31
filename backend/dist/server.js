"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_1 = require("./app");
const env_1 = require("./config/env");
const database_1 = require("./config/database");
const redis_1 = require("./config/redis");
const storage_1 = require("./config/storage");
const socket_manager_1 = require("./websocket/socket.manager");
const message_delivery_queue_1 = require("./queues/message-delivery.queue");
const logger_util_1 = require("./utils/logger.util");
const user_repository_1 = require("./repositories/user.repository");
const chat_repository_1 = require("./repositories/chat.repository");
const message_repository_1 = require("./repositories/message.repository");
const auth_service_1 = require("./services/auth.service");
const session_service_1 = require("./services/session.service");
let server;
let socketManager;
let messageQueue;
let isShuttingDown = false;
const SHUTDOWN_TIMEOUT = 30000;
const GRACEFUL_WAIT_TIME = 5000;
async function startServer() {
    try {
        const dbConnected = await (0, database_1.testConnection)();
        if (!dbConnected) {
            throw new Error('Database connection failed');
        }
        await (0, redis_1.connectRedis)();
        await (0, storage_1.initializeStorage)();
        const userRepo = new user_repository_1.UserRepository();
        const chatRepo = new chat_repository_1.ChatRepository();
        const messageRepo = new message_repository_1.MessageRepository();
        const sessionService = new session_service_1.SessionService();
        const authService = new auth_service_1.AuthService(userRepo, sessionService);
        const app = (0, app_1.createApp)();
        server = http_1.default.createServer(app);
        socketManager = new socket_manager_1.SocketManager(server, authService, sessionService, userRepo);
        messageQueue = new message_delivery_queue_1.MessageDeliveryQueue(messageRepo, socketManager);
        await messageQueue.initialize();
        messageQueue.startProcessing();
        server.listen(env_1.config.PORT, () => {
            logger_util_1.logger.info(`🚀 Server running on port ${env_1.config.PORT}`);
            logger_util_1.logger.info(`📡 WebSocket ready for connections`);
            logger_util_1.logger.info(`🌍 Environment: ${env_1.config.NODE_ENV}`);
        });
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('uncaughtException', (error) => {
            logger_util_1.logger.error('Uncaught Exception:', error);
            gracefulShutdown('UNCAUGHT_EXCEPTION');
        });
        process.on('unhandledRejection', (reason, promise) => {
            logger_util_1.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
            gracefulShutdown('UNHANDLED_REJECTION');
        });
    }
    catch (error) {
        logger_util_1.logger.error('Failed to start server', error);
        process.exit(1);
    }
}
async function gracefulShutdown(signal) {
    if (isShuttingDown) {
        logger_util_1.logger.warn('Shutdown already in progress, ignoring duplicate signal');
        return;
    }
    isShuttingDown = true;
    logger_util_1.logger.info(`${signal} received, starting graceful shutdown...`);
    const forceExitTimer = setTimeout(() => {
        logger_util_1.logger.error('Graceful shutdown timeout exceeded, forcing exit');
        process.exit(1);
    }, SHUTDOWN_TIMEOUT);
    try {
        logger_util_1.logger.info('Step 1/6: Stopping HTTP server from accepting new connections...');
        await new Promise((resolve, reject) => {
            if (!server || !server.listening) {
                resolve();
                return;
            }
            server.close((err) => {
                if (err) {
                    logger_util_1.logger.error('Error closing HTTP server', err);
                    reject(err);
                }
                else {
                    logger_util_1.logger.info('HTTP server closed successfully');
                    resolve();
                }
            });
        });
        logger_util_1.logger.info('Step 2/6: Notifying connected WebSocket clients...');
        if (socketManager) {
            try {
                socketManager.getIO().emit('server:shutdown', {
                    message: 'Server is shutting down, please reconnect in a moment',
                    timestamp: new Date().toISOString(),
                });
                logger_util_1.logger.info('Shutdown notification sent to all connected clients');
            }
            catch (error) {
                logger_util_1.logger.error('Error notifying WebSocket clients', error);
            }
        }
        logger_util_1.logger.info('Step 3/6: Stopping message delivery queue...');
        if (messageQueue) {
            try {
                messageQueue.stopProcessing();
                logger_util_1.logger.info('Message queue stopped successfully');
            }
            catch (error) {
                logger_util_1.logger.error('Error stopping message queue', error);
            }
        }
        logger_util_1.logger.info(`Step 4/6: Waiting ${GRACEFUL_WAIT_TIME}ms for in-flight requests to complete...`);
        await new Promise(resolve => setTimeout(resolve, GRACEFUL_WAIT_TIME));
        logger_util_1.logger.info('Step 5/6: Disconnecting WebSocket clients...');
        if (socketManager) {
            try {
                const sockets = await socketManager.getIO().fetchSockets();
                logger_util_1.logger.info(`Disconnecting ${sockets.length} active WebSocket connections`);
                for (const socket of sockets) {
                    socket.disconnect(true);
                }
                logger_util_1.logger.info('All WebSocket clients disconnected');
            }
            catch (error) {
                logger_util_1.logger.error('Error disconnecting WebSocket clients', error);
            }
        }
        logger_util_1.logger.info('Step 6/6: Closing database and Redis connections...');
        try {
            await Promise.all([
                (0, database_1.closeConnections)().catch(err => {
                    logger_util_1.logger.error('Error closing database connections', err);
                }),
                (0, redis_1.closeRedis)().catch(err => {
                    logger_util_1.logger.error('Error closing Redis connections', err);
                }),
            ]);
            logger_util_1.logger.info('All connections closed successfully');
        }
        catch (error) {
            logger_util_1.logger.error('Error during connection cleanup', error);
        }
        clearTimeout(forceExitTimer);
        logger_util_1.logger.info('✅ Graceful shutdown completed successfully');
        process.exit(0);
    }
    catch (error) {
        logger_util_1.logger.error('Error during graceful shutdown', error);
        clearTimeout(forceExitTimer);
        process.exit(1);
    }
}
startServer();
//# sourceMappingURL=server.js.map