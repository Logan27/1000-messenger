import { Socket } from 'socket.io';
import { logger } from '../../utils/logger.util';

export class TypingHandler {
  private typingUsers = new Map<string, Set<string>>(); // chatId -> Set of userIds

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

        logger.debug(`User ${userId} started typing in chat ${data.chatId}`);
      } catch (error) {
        logger.error('Failed to handle typing start', error);
      }
    });

    socket.on('typing:stop', (data: { chatId: string }) => {
      try {
        const chatTypingUsers = this.typingUsers.get(data.chatId);
        if (chatTypingUsers) {
          chatTypingUsers.delete(userId);

          // If no one is typing, clean up the chat entry
          if (chatTypingUsers.size === 0) {
            this.typingUsers.delete(data.chatId);
          }
        }

        // Broadcast to other users in the chat
        socket.to(`chat:${data.chatId}`).emit('typing:stop', {
          chatId: data.chatId,
          userId,
        });

        logger.debug(`User ${userId} stopped typing in chat ${data.chatId}`);
      } catch (error) {
        logger.error('Failed to handle typing stop', error);
      }
    });

    // Clean up when user disconnects
    socket.on('disconnect', () => {
      this.cleanupUserTyping(userId);
    });
  }

  private cleanupUserTyping(userId: string) {
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
