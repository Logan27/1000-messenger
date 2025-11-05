import { Request, Response, NextFunction } from 'express';
import { MessageService } from '../services/message.service';
import { validateMessageContent, sanitizeMessageContent } from '../utils/validation.util';
import '../types/express'; // Import to ensure Express types are augmented

export class MessageController {
  constructor(private messageService: MessageService) {}

  sendMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { chatId } = req.params;
      const userId = req.user!.userId;
      const { content, contentType, metadata, replyToId } = req.body;

      // Validate and sanitize content (T100)
      validateMessageContent(content);
      const sanitizedContent = sanitizeMessageContent(content.trim());

      const message = await this.messageService.sendMessage({
        chatId: chatId!,
        senderId: userId,
        content: sanitizedContent,
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
      const limit = parseInt(req.query['limit'] as string) || 50;
      const cursor = req.query['cursor'] as string;

      const result = await this.messageService.getMessages(chatId!, userId, limit, cursor);

      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  editMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { messageId } = req.params;
      const userId = req.user!.userId;
      const { content } = req.body;

      // Validate and sanitize content (T100)
      validateMessageContent(content);
      const sanitizedContent = sanitizeMessageContent(content.trim());

      const message = await this.messageService.editMessage(messageId!, userId, sanitizedContent);

      res.json({ message });
    } catch (error) {
      next(error);
    }
  };

  deleteMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { messageId } = req.params;
      const userId = req.user!.userId;

      await this.messageService.deleteMessage(messageId!, userId);

      res.json({ message: 'Message deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { messageId } = req.params;
      const userId = req.user!.userId;

      await this.messageService.markAsRead(messageId!, userId);

      res.json({ message: 'Message marked as read' });
    } catch (error) {
      next(error);
    }
  };

  addReaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { messageId } = req.params;
      const userId = req.user!.userId;
      const { emoji } = req.body;

      if (!emoji) {
        res.status(400).json({ error: 'Emoji is required' });
        return;
      }

      const reaction = await this.messageService.addReaction(messageId!, userId, emoji);

      res.json({ reaction });
    } catch (error) {
      next(error);
    }
  };

  removeReaction = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reactionId } = req.params;
      const userId = req.user!.userId;

      await this.messageService.removeReaction(reactionId!, userId);

      res.json({ message: 'Reaction removed successfully' });
    } catch (error) {
      next(error);
    }
  };

  searchMessages = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { q: searchQuery } = req.query;
      const chatId = req.query['chatId'] as string | undefined;
      const cursor = req.query['cursor'] as string | undefined;
      const limit = parseInt(req.query['limit'] as string) || 50;

      if (!searchQuery || typeof searchQuery !== 'string') {
        res.status(400).json({ error: 'Search query is required' });
        return;
      }

      const result = await this.messageService.searchMessages(
        userId,
        searchQuery,
        chatId,
        cursor,
        limit
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}
