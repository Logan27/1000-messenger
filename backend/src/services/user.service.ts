import { UserRepository } from '../repositories/user.repository';
import { ContactRepository } from '../repositories/contact.repository';
import { ChatRepository } from '../repositories/chat.repository';
import { StorageService } from './storage.service';

/**
 * User profile data transfer object
 * Excludes sensitive information like password hash
 */
export interface UserProfileDto {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  status: string;
  lastSeen?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Profile update data transfer object
 */
export interface UpdateProfileDto {
  displayName?: string;
  avatarUrl?: string;
}

/**
 * UserService
 * Handles user profile operations including viewing, updating, and searching for users
 */
export class UserService {
  private storageService: StorageService;

  constructor(
    private userRepo: UserRepository,
    private contactRepo: ContactRepository,
    private chatRepo: ChatRepository
  ) {
    this.storageService = new StorageService();
  }

  async getProfile(userId: string): Promise<UserProfileDto> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return this.sanitizeUser(user);
  }

  async updateProfile(userId: string, data: UpdateProfileDto): Promise<UserProfileDto> {
    const user = await this.userRepo.update(userId, data);
    return this.sanitizeUser(user);
  }

  async searchUsers(query: string, limit: number = 20): Promise<UserProfileDto[]> {
    const users = await this.userRepo.search(query, limit);
    return users.map(user => this.sanitizeUser(user));
  }

  async getUserById(userId: string, viewerId?: string): Promise<UserProfileDto> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // If viewerId is provided, check if they can view this profile
    if (viewerId && userId !== viewerId) {
      const canView = await this.canViewUserProfile(userId, viewerId);
      if (!canView) {
        throw new Error('You do not have permission to view this profile');
      }
    }

    return this.sanitizeUser(user);
  }

  async updateStatus(userId: string, status: string): Promise<void> {
    const validStatuses = ['online', 'offline', 'away'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status value');
    }

    await this.userRepo.updateStatus(userId, status);
  }

  async updateLastSeen(userId: string): Promise<void> {
    await this.userRepo.updateLastSeen(userId);
  }

  async uploadAvatar(userId: string, file: Express.Multer.File): Promise<string> {
    const uploadResult = await this.storageService.uploadImage(file, userId);
    const avatarUrl = uploadResult.thumbnailUrl!;
    await this.userRepo.update(userId, { avatarUrl });
    return avatarUrl;
  }

  async canViewUserProfile(userId: string, viewerId: string): Promise<boolean> {
    // Users can always view their own profile
    if (userId === viewerId) {
      return true;
    }

    // Check if users are contacts
    const areContacts = await this.contactRepo.areContacts(userId, viewerId);
    if (areContacts) {
      return true;
    }

    // Check if they share any chat
    const sharedChats = await this.chatRepo.findSharedChats(userId, viewerId);
    if (sharedChats.length > 0) {
      return true;
    }

    return false;
  }

  private sanitizeUser(user: any): UserProfileDto {
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      status: user.status,
      lastSeen: user.lastSeen,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
