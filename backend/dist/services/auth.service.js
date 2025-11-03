"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt = __importStar(require("bcrypt"));
const jwt = __importStar(require("jsonwebtoken"));
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
    async register(username, password, deviceInfo, displayName) {
        if (username.length < constants_1.LIMITS.USERNAME_MIN_LENGTH || username.length > constants_1.LIMITS.USERNAME_MAX_LENGTH) {
            throw new Error(`Username must be between ${constants_1.LIMITS.USERNAME_MIN_LENGTH} and ${constants_1.LIMITS.USERNAME_MAX_LENGTH} characters`);
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            throw new Error('Username can only contain letters, numbers, and underscores');
        }
        if (password.length < constants_1.LIMITS.PASSWORD_MIN_LENGTH) {
            throw new Error(`Password must be at least ${constants_1.LIMITS.PASSWORD_MIN_LENGTH} characters`);
        }
        const existingUser = await this.userRepo.findByUsername(username);
        if (existingUser) {
            throw new Error('Username already taken');
        }
        const passwordHash = await bcrypt.hash(password, constants_1.LIMITS.BCRYPT_ROUNDS);
        const user = await this.userRepo.create({
            username,
            passwordHash,
            displayName: displayName || username,
        });
        logger_util_1.logger.info(`User registered: ${username}`);
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
    async login(username, password, deviceInfo) {
        const user = await this.userRepo.findByUsername(username);
        if (!user) {
            throw new Error('Invalid credentials');
        }
        const isValid = await bcrypt.compare(password, user.passwordHash);
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
            const payload = jwt.verify(refreshToken, env_1.config.JWT_REFRESH_SECRET);
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
        return jwt.sign({ userId, type: 'access' }, env_1.config.JWT_SECRET, { expiresIn: env_1.JWT_CONFIG.ACCESS_TOKEN_EXPIRY });
    }
    generateRefreshToken(userId) {
        return jwt.sign({ userId, type: 'refresh' }, env_1.config.JWT_REFRESH_SECRET, { expiresIn: env_1.JWT_CONFIG.REFRESH_TOKEN_EXPIRY });
    }
    async verifyAccessToken(token) {
        try {
            const payload = jwt.verify(token, env_1.config.JWT_SECRET);
            return payload;
        }
        catch (error) {
            throw new Error('Invalid access token');
        }
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map