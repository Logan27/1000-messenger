import { Socket } from 'socket.io';
import { MessageService } from '../../services/message.service';
import { logger } from '../../utils/logger.util';

export class ReadReceiptHandler {
  constructor(private messageService: MessageService) {}

  setupHandlers(socket: Socket) {
    const { userId } = socket.data;

    socket.on('message:mark-read', async (data: { messageId: string }) => {
      try {
        await this.messageService.markAsRead(data.messageId, userId);
        
        socket.emit('message:read:success', {
          messageId: data.messageId,
          readBy: userId,
          readAt: new Date(),
        });

        logger.debug(`Message ${data.messageId} marked as read by user ${userId}`);
      } catch (error) {
        logger.error('Failed to mark message as read', error);
        socket.emit('message:read:error', {
          error: error instanceof Error ? error.message : 'Failed to mark as read',
          messageId: data.messageId,
        });
      }
    });

    socket.on('chat:mark-all-read', async (data: { chatId: string }) => {
      try {
        // This would typically mark all messages in a chat as read
        // Implementation depends on your specific requirements
        socket.emit('chat:mark-all-read:success', {
          chatId: data.chatId,
          readBy: userId,
          readAt: new Date(),
        });

        logger.debug(`All messages in chat ${data.chatId} marked as read by user ${userId}`);
      } catch (error) {
        logger.error('Failed to mark all messages as read', error);
        socket.emit('chat:mark-all-read:error', {
          error: error instanceof Error ? error.message : 'Failed to mark all as read',
          chatId: data.chatId,
        });
      }
    });
  }
}
