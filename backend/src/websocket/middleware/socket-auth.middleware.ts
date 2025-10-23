import { Socket } from 'socket.io';
import { AuthService } from '../../services/auth.service';
import { SessionService } from '../../services/session.service';
import { logger } from '../utils/logger.util';

export class SocketAuthMiddleware {
  constructor(
    private authService: AuthService,
    private sessionService: SessionService
  ) {}

  async authenticate(socket: Socket, next: (err?: Error) => void) {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // Verify access token
      const { userId } = await this.authService.verifyAccessToken(token);
      
      // Check if session exists and is valid
      const session = await this.sessionService.findByToken(token);
      if (!session || !session.isActive) {
        return next(new Error('Invalid or expired session'));
      }

      // Store user data in socket
      socket.data = {
        userId,
        sessionId: session.id,
      };

      next();
    } catch (error) {
      logger.error('Socket authentication failed', error);
      next(new Error('Authentication failed'));
    }
  }
}
