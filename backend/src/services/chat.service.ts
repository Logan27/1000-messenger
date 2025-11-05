import { ChatRepository } from '../repositories/chat.repository';
import { PARTICIPANT_ROLE, LIMITS, CHAT_TYPE } from '../config/constants';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a URL-friendly slug from a chat name
 * T220: Slug generation for deep linking
 */
function generateSlug(name: string, chatId: string): string {
  // Convert to lowercase and replace spaces/special chars with hyphens
  const baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

  // Add first 8 chars of chatId to ensure uniqueness
  const uniqueSuffix = chatId.substring(0, 8);

  return `${baseSlug}-${uniqueSuffix}`;
}

export class ChatService {
  constructor(private chatRepo: ChatRepository) {}

  async getUserChats(userId: string): Promise<any[]> {
    return this.chatRepo.getUserChats(userId);
  }

  async getChatById(chatId: string, userId: string): Promise<any> {
    const chat = await this.chatRepo.findById(chatId);
    
    if (!chat) {
      throw new Error('Chat not found');
    }

    // Verify user is participant
    const isParticipant = await this.chatRepo.isUserParticipant(chatId, userId);
    if (!isParticipant) {
      throw new Error('Unauthorized');
    }

    const participants = await this.chatRepo.getChatParticipants(chatId);

    return {
      ...chat,
      participants,
    };
  }

  async getChatBySlug(slug: string, userId: string): Promise<any> {
    const chat = await this.chatRepo.findBySlug(slug);
    
    if (!chat) {
      throw new Error('Chat not found');
    }

    // Verify user is participant
    const isParticipant = await this.chatRepo.isUserParticipant(chat.id, userId);
    if (!isParticipant) {
      throw new Error('Unauthorized');
    }

    const participants = await this.chatRepo.getChatParticipants(chat.id);

    return {
      ...chat,
      participants,
    };
  }

  async createDirectChat(userId: string, contactId: string): Promise<any> {
    // Check if direct chat already exists to prevent duplicates
    const existingChat = await this.chatRepo.findDirectChat(userId, contactId);
    
    if (existingChat) {
      // Return existing chat with participants
      const participants = await this.chatRepo.getChatParticipants(existingChat.id);
      return {
        ...existingChat,
        participants,
      };
    }

    // Create new direct chat
    const chatId = uuidv4();
    const chat = await this.chatRepo.create({
      id: chatId,
      type: CHAT_TYPE.DIRECT,
    });

    // Add both participants
    await this.chatRepo.addParticipant(chatId, userId, PARTICIPANT_ROLE.MEMBER);
    await this.chatRepo.addParticipant(chatId, contactId, PARTICIPANT_ROLE.MEMBER);

    // Get participants for response
    const participants = await this.chatRepo.getChatParticipants(chatId);

    return {
      ...chat,
      participants,
    };
  }

  async createGroupChat(userId: string, data: { name: string; participantIds: string[] }): Promise<any> {
    const { name, participantIds } = data;

    // Validate participant count (creator + participants)
    if (participantIds.length + 1 > LIMITS.GROUP_MAX_PARTICIPANTS) {
      throw new Error(`Maximum ${LIMITS.GROUP_MAX_PARTICIPANTS} participants allowed`);
    }

    // Create group chat with slug (T220)
    const chatId = uuidv4();
    const slug = generateSlug(name, chatId);

    const chat = await this.chatRepo.create({
      id: chatId,
      type: CHAT_TYPE.GROUP,
      name,
      slug,
      ownerId: userId,
    });

    // Add creator as owner
    await this.chatRepo.addParticipant(chatId, userId, PARTICIPANT_ROLE.OWNER);

    // Add other participants as members
    for (const participantId of participantIds) {
      if (participantId !== userId) {
        await this.chatRepo.addParticipant(chatId, participantId, PARTICIPANT_ROLE.MEMBER);
      }
    }

    // Get participants for response
    const participants = await this.chatRepo.getChatParticipants(chatId);

    return {
      ...chat,
      participants,
    };
  }

  async updateChat(chatId: string, userId: string, data: { name?: string; avatarUrl?: string }): Promise<any> {
    const chat = await this.chatRepo.findById(chatId);

    if (!chat) {
      throw new Error('Chat not found');
    }

    // Only group chats can be updated
    if (chat.type !== CHAT_TYPE.GROUP) {
      throw new Error('Cannot update direct chat');
    }

    // Check if user has permission (owner or admin)
    const role = await this.chatRepo.getParticipantRole(chatId, userId);
    if (!role || (role !== PARTICIPANT_ROLE.OWNER && role !== PARTICIPANT_ROLE.ADMIN)) {
      throw new Error('Unauthorized: Only owner or admin can update group');
    }

    // Update chat with new slug if name changed (T220)
    const updateData: any = { ...data };
    if (data.name) {
      updateData.slug = generateSlug(data.name, chatId);
    }

    const updatedChat = await this.chatRepo.update(chatId, updateData);
    const participants = await this.chatRepo.getChatParticipants(chatId);

    return {
      ...updatedChat,
      participants,
    };
  }

