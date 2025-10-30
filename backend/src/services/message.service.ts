import { v4 as uuidv4 } from 'uuid';
import { MessageRepository } from '../repositories/message.repository';
import { ChatRepository } from '../repositories/chat.repository';
import { MessageDeliveryQueue } from '../queues/message-delivery.queue';
import { SocketManager } from '../websocket/socket.manager';
import { LIMITS } from '../config/constants';
import { logger } from '../utils/logger.util';

export interface SendMessageDto {
  chatId: string;
  senderId: string;
  content: string;
  contentType?: 'text' | 'image' | 'system';
  metadata?: Record<string, any>;
  replyToId?: string;
}

export class MessageService {
  constructor(
    private messageRepo: MessageRepository,
    private chatRepo: ChatRepository,
    private deliveryQueue: MessageDeliveryQueue,
    private socketManager: SocketManager
  ) {}

  async sendMessage(dto: SendMessageDto) {
    // Validate message length
    if (dto.content.length > LIMITS.MESSAGE_MAX_LENGTH) {
      throw new Error(`Message exceeds maximum length of ${LIMITS.MESSAGE_MAX_LENGTH} characters`);
    }

    // Verify user is participant
    const isParticipant = await this.chatRepo.isUserParticipant(dto.chatId, dto.senderId);
    if (!isParticipant) {
      throw new Error('User is not a participant of this chat');
    }

    // Create message
    const message = await this.messageRepo.create({
      id: uuidv4(),
      chatId: dto.chatId,
      senderId: dto.senderId,
      content: dto.content,
      contentType: dto.contentType || 'text',
      metadata: dto.metadata || {},
      replyToId: dto.replyToId,
    });

    // Get all participants except sender
    const participants = await this.chatRepo.getActiveParticipantIds(dto.chatId);
    const recipients = participants.filter(id => id !== dto.senderId);

    // Create delivery records
    await this.messageRepo.createDeliveryRecords(message.id, recipients);

    // Update chat last_message_at and increment unread counts
    await this.chatRepo.updateLastMessageAt(dto.chatId);
    await this.chatRepo.incrementUnreadCounts(dto.chatId, recipients);

    // Queue for reliable delivery
    await this.deliveryQueue.addMessage({
      messageId: message.id,
      chatId: dto.chatId,
      recipients,
    });

    // Try immediate WebSocket delivery
    this.socketManager.broadcastToChat(dto.chatId, 'message:new', {
      ...message,
      sender: await this.getUserInfo(dto.senderId),
    });

    logger.info(`Message sent: ${message.id} in chat ${dto.chatId}`);

    return message;
  }

  async editMessage(messageId: string, userId: string, newContent: string) {
    const message = await this.messageRepo.findById(messageId);

    if (!message) {
      throw new Error('Message not found');
    }

    if (message.senderId !== userId) {
      throw new Error('Cannot edit message from another user');
    }

    if (newContent.length > LIMITS.MESSAGE_MAX_LENGTH) {
      throw new Error('Message exceeds maximum length');
    }

    // Save edit history
    await this.messageRepo.saveEditHistory({
      messageId,
      oldContent: message.content,
      oldMetadata: message.metadata,
    });

    // Update message
    const updatedMessage = await this.messageRepo.update(messageId, {
      content: newContent,
      isEdited: true,
      editedAt: new Date(),
    });

    // Broadcast update
    this.socketManager.broadcastToChat(message.chatId, 'message:edited', {
      messageId,
      content: newContent,
      editedAt: updatedMessage.editedAt,
    });

    return updatedMessage;
  }

  async deleteMessage(messageId: string, userId: string) {
    const message = await this.messageRepo.findById(messageId);

    if (!message) {
      throw new Error('Message not found');
    }

    if (message.senderId !== userId) {
      throw new Error('Cannot delete message from another user');
    }

    // Soft delete
    await this.messageRepo.update(messageId, {
      isDeleted: true,
      deletedAt: new Date(),
      content: '[Deleted]',
    });

    // Broadcast deletion
    this.socketManager.broadcastToChat(message.chatId, 'message:deleted', {
      messageId,
    });
  }

  async getMessages(chatId: string, userId: string, limit: number = 50, cursor?: string) {
    // Verify user is participant
    const isParticipant = await this.chatRepo.isUserParticipant(chatId, userId);
    if (!isParticipant) {
      throw new Error('User is not a participant of this chat');
    }

    const messages = await this.messageRepo.getMessagesByChatId(chatId, limit, cursor);

    return {
      data: messages,
      nextCursor:
        messages.length > 0 ? messages[messages.length - 1].createdAt.toISOString() : null,
      hasMore: messages.length === limit,
    };
  }

  async markAsRead(messageId: string, userId: string) {
    const message = await this.messageRepo.findById(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    // Update delivery status
    await this.messageRepo.updateDeliveryStatus(messageId, userId, 'read');

    // Reset unread count for this chat
    await this.chatRepo.resetUnreadCount(message.chatId, userId);

    // Notify sender about read receipt
    this.socketManager.sendToUser(message.senderId, 'message:read', {
      messageId,
      chatId: message.chatId,
      readBy: userId,
      readAt: new Date(),
    });
  }

  async addReaction(messageId: string, userId: string, emoji: string) {
    const message = await this.messageRepo.findById(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    // Verify user is participant
    const isParticipant = await this.chatRepo.isUserParticipant(message.chatId, userId);
    if (!isParticipant) {
      throw new Error('User is not a participant of this chat');
    }

    const reaction = await this.messageRepo.addReaction(messageId, userId, emoji);

    // Broadcast reaction
    this.socketManager.broadcastToChat(message.chatId, 'reaction:added', {
      messageId,
      userId,
      emoji,
      reactionId: reaction.id,
    });

    return reaction;
  }

  async removeReaction(reactionId: string, userId: string) {
    const reaction = await this.messageRepo.findReactionById(reactionId);
    if (!reaction || reaction.userId !== userId) {
      throw new Error('Reaction not found or unauthorized');
    }

    await this.messageRepo.deleteReaction(reactionId);

    const message = await this.messageRepo.findById(reaction.messageId);

    // Broadcast reaction removal
    this.socketManager.broadcastToChat(message!.chatId, 'reaction:removed', {
      reactionId,
      messageId: reaction.messageId,
    });
  }

  private async getUserInfo(userId: string) {
    // Simplified - would normally use UserRepository
    return { id: userId, username: 'User' };
  }
}
