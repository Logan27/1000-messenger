import { ContactRepository } from '../repositories/contact.repository';
import { ChatRepository } from '../repositories/chat.repository';

export class UserService {
  constructor(
    private contactRepo: ContactRepository,
    private chatRepo: ChatRepository
  ) {}

  async canViewUserProfile(userId: string, viewerId: string): Promise<boolean> {
    // Check if users are contacts
    const areContacts = await this.contactRepo.areContacts(userId, viewerId);
    if (areContacts) return true;
    
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
    
    return false;
  }
}
