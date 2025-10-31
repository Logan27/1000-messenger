/**
 * WebSocket Authentication Middleware
 * 
 * Provides JWT-based authentication for Socket.IO connections.
 * Verifies access tokens and validates active sessions before allowing WebSocket connections.
 * 
 * Features:
 * - JWT access token verification
 * - Session validation against Redis/Database
 * - Connection metadata logging
 * - Security logging for failed authentication attempts
 * - Request context attachment (userId, sessionId)
 * 
 * Usage:
 * ```typescript
 * const socketAuthMiddleware = new SocketAuthMiddleware(authService, sessionService);
 * io.use(socketAuthMiddleware.authenticate);
 * ```
 * 
 * @module websocket/middleware/socket-auth
 */

import { Socket } from 'socket.io';
import { AuthService } from '../../services/auth.service';
import { SessionService } from '../../services/session.service';
import { logger } from '../../utils/logger.util';

/**
 * Socket Data Interface
 * Defines the data structure stored in socket.data after successful authentication
 */
export interface SocketData {
  userId: string;
  sessionId: string;
}

/**
 * WebSocket Authentication Middleware Class
 * 
 * Handles JWT verification and session validation for Socket.IO connections.
 * Ensures only authenticated users with active sessions can establish WebSocket connections.
 */
export class SocketAuthMiddleware {
  constructor(
    private authService: AuthService,
    private sessionService: SessionService
  ) {}

  /**
   * Authenticate WebSocket connection
   * 
   * Verifies the JWT access token and validates the session before allowing connection.
   * If valid, attaches user information to socket.data and proceeds to next handler.
   * If invalid, rejects the connection with an appropriate error message.
   * 
   * @param socket - Socket.IO socket instance
   * @param next - Socket.IO next function
   * 
   * @example
   * ```typescript
   * // In SocketManager setup
   * const authMiddleware = new SocketAuthMiddleware(authService, sessionService);
   * io.use(authMiddleware.authenticate);
   * ```
   */
  authenticate = async (socket: Socket, next: (err?: Error) => void): Promise<void> => {
    try {
      // Extract token from handshake authentication data
      const token = socket.handshake.auth['token'] as string | undefined;
      
      if (!token) {
        logger.warn('WebSocket authentication failed: No token provided', {
          socketId: socket.id,
          address: socket.handshake.address,
          headers: socket.handshake.headers['user-agent'],
        });
        return next(new Error('Authentication token required'));
      }

      // Verify access token and extract user ID
      const { userId } = await this.authService.verifyAccessToken(token);

      // Check if session exists and is valid
      const session = await this.sessionService.findByToken(token);
      if (!session || !session.isActive) {
        logger.warn('WebSocket authentication failed: Invalid or expired session', {
          socketId: socket.id,
          userId,
          address: socket.handshake.address,
          hasSession: !!session,
          isActive: session?.isActive,
        });
        return next(new Error('Invalid or expired session'));
      }

      // Store user data in socket for access in event handlers
      socket.data = {
        userId,
        sessionId: session.id,
      } as SocketData;

      // Log successful authentication (debug level to avoid noise)
      logger.debug('WebSocket authenticated successfully', {
        socketId: socket.id,
        userId,
        sessionId: session.id,
      });

      next();
    } catch (error) {
      // Handle authentication errors
      logger.error('WebSocket authentication error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        socketId: socket.id,
        address: socket.handshake.address,
      });
      
      // Return generic error message to client for security
      next(new Error('Authentication failed'));
    }
  };
}
