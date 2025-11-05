import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { getSocketManager } from '../websocket/socket.manager';
import { logger } from '../utils/logger.util';

export class UserController {
  constructor(private userService: UserService) {}

  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const user = await this.userService.getProfile(userId);

      res.json({ user });
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { displayName, avatarUrl, status } = req.body;

      await this.userService.updateProfile(userId, { displayName, avatarUrl });

      if (status) {
        await this.userService.updateStatus(userId, status);
      }

      const updatedUser = await this.userService.getProfile(userId);

      // Broadcast profile update to contacts (T212)
      this.broadcastProfileUpdate(userId, updatedUser);

      res.json({ user: updatedUser });
    } catch (error) {
      next(error);
    }
  };

  updateAvatar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const file = req.file;

      if (!file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const avatarUrl = await this.userService.uploadAvatar(userId, file);
      const updatedUser = await this.userService.getProfile(userId);

      // Broadcast profile update to contacts (T212)
      this.broadcastProfileUpdate(userId, updatedUser);

      res.json({ user: updatedUser, avatarUrl });
    } catch (error) {
      next(error);
    }
  };

  searchUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { q } = req.query;
      const limit = parseInt(req.query['limit'] as string) || 20;

      if (!q || typeof q !== 'string') {
        res.status(400).json({ error: 'Search query is required' });
        return;
      }

      const users = await this.userService.searchUsers(q, limit);

      res.json({ users });
    } catch (error) {
      next(error);
    }
  };

  getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.params['id'] || req.params['userId'];
      const viewerId = req.user!.userId;
      const user = await this.userService.getUserById(userId!, viewerId);

      res.json({ user });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Broadcast profile update to all user's contacts via WebSocket (T212)
   */
  private broadcastProfileUpdate(userId: string, updatedUser: any): void {
    try {
      const socketManager = getSocketManager();
      if (!socketManager) {
        logger.warn('SocketManager not available, skipping profile broadcast');
        return;
      }

      // Broadcast to all connected clients (they will filter by contact relationship)
      socketManager.broadcast('user:profile:update', {
        userId,
        user: updatedUser,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Profile update broadcasted for user ${userId}`);
    } catch (error) {
      logger.error('Failed to broadcast profile update', error);
    }
  }
}
