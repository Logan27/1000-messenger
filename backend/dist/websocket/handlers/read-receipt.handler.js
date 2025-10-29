"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReadReceiptHandler = void 0;
const logger_util_1 = require("../../utils/logger.util");
class ReadReceiptHandler {
    messageService;
    constructor(messageService) {
        this.messageService = messageService;
    }
    setupHandlers(socket) {
        const { userId } = socket.data;
        socket.on('message:mark-read', async (data) => {
            try {
                await this.messageService.markAsRead(data.messageId, userId);
                socket.emit('message:read:success', {
                    messageId: data.messageId,
                    readBy: userId,
                    readAt: new Date(),
                });
                logger_util_1.logger.debug(`Message ${data.messageId} marked as read by user ${userId}`);
            }
            catch (error) {
                logger_util_1.logger.error('Failed to mark message as read', error);
                socket.emit('message:read:error', {
                    error: error instanceof Error ? error.message : 'Failed to mark as read',
                    messageId: data.messageId,
                });
            }
        });
        socket.on('chat:mark-all-read', async (data) => {
            try {
                socket.emit('chat:mark-all-read:success', {
                    chatId: data.chatId,
                    readBy: userId,
                    readAt: new Date(),
                });
                logger_util_1.logger.debug(`All messages in chat ${data.chatId} marked as read by user ${userId}`);
            }
            catch (error) {
                logger_util_1.logger.error('Failed to mark all messages as read', error);
                socket.emit('chat:mark-all-read:error', {
                    error: error instanceof Error ? error.message : 'Failed to mark all as read',
                    chatId: data.chatId,
                });
            }
        });
    }
}
exports.ReadReceiptHandler = ReadReceiptHandler;
//# sourceMappingURL=read-receipt.handler.js.map