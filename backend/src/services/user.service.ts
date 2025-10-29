import { UserRepository } from '../repositories/user.repository';
import { ContactRepository } from '../repositories/contact.repository';
import { ChatRepository } from '../repositories/chat.repository';

export class UserService {
  constructor(
    private _userRepo: UserRepository,
    private contactRepo: ContactRepository,
    private chatRepo: ChatRepository
  ) {}

  async canViewUserProfile(userId: string, viewerId: string): Promise<boolean> {
    // Check if users are contacts
    const areContacts = await this.contactRepo.areContacts(userId, viewerId);
    if (areContacts) return true;
    
    // Check if they share any chat
    const sharedChats = await this.chatRepo.findSharedChats(userId, viewerId);
    if (sharedChats.length > 0) return true;
    
    return false;
  }
}
