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
            const { displayName, avatarUrl } = req.body;
            const user = await this.userService.updateProfile(userId, { displayName, avatarUrl });
            res.json({ user });
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
                return res.status(400).json({ error: 'Search query is required' });
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
            const user = await this.userService.getUserById(userId);
            res.json({ user });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.UserController = UserController;
//# sourceMappingURL=user.controller.js.map