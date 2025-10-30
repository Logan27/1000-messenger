import { v4 as uuidv4 } from 'uuid';
import { ChatRepository } from '../repositories/chat.repository';
import { CHAT_TYPE, PARTICIPANT_ROLE, LIMITS } from '../config/constants';
import { logger } from '../utils/logger.util';

export class ChatService {
  constructor(private chatRepo: ChatRepository) {}

  async getUserChats(userId: string) {
    const chats = await this.chatRepo.getUserChats(userId);
    return chats;
  }

  async getChatById(chatId: string, userId: string) {
    const chat = await this.chatRepo.findById(chatId);
    
    if (!chat) {
      throw new Error('Chat not found');
    }

    const isParticipant = await this.chatRepo.isUserParticipant(chatId, userId);
    if (!isParticipant) {
      throw new Error('You are not a participant of this chat');
    }

    return chat;
  }

  async getChatBySlug(slug: string, userId: string) {
    const chat = await this.chatRepo.findBySlug(slug);
    
    if (!chat) {
      throw new Error('Chat not found');
    }

    const isParticipant = await this.chatRepo.isUserParticipant(chat.id, userId);
    if (!isParticipant) {
      throw new Error('You are not a participant of this chat');
    }

    return chat;
  }

  async createDirectChat(userId: string, contactId: string) {
    if (userId === contactId) {
      throw new Error('Cannot create chat with yourself');
    }

    const existingChat = await this.chatRepo.findDirectChat(userId, contactId);
    if (existingChat) {
      return existingChat;
    }

    const chatId = uuidv4();
    const chat = await this.chatRepo.create({
      id: chatId,
      type: CHAT_TYPE.DIRECT,
    });

    await this.chatRepo.addParticipant(chatId, userId, PARTICIPANT_ROLE.MEMBER);
    await this.chatRepo.addParticipant(chatId, contactId, PARTICIPANT_ROLE.MEMBER);

    logger.info(`Direct chat created: ${chatId} between ${userId} and ${contactId}`);

    return chat;
  }

  async createGroupChat(userId: string, name: string, participantIds: string[]) {
    if (participantIds.length > LIMITS.GROUP_MAX_PARTICIPANTS - 1) {
      throw new Error(`Maximum ${LIMITS.GROUP_MAX_PARTICIPANTS} participants allowed`);
    }

    const chatId = uuidv4();
    const slug = this.generateSlug(name);

    const chat = await this.chatRepo.create({
      id: chatId,
      type: CHAT_TYPE.GROUP,
      name,
      slug,
      ownerId: userId,
    });

    await this.chatRepo.addParticipant(chatId, userId, PARTICIPANT_ROLE.ADMIN);

    for (const participantId of participantIds) {
      if (participantId !== userId) {
        await this.chatRepo.addParticipant(chatId, participantId, PARTICIPANT_ROLE.MEMBER);
      }
    }

    logger.info(`Group chat created: ${chatId} by ${userId}`);

    return chat;
  }

  async updateChat(chatId: string, userId: string, data: { name?: string; avatarUrl?: string }) {
    const chat = await this.chatRepo.findById(chatId);
    
    if (!chat) {
      throw new Error('Chat not found');
    }

    if (chat.type === CHAT_TYPE.DIRECT) {
      throw new Error('Cannot update direct chat');
    }

    if (chat.ownerId !== userId) {
      throw new Error('Only chat owner can update chat');
    }

    const updatedChat = await this.chatRepo.update(chatId, data);
    logger.info(`Chat updated: ${chatId} by ${userId}`);

    return updatedChat;
  }

  async addParticipants(chatId: string, userId: string, participantIds: string[]) {
    const chat = await this.chatRepo.findById(chatId);
    
    if (!chat) {
      throw new Error('Chat not found');
    }

    if (chat.type === CHAT_TYPE.DIRECT) {
      throw new Error('Cannot add participants to direct chat');
    }

    if (chat.ownerId !== userId) {
      throw new Error('Only chat owner can add participants');
    }

    const currentCount = await this.chatRepo.countActiveParticipants(chatId);
    if (currentCount + participantIds.length > LIMITS.GROUP_MAX_PARTICIPANTS) {
      throw new Error(`Maximum ${LIMITS.GROUP_MAX_PARTICIPANTS} participants allowed`);
    }

    for (const participantId of participantIds) {
      await this.chatRepo.addParticipant(chatId, participantId, PARTICIPANT_ROLE.MEMBER);
    }

    logger.info(`Participants added to chat ${chatId}: ${participantIds.join(', ')}`);
  }

  async removeParticipant(chatId: string, userId: string, targetUserId: string) {
    const chat = await this.chatRepo.findById(chatId);
    
    if (!chat) {
      throw new Error('Chat not found');
    }

    if (chat.type === CHAT_TYPE.DIRECT) {
      throw new Error('Cannot remove participant from direct chat');
    }

    if (chat.ownerId !== userId) {
      throw new Error('Only chat owner can remove participants');
    }

    if (targetUserId === userId) {
      throw new Error('Use leave endpoint to leave chat');
    }

    await this.chatRepo.removeParticipant(chatId, targetUserId);
    logger.info(`Participant removed from chat ${chatId}: ${targetUserId}`);
  }

  async leaveChat(chatId: string, userId: string) {
    const chat = await this.chatRepo.findById(chatId);
    
    if (!chat) {
      throw new Error('Chat not found');
    }

    const isParticipant = await this.chatRepo.isUserParticipant(chatId, userId);
    if (!isParticipant) {
      throw new Error('You are not a participant of this chat');
    }

    await this.chatRepo.removeParticipant(chatId, userId);
    logger.info(`User left chat ${chatId}: ${userId}`);
  }

  async deleteChat(chatId: string, userId: string) {
    const chat = await this.chatRepo.findById(chatId);
    
    if (!chat) {
      throw new Error('Chat not found');
    }

    if (chat.type === CHAT_TYPE.GROUP && chat.ownerId !== userId) {
      throw new Error('Only chat owner can delete chat');
    }

    if (chat.type === CHAT_TYPE.DIRECT) {
      const isParticipant = await this.chatRepo.isUserParticipant(chatId, userId);
      if (!isParticipant) {
        throw new Error('You are not a participant of this chat');
      }
    }

    await this.chatRepo.delete(chatId);
    logger.info(`Chat deleted: ${chatId} by ${userId}`);
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50) + '-' + uuidv4().substring(0, 8);
  }
}
