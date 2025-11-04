import { Socket } from 'socket.io';
import { logger } from '../../utils/logger.util';

export class TypingHandler {
  private typingUsers = new Map<string, Set<string>>(); // chatId -> Set of userIds
  private typingTimeouts = new Map<string, NodeJS.Timeout>(); // userId-chatId -> timeout

  setupHandlers(socket: Socket) {
    const { userId } = socket.data;

    socket.on('typing:start', (data: { chatId: string }) => {
      try {
        if (!this.typingUsers.has(data.chatId)) {
          this.typingUsers.set(data.chatId, new Set());
        }

        this.typingUsers.get(data.chatId)!.add(userId);

        // Broadcast to other users in the chat
        socket.to(`chat:${data.chatId}`).emit('typing:start', {
          chatId: data.chatId,
          userId,
        });

        // Clear existing timeout
        const timeoutKey = `${userId}-${data.chatId}`;
        const existingTimeout = this.typingTimeouts.get(timeoutKey);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        // Auto-stop typing after 3 seconds
        const timeout = setTimeout(() => {
          this.stopTyping(userId, data.chatId, socket);
          this.typingTimeouts.delete(timeoutKey);
        }, 3000);

        this.typingTimeouts.set(timeoutKey, timeout);

        logger.debug(`User ${userId} started typing in chat ${data.chatId}`);
      } catch (error) {
        logger.error('Failed to handle typing start', error);
      }
    });

    socket.on('typing:stop', (data: { chatId: string }) => {
      try {
        // Clear timeout if exists
        const timeoutKey = `${userId}-${data.chatId}`;
        const existingTimeout = this.typingTimeouts.get(timeoutKey);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
          this.typingTimeouts.delete(timeoutKey);
        }

        this.stopTyping(userId, data.chatId, socket);
      } catch (error) {
        logger.error('Failed to handle typing stop', error);
      }
    });

    // Clean up when user disconnects
    socket.on('disconnect', () => {
      this.cleanupUserTyping(userId);
    });
  }

  private stopTyping(userId: string, chatId: string, socket: Socket) {
    const chatTypingUsers = this.typingUsers.get(chatId);
    if (chatTypingUsers) {
      chatTypingUsers.delete(userId);

      // If no one is typing, clean up the chat entry
      if (chatTypingUsers.size === 0) {
        this.typingUsers.delete(chatId);
      }
    }

    // Broadcast to other users in the chat
    socket.to(`chat:${chatId}`).emit('typing:stop', {
      chatId,
      userId,
    });

    logger.debug(`User ${userId} stopped typing in chat ${chatId}`);
  }

  private cleanupUserTyping(userId: string) {
    // Clear all timeouts for this user
    for (const [key, timeout] of this.typingTimeouts.entries()) {
      if (key.startsWith(`${userId}-`)) {
        clearTimeout(timeout);
        this.typingTimeouts.delete(key);
      }
    }

    // Remove user from all typing sets
    for (const [chatId, users] of this.typingUsers.entries()) {
      if (users.has(userId)) {
        users.delete(userId);

        // If no one is typing, clean up the chat entry
        if (users.size === 0) {
          this.typingUsers.delete(chatId);
        }
      }
    }
  }

  getTypingUsers(chatId: string): string[] {
    const users = this.typingUsers.get(chatId);
    return users ? Array.from(users) : [];
  }
}
