import { Request, Response, NextFunction } from 'express';
import { MessageService } from '../services/message.service';
import { logger } from '../utils/logger.util';

export class MessageController {
  constructor(private messageService: MessageService) {}

  sendMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { chatId } = req.params;
      const userId = req.user!.userId;
      const { content, contentType, metadata, replyToId } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: 'Message content is required' });
      }

      const message = await this.messageService.sendMessage({
        chatId,
        senderId: userId,
        content: content.trim(),
        contentType,
        metadata,
        replyToId,
      });
      
      res.status(201).json({ message });
    } catch (error) {
      next(error);
    }
  };

  getMessages = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { chatId } = req.params;
      const userId = req.user!.userId;
      const limit = parseInt(req.query.limit as string) || 50;
      const cursor = req.query.cursor as string;

      const result = await this.messageService.getMessages(chatId, userId, limit, cursor);
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  editMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { messageId } = req.params;
      const userId = req.user!.userId;
      const { content } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: 'Message content is required' });
      }

      const message = await this.messageService.editMessage(messageId, userId, content.trim());
      
      res.json({ message });
    } catch (error) {
      next(error);
    }
  };

  deleteMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { messageId } = req.params;
      const userId = req.user!.userId;

      await this.messageService.deleteMessage(messageId, userId);
      
      res.json({ message: 'Message deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { messageId } = req.params;
      const userId = req.user!.userId;

      await this.messageService.markAsRead(messageId, userId);
      
      res.json({ message: 'Message marked as read' });
    } catch (error) {
      next(error);
    }
  };

  addReaction = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { messageId } = req.params;
      const userId = req.user!.userId;
      const { emoji } = req.body;

      if (!emoji) {
        return res.status(400).json({ error: 'Emoji is required' });
      }

      const reaction = await this.messageService.addReaction(messageId, userId, emoji);
      
      res.json({ reaction });
    } catch (error) {
      next(error);
    }
  };

  removeReaction = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reactionId } = req.params;
      const userId = req.user!.userId;

      await this.messageService.removeReaction(reactionId, userId);
      
      res.json({ message: 'Reaction removed successfully' });
    } catch (error) {
      next(error);
    }
  };
}
