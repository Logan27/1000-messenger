"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypingHandler = void 0;
const logger_util_1 = require("../../utils/logger.util");
class TypingHandler {
    typingUsers = new Map();
    setupHandlers(socket) {
        const { userId } = socket.data;
        socket.on('typing:start', (data) => {
            try {
                if (!this.typingUsers.has(data.chatId)) {
                    this.typingUsers.set(data.chatId, new Set());
                }
                this.typingUsers.get(data.chatId).add(userId);
                socket.to(`chat:${data.chatId}`).emit('typing:start', {
                    chatId: data.chatId,
                    userId,
                });
                logger_util_1.logger.debug(`User ${userId} started typing in chat ${data.chatId}`);
            }
            catch (error) {
                logger_util_1.logger.error('Failed to handle typing start', error);
            }
        });
        socket.on('typing:stop', (data) => {
            try {
                const chatTypingUsers = this.typingUsers.get(data.chatId);
                if (chatTypingUsers) {
                    chatTypingUsers.delete(userId);
                    if (chatTypingUsers.size === 0) {
                        this.typingUsers.delete(data.chatId);
                    }
                }
                socket.to(`chat:${data.chatId}`).emit('typing:stop', {
                    chatId: data.chatId,
                    userId,
                });
                logger_util_1.logger.debug(`User ${userId} stopped typing in chat ${data.chatId}`);
            }
            catch (error) {
                logger_util_1.logger.error('Failed to handle typing stop', error);
            }
        });
        socket.on('disconnect', () => {
            this.cleanupUserTyping(userId);
        });
    }
    cleanupUserTyping(userId) {
        for (const [chatId, users] of this.typingUsers.entries()) {
            if (users.has(userId)) {
                users.delete(userId);
                if (users.size === 0) {
                    this.typingUsers.delete(chatId);
                }
            }
        }
    }
    getTypingUsers(chatId) {
        const users = this.typingUsers.get(chatId);
        return users ? Array.from(users) : [];
    }
}
exports.TypingHandler = TypingHandler;
//# sourceMappingURL=typing.handler.js.map