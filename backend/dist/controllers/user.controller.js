"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
class UserController {
    userService;
    constructor(userService) {
        this.userService = userService;
    }
    getProfile = async (req, res, next) => {
        try {
            const userId = req.user.userId;
            const user = await this.userService.getProfile(userId);
            res.json({ user });
        }
        catch (error) {
            next(error);
        }
    };
    updateProfile = async (req, res, next) => {
        try {
            const userId = req.user.userId;
            const { displayName, avatarUrl, status } = req.body;
            await this.userService.updateProfile(userId, { displayName, avatarUrl });
            if (status) {
                await this.userService.updateStatus(userId, status);
            }
            const updatedUser = await this.userService.getProfile(userId);
            res.json({ user: updatedUser });
        }
        catch (error) {
            next(error);
        }
    };
    searchUsers = async (req, res, next) => {
        try {
            const { q } = req.query;
            const limit = parseInt(req.query['limit']) || 20;
            if (!q || typeof q !== 'string') {
                res.status(400).json({ error: 'Search query is required' });
                return;
            }
            const users = await this.userService.searchUsers(q, limit);
            res.json({ users });
        }
        catch (error) {
            next(error);
        }
    };
    getUserById = async (req, res, next) => {
        try {
            const { userId } = req.params;
            const viewerId = req.user.userId;
            const user = await this.userService.getUserById(userId, viewerId);
            res.json({ user });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.UserController = UserController;
//# sourceMappingURL=user.controller.js.map