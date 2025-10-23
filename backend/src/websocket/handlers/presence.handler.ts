import { Socket } from 'socket.io';
import { UserRepository } from '../../repositories/user.repository';
import { logger } from '../../utils/logger.util';

export class PresenceHandler {
  constructor(private userRepo: UserRepository) {}

  setupHandlers(socket: Socket) {
    const { userId } = socket.data;

    socket.on('presence:update', async (data: { status: 'online' | 'away' | 'offline' }) => {
      try {
        await this.userRepo.updateStatus(userId, data.status);
        
        // Broadcast status change to all connected clients
        socket.broadcast.emit('user:status', {
          userId,
          status: data.status,
          timestamp: new Date(),
        });

        logger.info(`User ${userId} status updated to ${data.status}`);
      } catch (error) {
        logger.error('Failed to update user presence', error);
        socket.emit('presence:error', {
          error: 'Failed to update status',
        });
      }
    });

    socket.on('presence:heartbeat', async () => {
      try {
        await this.userRepo.updateLastSeen(userId);
        socket.emit('presence:heartbeat:ack');
      } catch (error) {
        logger.error('Failed to update heartbeat', error);
      }
    });
  }
}
