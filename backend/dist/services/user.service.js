"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
class UserService {
    userRepo;
    contactRepo;
    chatRepo;
    constructor(userRepo, contactRepo, chatRepo) {
        this.userRepo = userRepo;
        this.contactRepo = contactRepo;
        this.chatRepo = chatRepo;
    }
    async getProfile(userId) {
        const user = await this.userRepo.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        return this.sanitizeUser(user);
    }
    async updateProfile(userId, data) {
        const user = await this.userRepo.update(userId, data);
        return this.sanitizeUser(user);
    }
    async searchUsers(query, limit = 20) {
        const users = await this.userRepo.search(query, limit);
        return users.map(user => this.sanitizeUser(user));
    }
    async getUserById(userId, viewerId) {
        const user = await this.userRepo.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        if (viewerId && userId !== viewerId) {
            const canView = await this.canViewUserProfile(userId, viewerId);
            if (!canView) {
                throw new Error('You do not have permission to view this profile');
            }
        }
        return this.sanitizeUser(user);
    }
    async updateStatus(userId, status) {
        const validStatuses = ['online', 'offline', 'away'];
        if (!validStatuses.includes(status)) {
            throw new Error('Invalid status value');
        }
        await this.userRepo.updateStatus(userId, status);
    }
    async updateLastSeen(userId) {
        await this.userRepo.updateLastSeen(userId);
    }
    async canViewUserProfile(userId, viewerId) {
        if (userId === viewerId) {
            return true;
        }
        const areContacts = await this.contactRepo.areContacts(userId, viewerId);
        if (areContacts) {
            return true;
        }
        const sharedChats = await this.chatRepo.findSharedChats(userId, viewerId);
        if (sharedChats.length > 0) {
            return true;
        }
        return false;
    }
    sanitizeUser(user) {
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
exports.UserService = UserService;
//# sourceMappingURL=user.service.js.map