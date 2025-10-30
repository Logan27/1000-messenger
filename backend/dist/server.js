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
        const port = parseInt(env_1.config.PORT);
        server.listen(port, () => {
            logger_util_1.logger.info(`🚀 Server running on port ${port}`);
            logger_util_1.logger.info(`📡 WebSocket ready for connections`);
            logger_util_1.logger.info(`🌍 Environment: ${env_1.config.NODE_ENV}`);
        });
        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);
    }
    catch (error) {
        logger_util_1.logger.error('Failed to start server', error);
        process.exit(1);
    }
}
async function gracefulShutdown(signal) {
    if (isShuttingDown)
        return;
    isShuttingDown = true;
    logger_util_1.logger.info(`${signal} received, starting graceful shutdown...`);
    server.close(() => {
        logger_util_1.logger.info('HTTP server closed');
    });
    if (socketManager) {
        socketManager.getIO().emit('server:shutdown', {
            message: 'Server is shutting down, please reconnect in a moment',
        });
    }
    if (messageQueue) {
        messageQueue.stopProcessing();
    }
    await new Promise(resolve => setTimeout(resolve, 5000));
    await (0, database_1.closeConnections)();
    await (0, redis_1.closeRedis)();
    logger_util_1.logger.info('Graceful shutdown completed');
    process.exit(0);
}
startServer();
//# sourceMappingURL=server.js.map