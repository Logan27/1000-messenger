"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    register = async (req, res, next) => {
        try {
            const { username, password } = req.body;
            if (!username || !password) {
                return res.status(400).json({ error: 'Username and password are required' });
            }
            const deviceInfoRaw = {
                deviceId: req.headers['x-device-id'],
                deviceType: req.headers['x-device-type'],
                deviceName: req.headers['x-device-name'],
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
            };
            const deviceInfo = {
                deviceId: deviceInfoRaw.deviceId,
                deviceType: deviceInfoRaw.deviceType,
                deviceName: deviceInfoRaw.deviceName,
            };
            if (deviceInfoRaw.ipAddress !== undefined) {
                deviceInfo.ipAddress = deviceInfoRaw.ipAddress;
            }
            if (deviceInfoRaw.userAgent !== undefined) {
                deviceInfo.userAgent = deviceInfoRaw.userAgent;
            }
            const result = await this.authService.register(username, password, deviceInfo);
            return res.status(201).json(result);
        }
        catch (error) {
            return next(error);
        }
    };
    login = async (req, res, next) => {
        try {
            const { username, password } = req.body;
            if (!username || !password) {
                return res.status(400).json({ error: 'Username and password are required' });
            }
            const deviceInfoRaw = {
                deviceId: req.headers['x-device-id'],
                deviceType: req.headers['x-device-type'],
                deviceName: req.headers['x-device-name'],
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
            };
            const deviceInfo = {
                deviceId: deviceInfoRaw.deviceId,
                deviceType: deviceInfoRaw.deviceType,
                deviceName: deviceInfoRaw.deviceName,
            };
            if (deviceInfoRaw.ipAddress !== undefined) {
                deviceInfo.ipAddress = deviceInfoRaw.ipAddress;
            }
            if (deviceInfoRaw.userAgent !== undefined) {
                deviceInfo.userAgent = deviceInfoRaw.userAgent;
            }
            const result = await this.authService.login(username, password, deviceInfo);
            return res.json(result);
        }
        catch (error) {
            return next(error);
        }
    };
    refreshToken = async (req, res, next) => {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                return res.status(400).json({ error: 'Refresh token is required' });
            }
            const result = await this.authService.refreshAccessToken(refreshToken);
            return res.json(result);
        }
        catch (error) {
            return next(error);
        }
    };
    logout = async (req, res, next) => {
        try {
            const userId = req.user.userId;
            const { refreshToken } = req.body;
            await this.authService.logout(userId, refreshToken);
            return res.json({ message: 'Logged out successfully' });
        }
        catch (error) {
            return next(error);
        }
    };
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map