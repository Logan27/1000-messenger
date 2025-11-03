import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

export class AuthController {
  constructor(private authService: AuthService) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { username, password, displayName } = req.body;

      const deviceInfoRaw = {
        deviceId: req.headers['x-device-id'] as string,
        deviceType: req.headers['x-device-type'] as string,
        deviceName: req.headers['x-device-name'] as string,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      };
      
      const deviceInfo: any = {
        deviceId: deviceInfoRaw.deviceId,
        deviceType: deviceInfoRaw.deviceType,
        deviceName: deviceInfoRaw.deviceName,
      };
      
      if (deviceInfoRaw.ipAddress !== undefined) {
        deviceInfo.ipAddress = deviceInfoRaw.ipAddress;
      }
      if (deviceInfoRaw.userAgent !== undefined) {
        deviceInfo.userAgent = deviceInfoRaw.userAgent;
      }

      const result = await this.authService.register(username, password, deviceInfo, displayName);
      
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { username, password } = req.body;

      const deviceInfoRaw = {
        deviceId: req.headers['x-device-id'] as string,
        deviceType: req.headers['x-device-type'] as string,
        deviceName: req.headers['x-device-name'] as string,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      };
      
      const deviceInfo: any = {
        deviceId: deviceInfoRaw.deviceId,
        deviceType: deviceInfoRaw.deviceType,
        deviceName: deviceInfoRaw.deviceName,
      };
      
      if (deviceInfoRaw.ipAddress !== undefined) {
        deviceInfo.ipAddress = deviceInfoRaw.ipAddress;
      }
      if (deviceInfoRaw.userAgent !== undefined) {
        deviceInfo.userAgent = deviceInfoRaw.userAgent;
      }

      const result = await this.authService.login(username, password, deviceInfo);
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      const result = await this.authService.refreshAccessToken(refreshToken);
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { refreshToken } = req.body;

      await this.authService.logout(userId, refreshToken);
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
