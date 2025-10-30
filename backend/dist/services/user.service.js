"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
class UserService {
    _userRepo;
    contactRepo;
    chatRepo;
    constructor(_userRepo, contactRepo, chatRepo) {
        this._userRepo = _userRepo;
        this.contactRepo = contactRepo;
        this.chatRepo = chatRepo;
    }
    async canViewUserProfile(userId, viewerId) {
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
}
exports.UserService = UserService;
//# sourceMappingURL=user.service.js.map