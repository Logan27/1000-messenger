import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { logger } from '../utils/logger.util';

export class AuthController {
  constructor(private authService: AuthService) {}

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      const user = await this.authService.register(username, password);
      
      res.status(201).json({ user });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      const deviceInfo = {
        deviceId: req.headers['x-device-id'] as string,
        deviceType: req.headers['x-device-type'] as string,
        deviceName: req.headers['x-device-name'] as string,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      };

      const result = await this.authService.login(username, password, deviceInfo);
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token is required' });
      }

      const result = await this.authService.refreshAccessToken(refreshToken);
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { refreshToken } = req.body;

      await this.authService.logout(userId, refreshToken);
      
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  };
}
