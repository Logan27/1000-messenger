"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketManager = void 0;
const socket_io_1 = require("socket.io");
const redis_adapter_1 = require("@socket.io/redis-adapter");
const redis_1 = require("../config/redis");
const message_handler_1 = require("./handlers/message.handler");
const presence_handler_1 = require("./handlers/presence.handler");
const typing_handler_1 = require("./handlers/typing.handler");
const read_receipt_handler_1 = require("./handlers/read-receipt.handler");
const logger_util_1 = require("../utils/logger.util");
const env_1 = require("../config/env");
class SocketManager {
    authService;
    sessionService;
    userRepo;
    chatRepo;
    io;
    messageHandler;
    presenceHandler;
    typingHandler;
    readReceiptHandler;
    initialized = false;
    constructor(httpServer, authService, sessionService, userRepo, chatRepo) {
        this.authService = authService;
        this.sessionService = sessionService;
        this.userRepo = userRepo;
        this.chatRepo = chatRepo;
        this.io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: env_1.config.FRONTEND_URL,
                credentials: true,
            },
            transports: ['websocket', 'polling'],
            pingTimeout: 60000,
            pingInterval: 25000,
            maxHttpBufferSize: 1e6,
            connectTimeout: 45000,
        });
        this.presenceHandler = new presence_handler_1.PresenceHandler(userRepo);
        this.typingHandler = new typing_handler_1.TypingHandler();
        this.setupRedisAdapter();
        this.setupMiddleware();
        this.setupConnectionHandler();
    }
    initializeMessageHandlers(messageService) {
        if (this.initialized) {
            logger_util_1.logger.warn('Message handlers already initialized');
            return;
        }
        this.messageHandler = new message_handler_1.MessageHandler(messageService);
        this.readReceiptHandler = new read_receipt_handler_1.ReadReceiptHandler(messageService);
        this.initialized = true;
        logger_util_1.logger.info('Message handlers initialized successfully');
    }
    setupRedisAdapter() {
        try {
            this.io.adapter((0, redis_adapter_1.createAdapter)(redis_1.redisPubClient, redis_1.redisSubClient));
            logger_util_1.logger.info('Socket.IO Redis adapter configured for horizontal scaling');
        }
        catch (error) {
            logger_util_1.logger.error('Failed to setup Redis adapter', error);
            throw error;
        }
    }
    setupMiddleware() {
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth['token'];
                if (!token) {
                    return next(new Error('Authentication token required'));
                }
                const { userId } = await this.authService.verifyAccessToken(token);
                socket.data = {
                    userId,
                    sessionId: socket.id,
                };
                next();
            }
            catch (error) {
                logger_util_1.logger.error('Socket authentication failed', error);
                next(new Error('Authentication failed'));
            }
        });
    }
    setupConnectionHandler() {
        this.io.on('connection', async (socket) => {
            try {
                const { userId, sessionId } = socket.data;
                logger_util_1.logger.info(`User connected: ${userId}, socket: ${socket.id}`);
                socket.join(`user:${userId}`);
                await this.userRepo.updateStatus(userId, 'online');
                await this.sessionService.updateSocketId(sessionId, socket.id);
                await this.joinUserChats(userId, socket);
                this.broadcastUserStatus(userId, 'online');
                this.setupEventHandlers(socket);
                socket.emit('connection:success', {
                    userId,
                    timestamp: new Date(),
                });
                socket.on('disconnect', async (reason) => {
                    try {
                        logger_util_1.logger.info(`User disconnected: ${userId}, socket: ${socket.id}, reason: ${reason}`);
                        const activeSessions = await this.sessionService.getActiveUserSessions(userId);
                        if (activeSessions.length === 0) {
                            await this.userRepo.updateStatus(userId, 'offline');
                            this.broadcastUserStatus(userId, 'offline');
                        }
                    }
                    catch (error) {
                        logger_util_1.logger.error(`Error handling disconnect for user ${userId}`, error);
                    }
                });
                socket.on('error', (error) => {
                    logger_util_1.logger.error(`Socket error for user ${userId}`, error);
                });
            }
            catch (error) {
                logger_util_1.logger.error('Error in connection handler', error);
                socket.disconnect(true);
            }
        });
        this.io.of('/').adapter.on('error', (error) => {
            logger_util_1.logger.error('Redis adapter error', error);
        });
    }
    setupEventHandlers(socket) {
        try {
            if (this.messageHandler) {
                this.messageHandler.setupHandlers(socket);
            }
            this.presenceHandler.setupHandlers(socket);
            this.typingHandler.setupHandlers(socket);
            if (this.readReceiptHandler) {
                this.readReceiptHandler.setupHandlers(socket);
            }
            logger_util_1.logger.debug(`Event handlers registered for socket ${socket.id}`);
        }
        catch (error) {
            logger_util_1.logger.error('Failed to setup event handlers', error);
        }
    }
    async joinUserChats(userId, socket) {
        const chatIds = await this.getUserChatIds(userId);
        for (const chatId of chatIds) {
            socket.join(`chat:${chatId}`);
        }
    }
    broadcastToChat(chatId, event, data) {
        this.io.to(`chat:${chatId}`).emit(event, data);
    }
    sendToUser(userId, event, data) {
        this.io.to(`user:${userId}`).emit(event, data);
    }
    broadcastUserStatus(userId, status) {
        this.io.emit('user:status', {
            userId,
            status,
            timestamp: new Date(),
        });
    }
    async addUserToChat(userId, chatId) {
        const sockets = await this.io.in(`user:${userId}`).fetchSockets();
        for (const socket of sockets) {
            socket.join(`chat:${chatId}`);
        }
    }
    async removeUserFromChat(userId, chatId) {
        const sockets = await this.io.in(`user:${userId}`).fetchSockets();
        for (const socket of sockets) {
            socket.leave(`chat:${chatId}`);
        }
    }
    async getUserChatIds(userId) {
        try {
            const chats = await this.chatRepo.getUserChats(userId);
            return chats.map(chat => chat.id);
        }
        catch (error) {
            logger_util_1.logger.error(`Failed to get user chats for user ${userId}`, error);
            return [];
        }
    }
    getIO() {
        return this.io;
    }
    async getStats() {
        const sockets = await this.io.fetchSockets();
        return {
            totalConnections: sockets.length,
            initialized: this.initialized,
        };
    }
    broadcast(event, data) {
        this.io.emit(event, data);
    }
    async getChatUsers(chatId) {
        const sockets = await this.io.in(`chat:${chatId}`).fetchSockets();
        const userIds = new Set();
        for (const socket of sockets) {
            const { userId } = socket.data;
            if (userId) {
                userIds.add(userId);
            }
        }
        return Array.from(userIds);
    }
    async isUserOnline(userId) {
        const sockets = await this.io.in(`user:${userId}`).fetchSockets();
        return sockets.length > 0;
    }
    async disconnectUser(userId) {
        const sockets = await this.io.in(`user:${userId}`).fetchSockets();
        for (const socket of sockets) {
            socket.disconnect(true);
        }
        logger_util_1.logger.info(`Disconnected all sessions for user ${userId}`);
    }
}
exports.SocketManager = SocketManager;
//# sourceMappingURL=socket.manager.js.map