  async addParticipants(chatId: string, userId: string, participantIds: string[]): Promise<void> {
    const chat = await this.chatRepo.findById(chatId);
    
    if (!chat) {
      throw new Error('Chat not found');
    }

    // Only group chats can add participants
    if (chat.type !== CHAT_TYPE.GROUP) {
      throw new Error('Cannot add participants to direct chat');
    }

    // Check if user has permission (owner or admin)
    const role = await this.chatRepo.getParticipantRole(chatId, userId);
    if (!role || (role !== PARTICIPANT_ROLE.OWNER && role !== PARTICIPANT_ROLE.ADMIN)) {
      throw new Error('Unauthorized: Only owner or admin can add participants');
    }

    // Check participant limit
    const currentCount = await this.chatRepo.countActiveParticipants(chatId);
    if (currentCount + participantIds.length > LIMITS.GROUP_MAX_PARTICIPANTS) {
      throw new Error(`Maximum ${LIMITS.GROUP_MAX_PARTICIPANTS} participants allowed`);
    }

    // Get user repository to fetch usernames for system messages
    const { UserRepository } = await import('../repositories/user.repository');
    const userRepo = new UserRepository();

    // Add participants
    for (const participantId of participantIds) {
      await this.chatRepo.addParticipant(chatId, participantId, PARTICIPANT_ROLE.MEMBER);
      
      // Create system notification
      const user = await userRepo.findById(participantId);
      if (user) {
        await this.createSystemMessage(chatId, `${user.username} was added to the group`);
      }
    }
  }

  async removeParticipant(chatId: string, userId: string, targetUserId: string): Promise<void> {
    const chat = await this.chatRepo.findById(chatId);
    
    if (!chat) {
      throw new Error('Chat not found');
    }

    // Only group chats can remove participants
    if (chat.type !== CHAT_TYPE.GROUP) {
      throw new Error('Cannot remove participants from direct chat');
    }

    // Check if user has permission (owner or admin)
    const role = await this.chatRepo.getParticipantRole(chatId, userId);
    if (!role || (role !== PARTICIPANT_ROLE.OWNER && role !== PARTICIPANT_ROLE.ADMIN)) {
      throw new Error('Unauthorized: Only owner or admin can remove participants');
    }

    // Cannot remove the owner
    const targetRole = await this.chatRepo.getParticipantRole(chatId, targetUserId);
    if (targetRole === PARTICIPANT_ROLE.OWNER) {
      throw new Error('Cannot remove group owner');
    }

    // Get user repository to fetch username for system message
    const { UserRepository } = await import('../repositories/user.repository');
    const userRepo = new UserRepository();

    // Remove participant
    await this.chatRepo.removeParticipant(chatId, targetUserId);

    // Create system notification
    const user = await userRepo.findById(targetUserId);
    if (user) {
      await this.createSystemMessage(chatId, `${user.username} was removed from the group`);
    }
  }

  async leaveChat(chatId: string, userId: string): Promise<void> {
    const chat = await this.chatRepo.findById(chatId);
    
    if (!chat) {
      throw new Error('Chat not found');
    }

    // Only group chats can be left (direct chats are permanent)
    if (chat.type !== CHAT_TYPE.GROUP) {
      throw new Error('Cannot leave direct chat');
    }

    const role = await this.chatRepo.getParticipantRole(chatId, userId);

    // If owner is leaving, transfer ownership to another admin or member
    if (role === PARTICIPANT_ROLE.OWNER) {
      await this.handleOwnerLeaving(chatId, userId);
    }

    // Get user repository to fetch username for system message
    const { UserRepository } = await import('../repositories/user.repository');
    const userRepo = new UserRepository();

    // Remove user from chat
    await this.chatRepo.removeParticipant(chatId, userId);

    // Create system notification
    const user = await userRepo.findById(userId);
    if (user) {
      await this.createSystemMessage(chatId, `${user.username} left the group`);
    }
  }

  async deleteChat(chatId: string, userId: string): Promise<void> {
    const chat = await this.chatRepo.findById(chatId);
    
    if (!chat) {
      throw new Error('Chat not found');
    }

    // Only group chats can be deleted
    if (chat.type !== CHAT_TYPE.GROUP) {
      throw new Error('Cannot delete direct chat');
    }

    // Only owner can delete
    const role = await this.chatRepo.getParticipantRole(chatId, userId);
    if (role !== PARTICIPANT_ROLE.OWNER) {
      throw new Error('Unauthorized: Only owner can delete group');
    }

    // Soft delete chat
    await this.chatRepo.delete(chatId);
  }

  private async handleOwnerLeaving(chatId: string, ownerId: string): Promise<void> {
    const participants = await this.chatRepo.getChatParticipants(chatId);

    // Find next owner: first admin, or first member
    const nextOwner = participants.find(
      (p) => p.user_id !== ownerId && p.role === PARTICIPANT_ROLE.ADMIN
    ) || participants.find(
      (p) => p.user_id !== ownerId && p.role === PARTICIPANT_ROLE.MEMBER
    );

    if (nextOwner) {
      // Transfer ownership
      await this.chatRepo.transferOwnership(chatId, nextOwner.user_id);
    }
    // If no other participants, chat will be empty after owner leaves
  }

  async createSystemMessage(chatId: string, content: string): Promise<void> {
    // Import MessageRepository dynamically to avoid circular dependency
    const { MessageRepository } = await import('../repositories/message.repository');
    const messageRepo = new MessageRepository();

    const messageData = {
      id: uuidv4(),
      chatId,
      senderId: null, // System messages have no sender
      content,
      contentType: 'system' as const,
      metadata: {},
    };

    await messageRepo.create(messageData);
  }
}
