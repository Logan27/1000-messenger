"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const constants_1 = require("../config/constants");
const logger_util_1 = require("../utils/logger.util");
class AuthService {
    userRepo;
    sessionService;
    constructor(userRepo, sessionService) {
        this.userRepo = userRepo;
        this.sessionService = sessionService;
    }
    async register(username, password) {
        if (username.length < 3 || username.length > 50) {
            throw new Error('Username must be between 3 and 50 characters');
        }
        const existingUser = await this.userRepo.findByUsername(username);
        if (existingUser) {
            throw new Error('Username already taken');
        }
        const passwordHash = await bcrypt_1.default.hash(password, 12);
        const user = await this.userRepo.create({
            username,
            passwordHash,
            displayName: username,
        });
        logger_util_1.logger.info(`User registered: ${username}`);
        return {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
        };
    }
    async login(username, password, deviceInfo) {
        const user = await this.userRepo.findByUsername(username);
        if (!user) {
            throw new Error('Invalid credentials');
        }
        const isValid = await bcrypt_1.default.compare(password, user.passwordHash);
        if (!isValid) {
            throw new Error('Invalid credentials');
        }
        const accessToken = this.generateAccessToken(user.id);
        const refreshToken = this.generateRefreshToken(user.id);
        const sessionData = {
            userId: user.id,
            sessionToken: refreshToken,
            expiresAt: new Date(Date.now() + constants_1.LIMITS.SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000),
        };
        if (deviceInfo?.deviceId !== undefined) {
            sessionData.deviceId = deviceInfo.deviceId;
        }
        if (deviceInfo?.deviceType !== undefined) {
            sessionData.deviceType = deviceInfo.deviceType;
        }
        if (deviceInfo?.deviceName !== undefined) {
            sessionData.deviceName = deviceInfo.deviceName;
        }
        if (deviceInfo?.ipAddress !== undefined) {
            sessionData.ipAddress = deviceInfo.ipAddress;
        }
        if (deviceInfo?.userAgent !== undefined) {
            sessionData.userAgent = deviceInfo.userAgent;
        }
        await this.sessionService.createSession(sessionData);
        await this.userRepo.updateLastSeen(user.id);
        logger_util_1.logger.info(`User logged in: ${username}`);
        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                username: user.username,
                displayName: user.displayName,
                avatarUrl: user.avatarUrl,
            },
        };
    }
    async refreshAccessToken(refreshToken) {
        try {
            const payload = jsonwebtoken_1.default.verify(refreshToken, env_1.config.JWT_REFRESH_SECRET);
            const session = await this.sessionService.findByToken(refreshToken);
            if (!session || !session.isActive || new Date(session.expiresAt) < new Date()) {
                throw new Error('Invalid session');
            }
            const accessToken = this.generateAccessToken(payload.userId);
            return { accessToken };
        }
        catch (error) {
            throw new Error('Invalid refresh token');
        }
    }
    async logout(userId, sessionToken) {
        if (sessionToken) {
            await this.sessionService.invalidateSession(sessionToken);
        }
        else {
            await this.sessionService.invalidateAllUserSessions(userId);
        }
        logger_util_1.logger.info(`User logged out: ${userId}`);
    }
    generateAccessToken(userId) {
        return jsonwebtoken_1.default.sign({ userId, type: 'access' }, env_1.config.JWT_SECRET, { expiresIn: env_1.JWT_CONFIG.ACCESS_TOKEN_EXPIRY });
    }
    generateRefreshToken(userId) {
        return jsonwebtoken_1.default.sign({ userId, type: 'refresh' }, env_1.config.JWT_REFRESH_SECRET, { expiresIn: env_1.JWT_CONFIG.REFRESH_TOKEN_EXPIRY });
    }
    async verifyAccessToken(token) {
        try {
            const payload = jsonwebtoken_1.default.verify(token, env_1.config.JWT_SECRET);
            return payload;
        }
        catch (error) {
            throw new Error('Invalid access token');
        }
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map