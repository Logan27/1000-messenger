import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';

export class UserController {
  constructor(private userService: UserService) {}

  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const user = await this.userService.getProfile(userId);

      res.json({ user });
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { displayName, avatarUrl } = req.body;

      const user = await this.userService.updateProfile(userId, { displayName, avatarUrl });

      res.json({ user });
    } catch (error) {
      next(error);
    }
  };

  searchUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { q } = req.query;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const users = await this.userService.searchUsers(q, limit);

      res.json({ users });
    } catch (error) {
      next(error);
    }
  };

  getUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const user = await this.userService.getUserById(userId);

      res.json({ user });
    } catch (error) {
      next(error);
    }
  };
}
