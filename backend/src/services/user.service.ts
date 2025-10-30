import { UserRepository } from '../repositories/user.repository';
import { logger } from '../utils/logger.util';

export class UserService {
  constructor(private userRepo: UserRepository) {}

  async getProfile(userId: string) {
    const user = await this.userRepo.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      status: user.status,
      lastSeen: user.lastSeen,
    };
  }

  async getUserById(userId: string) {
    const user = await this.userRepo.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      status: user.status,
    };
  }

  async updateProfile(userId: string, data: { displayName?: string; avatarUrl?: string }) {
    const user = await this.userRepo.update(userId, data);
    
    logger.info(`User profile updated: ${userId}`);

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      status: user.status,
    };
  }

  async searchUsers(query: string, limit: number = 20) {
    const users = await this.userRepo.search(query, limit);
    
    return users.map(user => ({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      status: user.status,
    }));
  }

  async updateStatus(userId: string, status: string) {
    await this.userRepo.updateStatus(userId, status);
    logger.info(`User status updated: ${userId} to ${status}`);
  }
}
