"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageService = void 0;
const uuid_1 = require("uuid");
const constants_1 = require("../config/constants");
const logger_util_1 = require("../utils/logger.util");
class MessageService {
    messageRepo;
    chatRepo;
    deliveryQueue;
    socketManager;
    constructor(messageRepo, chatRepo, deliveryQueue, socketManager) {
        this.messageRepo = messageRepo;
        this.chatRepo = chatRepo;
        this.deliveryQueue = deliveryQueue;
        this.socketManager = socketManager;
    }
    async sendMessage(dto) {
        if (dto.content.length > constants_1.LIMITS.MESSAGE_MAX_LENGTH) {
            throw new Error(`Message exceeds maximum length of ${constants_1.LIMITS.MESSAGE_MAX_LENGTH} characters`);
        }
        const isParticipant = await this.chatRepo.isUserParticipant(dto.chatId, dto.senderId);
        if (!isParticipant) {
            throw new Error('User is not a participant of this chat');
        }
        const messageData = {
            id: (0, uuid_1.v4)(),
            chatId: dto.chatId,
            senderId: dto.senderId,
            content: dto.content,
            contentType: dto.contentType || 'text',
            metadata: dto.metadata || {},
        };
        if (dto.replyToId !== undefined) {
            messageData.replyToId = dto.replyToId;
        }
        const message = await this.messageRepo.create(messageData);
        const participants = await this.chatRepo.getActiveParticipantIds(dto.chatId);
        const recipients = participants.filter(id => id !== dto.senderId);
        await this.messageRepo.createDeliveryRecords(message.id, recipients);
        await this.chatRepo.updateLastMessageAt(dto.chatId);
        await this.chatRepo.incrementUnreadCounts(dto.chatId, recipients);
        await this.deliveryQueue.addMessage({
            messageId: message.id,
            chatId: dto.chatId,
            recipients,
        });
        this.socketManager.broadcastToChat(dto.chatId, 'message:new', {
            ...message,
            sender: await this.getUserInfo(dto.senderId),
        });
        logger_util_1.logger.info(`Message sent: ${message.id} in chat ${dto.chatId}`);
        return message;
    }
    async editMessage(messageId, userId, newContent) {
        const message = await this.messageRepo.findById(messageId);
        if (!message) {
            throw new Error('Message not found');
        }
        if (message.senderId !== userId) {
            throw new Error('Cannot edit message from another user');
        }
        if (newContent.length > constants_1.LIMITS.MESSAGE_MAX_LENGTH) {
            throw new Error('Message exceeds maximum length');
        }
        await this.messageRepo.saveEditHistory({
            messageId,
            oldContent: message.content,
            oldMetadata: message.metadata,
        });
        const updatedMessage = await this.messageRepo.update(messageId, {
            content: newContent,
            isEdited: true,
            editedAt: new Date(),
        });
        this.socketManager.broadcastToChat(message.chatId, 'message:edited', {
            messageId,
            content: newContent,
            editedAt: updatedMessage.editedAt,
        });
        return updatedMessage;
    }
    async deleteMessage(messageId, userId) {
        const message = await this.messageRepo.findById(messageId);
        if (!message) {
            throw new Error('Message not found');
        }
        if (message.senderId !== userId) {
            throw new Error('Cannot delete message from another user');
        }
        await this.messageRepo.update(messageId, {
            isDeleted: true,
            deletedAt: new Date(),
            content: '[Deleted]',
        });
        this.socketManager.broadcastToChat(message.chatId, 'message:deleted', {
            messageId,
        });
    }
    async getMessages(chatId, userId, limit = 50, cursor) {
        const isParticipant = await this.chatRepo.isUserParticipant(chatId, userId);
        if (!isParticipant) {
            throw new Error('User is not a participant of this chat');
        }
        const messages = await this.messageRepo.getMessagesByChatId(chatId, limit, cursor);
        return {
            data: messages,
            nextCursor: messages.length > 0
                ? messages[messages.length - 1].createdAt.toISOString()
                : null,
            hasMore: messages.length === limit,
        };
    }
    async markAsRead(messageId, userId) {
        const message = await this.messageRepo.findById(messageId);
        if (!message) {
            throw new Error('Message not found');
        }
        await this.messageRepo.updateDeliveryStatus(messageId, userId, 'read');
        await this.chatRepo.resetUnreadCount(message.chatId, userId);
        this.socketManager.sendToUser(message.senderId, 'message:read', {
            messageId,
            chatId: message.chatId,
            readBy: userId,
            readAt: new Date(),
        });
    }
    async addReaction(messageId, userId, emoji) {
        const message = await this.messageRepo.findById(messageId);
        if (!message) {
            throw new Error('Message not found');
        }
        const isParticipant = await this.chatRepo.isUserParticipant(message.chatId, userId);
        if (!isParticipant) {
            throw new Error('User is not a participant of this chat');
        }
        const reaction = await this.messageRepo.addReaction(messageId, userId, emoji);
        this.socketManager.broadcastToChat(message.chatId, 'reaction:added', {
            messageId,
            userId,
            emoji,
            reactionId: reaction.id,
        });
        return reaction;
    }
    async removeReaction(reactionId, userId) {
        const reaction = await this.messageRepo.findReactionById(reactionId);
        if (!reaction || reaction.userId !== userId) {
            throw new Error('Reaction not found or unauthorized');
        }
        await this.messageRepo.deleteReaction(reactionId);
        const message = await this.messageRepo.findById(reaction.messageId);
        if (!message) {
            throw new Error('Message not found');
        }
        this.socketManager.broadcastToChat(message.chatId, 'reaction:removed', {
            reactionId,
            messageId: reaction.messageId,
        });
    }
    async getUserInfo(userId) {
        return { id: userId, username: 'User' };
    }
}
exports.MessageService = MessageService;
//# sourceMappingURL=message.service.js.map