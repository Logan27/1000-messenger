import { Socket } from 'socket.io';
import { MessageService } from '../../services/message.service';
import { logger } from '../../utils/logger.util';

export class MessageHandler {
  constructor(private messageService: MessageService) {}

  setupHandlers(socket: Socket) {
    const { userId } = socket.data;

    socket.on('message:send', async (data: {
      chatId: string;
      content: string;
      contentType?: 'text' | 'image' | 'system';
      metadata?: Record<string, any>;
      replyToId?: string;
    }) => {
      try {
        const messageDto: any = {
          chatId: data.chatId,
          senderId: userId,
          content: data.content,
        };
        
        if (data.contentType !== undefined) {
          messageDto.contentType = data.contentType;
        }
        if (data.metadata !== undefined) {
          messageDto.metadata = data.metadata;
        }
        if (data.replyToId !== undefined) {
          messageDto.replyToId = data.replyToId;
        }
        
        const message = await this.messageService.sendMessage(messageDto);

          // Send confirmation back to sender
          socket.emit('message:sent', {
            messageId: message.id,
            chatId: data.chatId,
            timestamp: message.createdAt,
          });
        } catch (error) {
          logger.error('Failed to send message', error);
          socket.emit('message:error', {
            error: error instanceof Error ? error.message : 'Failed to send message',
            chatId: data.chatId,
          });
        }
      }
    );

    socket.on('message:edit', async (data: { messageId: string; content: string }) => {
      try {
        await this.messageService.editMessage(data.messageId, userId, data.content);
        socket.emit('message:edit:success', { messageId: data.messageId });
      } catch (error) {
        logger.error('Failed to edit message', error);
        socket.emit('message:edit:error', {
          error: error instanceof Error ? error.message : 'Failed to edit message',
          messageId: data.messageId,
        });
      }
    });

    socket.on('message:delete', async (data: { messageId: string }) => {
      try {
        await this.messageService.deleteMessage(data.messageId, userId);
        socket.emit('message:delete:success', { messageId: data.messageId });
      } catch (error) {
        logger.error('Failed to delete message', error);
        socket.emit('message:delete:error', {
          error: error instanceof Error ? error.message : 'Failed to delete message',
          messageId: data.messageId,
        });
      }
    });

    socket.on('message:delivered', async (data: { messageId: string }) => {
      try {
        await this.messageService.markAsDelivered(data.messageId, userId);
      } catch (error) {
        logger.error('Failed to mark message as delivered', error);
      }
    });

    socket.on('message:read', async (data: { messageId: string }) => {
      try {
        await this.messageService.markAsRead(data.messageId, userId);
      } catch (error) {
        logger.error('Failed to mark message as read', error);
      }
    });

    socket.on('reaction:add', async (data: { messageId: string; emoji: string }) => {
      try {
        await this.messageService.addReaction(data.messageId, userId, data.emoji);
      } catch (error) {
        logger.error('Failed to add reaction', error);
        socket.emit('reaction:error', {
          error: error instanceof Error ? error.message : 'Failed to add reaction',
          messageId: data.messageId,
        });
      }
    });

    socket.on('reaction:remove', async (data: { reactionId: string }) => {
      try {
        await this.messageService.removeReaction(data.reactionId, userId);
      } catch (error) {
        logger.error('Failed to remove reaction', error);
        socket.emit('reaction:error', {
          error: error instanceof Error ? error.message : 'Failed to remove reaction',
          reactionId: data.reactionId,
        });
      }
    });
  }
}
