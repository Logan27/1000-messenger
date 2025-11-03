import { UserRepository } from '../repositories/user.repository';
import { ContactRepository } from '../repositories/contact.repository';
import { ChatRepository } from '../repositories/chat.repository';
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
export interface UpdateProfileDto {
    displayName?: string;
    avatarUrl?: string;
}
export declare class UserService {
    private userRepo;
    private contactRepo;
    private chatRepo;
    private storageService;
    constructor(userRepo: UserRepository, contactRepo: ContactRepository, chatRepo: ChatRepository);
    getProfile(userId: string): Promise<UserProfileDto>;
    updateProfile(userId: string, data: UpdateProfileDto): Promise<UserProfileDto>;
    searchUsers(query: string, limit?: number): Promise<UserProfileDto[]>;
    getUserById(userId: string, viewerId?: string): Promise<UserProfileDto>;
    updateStatus(userId: string, status: string): Promise<void>;
    updateLastSeen(userId: string): Promise<void>;
    uploadAvatar(userId: string, file: Express.Multer.File): Promise<string>;
    canViewUserProfile(userId: string, viewerId: string): Promise<boolean>;
    private sanitizeUser;
}
//# sourceMappingURL=user.service.d.ts.map