import { Request, Response, NextFunction } from 'express';
import { ChatService } from '../services/chat.service';
import { LIMITS } from '../config/constants';

export class ChatController {
  constructor(private chatService: ChatService) {}

  getUserChats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const chats = await this.chatService.getUserChats(userId);
      
      res.json({ chats });
    } catch (error) {
      next(error);
    }
  };

  getChatById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { chatId } = req.params;
      const userId = req.user!.userId;

      const chat = await this.chatService.getChatById(chatId, userId);
      
      res.json({ chat });
    } catch (error) {
      next(error);
    }
  };

  getChatBySlug = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;
      const userId = req.user!.userId;

      const chat = await this.chatService.getChatBySlug(slug, userId);
      
      res.json({ chat });
    } catch (error) {
      next(error);
    }
  };

  createDirectChat = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { contactId } = req.body;

      const chat = await this.chatService.createDirectChat(userId, contactId);
      
      res.status(201).json({ chat });
    } catch (error) {
      next(error);
    }
  };

  createGroupChat = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { name, participantIds } = req.body;

      if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: 'Group name is required' });
      }

      if (!participantIds || participantIds.length === 0) {
        return res.status(400).json({ error: 'At least one participant is required' });
      }

      if (participantIds.length > LIMITS.GROUP_MAX_PARTICIPANTS - 1) {
        return res.status(400).json({ 
          error: `Maximum ${LIMITS.GROUP_MAX_PARTICIPANTS} participants allowed` 
        });
      }

      const chat = await this.chatService.createGroupChat(userId, name, participantIds);
      
      res.status(201).json({ chat });
    } catch (error) {
      next(error);
    }
  };

  updateChat = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { chatId } = req.params;
      const userId = req.user!.userId;
      const { name, avatarUrl } = req.body;

      const chat = await this.chatService.updateChat(chatId, userId, { name, avatarUrl });
      
      res.json({ chat });
    } catch (error) {
      next(error);
    }
  };

  addParticipants = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { chatId } = req.params;
      const userId = req.user!.userId;
      const { participantIds } = req.body;

      if (!participantIds || participantIds.length === 0) {
        return res.status(400).json({ error: 'Participant IDs required' });
      }

      await this.chatService.addParticipants(chatId, userId, participantIds);
      
      res.json({ message: 'Participants added successfully' });
    } catch (error) {
      next(error);
    }
  };

  removeParticipant = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { chatId, userId: targetUserId } = req.params;
      const userId = req.user!.userId;

      await this.chatService.removeParticipant(chatId, userId, targetUserId);
      
      res.json({ message: 'Participant removed successfully' });
    } catch (error) {
      next(error);
    }
  };

  leaveChat = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { chatId } = req.params;
      const userId = req.user!.userId;

      await this.chatService.leaveChat(chatId, userId);
      
      res.json({ message: 'Left chat successfully' });
    } catch (error) {
      next(error);
    }
  };

  deleteChat = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { chatId } = req.params;
      const userId = req.user!.userId;

      await this.chatService.deleteChat(chatId, userId);
      
      res.json({ message: 'Chat deleted successfully' });
    } catch (error) {
      next(error);
    }
  };
}
