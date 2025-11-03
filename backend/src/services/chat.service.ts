import { ChatRepository } from '../repositories/chat.repository';

export class ChatService {
  constructor(_chatRepo: ChatRepository) {
    // TODO: Use _chatRepo when implementing methods
  }

  async getUserChats(_userId: string): Promise<any[]> {
    // TODO: Implement
    return [];
  }

  async getChatById(_chatId: string, _userId: string): Promise<any> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  async getChatBySlug(_slug: string, _userId: string): Promise<any> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  async createDirectChat(_userId: string, _contactId: string): Promise<any> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  async createGroupChat(_userId: string, _data: any): Promise<any> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  async updateChat(_chatId: string, _userId: string, _data: any): Promise<any> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  async addParticipants(_chatId: string, _userId: string, _participantIds: string[]): Promise<void> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  async removeParticipant(_chatId: string, _userId: string, _targetUserId: string): Promise<void> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  async leaveChat(_chatId: string, _userId: string): Promise<void> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  async deleteChat(_chatId: string, _userId: string): Promise<void> {
    // TODO: Implement
    throw new Error('Not implemented');
  }
}
