import { UserRepository } from '../repositories/user.repository';
import { ContactRepository } from '../repositories/contact.repository';
import { ChatRepository } from '../repositories/chat.repository';
export declare class UserService {
    private _userRepo;
    private contactRepo;
    private chatRepo;
    constructor(_userRepo: UserRepository, contactRepo: ContactRepository, chatRepo: ChatRepository);
    canViewUserProfile(userId: string, viewerId: string): Promise<boolean>;
}
//# sourceMappingURL=user.service.d.ts.map