"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketManager = void 0;
const socket_io_1 = require("socket.io");
const redis_adapter_1 = require("@socket.io/redis-adapter");
const redis_1 = require("../config/redis");
const logger_util_1 = require("../utils/logger.util");
const env_1 = require("../config/env");
class SocketManager {
    authService;
    sessionService;
    userRepo;
    io;
    constructor(httpServer, authService, sessionService, userRepo) {
        this.authService = authService;
        this.sessionService = sessionService;
        this.userRepo = userRepo;
        this.io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: env_1.config.FRONTEND_URL,
                credentials: true,
            },
            transports: ['websocket', 'polling'],
            pingTimeout: 60000,
            pingInterval: 25000,
            maxHttpBufferSize: 1e6,
        });
        this.setupRedisAdapter();
        this.setupMiddleware();
        this.setupConnectionHandler();
    }
    async setupRedisAdapter() {
        this.io.adapter((0, redis_adapter_1.createAdapter)(redis_1.redisPubClient, redis_1.redisSubClient));
        logger_util_1.logger.info('Socket.IO Redis adapter configured');
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
            const { userId, sessionId } = socket.data;
            logger_util_1.logger.info(`User connected: ${userId}, socket: ${socket.id}`);
            socket.join(`user:${userId}`);
            await this.userRepo.updateStatus(userId, 'online');
            await this.sessionService.updateSocketId(sessionId, socket.id);
            await this.joinUserChats(userId, socket);
            this.broadcastUserStatus(userId, 'online');
            this.setupEventHandlers(socket);
            socket.on('disconnect', async () => {
                logger_util_1.logger.info(`User disconnected: ${userId}, socket: ${socket.id}`);
                const activeSessions = await this.sessionService.getActiveUserSessions(userId);
                if (activeSessions.length === 0) {
                    await this.userRepo.updateStatus(userId, 'offline');
                    this.broadcastUserStatus(userId, 'offline');
                }
            });
        });
    }
    setupEventHandlers(socket) {
        const { userId } = socket.data;
        socket.on('typing:start', (data) => {
            socket.to(`chat:${data.chatId}`).emit('typing:start', {
                chatId: data.chatId,
                userId,
            });
        });
        socket.on('typing:stop', (data) => {
            socket.to(`chat:${data.chatId}`).emit('typing:stop', {
                chatId: data.chatId,
                userId,
            });
        });
        socket.on('presence:update', async (data) => {
            await this.userRepo.updateStatus(userId, data.status);
            this.broadcastUserStatus(userId, data.status);
        });
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
    async getUserChatIds(_userId) {
        return [];
    }
    getIO() {
        return this.io;
    }
}
exports.SocketManager = SocketManager;
//# sourceMappingURL=socket.manager.js.map