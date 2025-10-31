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
exports.JwtMalformedError = exports.JwtInvalidError = exports.JwtExpiredError = exports.JwtError = exports.TokenType = void 0;
exports.generateAccessToken = generateAccessToken;
exports.generateRefreshToken = generateRefreshToken;
exports.generateTokenPair = generateTokenPair;
exports.verifyAccessToken = verifyAccessToken;
exports.verifyRefreshToken = verifyRefreshToken;
exports.decodeToken = decodeToken;
exports.extractTokenFromHeader = extractTokenFromHeader;
exports.isTokenExpired = isTokenExpired;
exports.getTokenExpiration = getTokenExpiration;
exports.refreshAccessToken = refreshAccessToken;
exports.isValidTokenFormat = isValidTokenFormat;
const jwt = __importStar(require("jsonwebtoken"));
const jsonwebtoken_1 = require("jsonwebtoken");
const env_1 = require("../config/env");
const logger_util_1 = require("./logger.util");
var TokenType;
(function (TokenType) {
    TokenType["ACCESS"] = "access";
    TokenType["REFRESH"] = "refresh";
})(TokenType || (exports.TokenType = TokenType = {}));
class JwtError extends Error {
    constructor(message) {
        super(message);
        this.name = 'JwtError';
    }
}
exports.JwtError = JwtError;
class JwtExpiredError extends JwtError {
    constructor(message = 'Token has expired') {
        super(message);
        this.name = 'JwtExpiredError';
    }
}
exports.JwtExpiredError = JwtExpiredError;
class JwtInvalidError extends JwtError {
    constructor(message = 'Token is invalid') {
        super(message);
        this.name = 'JwtInvalidError';
    }
}
exports.JwtInvalidError = JwtInvalidError;
class JwtMalformedError extends JwtError {
    constructor(message = 'Token is malformed') {
        super(message);
        this.name = 'JwtMalformedError';
    }
}
exports.JwtMalformedError = JwtMalformedError;
function generateAccessToken(userId, additionalClaims) {
    try {
        const payload = {
            userId,
            type: TokenType.ACCESS,
            ...additionalClaims,
        };
        return jwt.sign(payload, env_1.config.JWT_SECRET, {
            expiresIn: env_1.JWT_CONFIG.ACCESS_TOKEN_EXPIRY,
            issuer: 'messenger-api',
            audience: 'messenger-client',
        });
    }
    catch (error) {
        logger_util_1.logger.error('Failed to generate access token', { error, userId });
        throw new JwtError('Failed to generate access token');
    }
}
function generateRefreshToken(userId, additionalClaims) {
    try {
        const payload = {
            userId,
            type: TokenType.REFRESH,
            ...additionalClaims,
        };
        return jwt.sign(payload, env_1.config.JWT_REFRESH_SECRET, {
            expiresIn: env_1.JWT_CONFIG.REFRESH_TOKEN_EXPIRY,
            issuer: 'messenger-api',
            audience: 'messenger-client',
        });
    }
    catch (error) {
        logger_util_1.logger.error('Failed to generate refresh token', { error, userId });
        throw new JwtError('Failed to generate refresh token');
    }
}
function generateTokenPair(userId, additionalClaims) {
    return {
        accessToken: generateAccessToken(userId, additionalClaims),
        refreshToken: generateRefreshToken(userId, additionalClaims),
    };
}
function verifyAccessToken(token) {
    try {
        const payload = jwt.verify(token, env_1.config.JWT_SECRET, {
            issuer: 'messenger-api',
            audience: 'messenger-client',
        });
        if (payload.type !== TokenType.ACCESS) {
            throw new JwtInvalidError('Invalid token type');
        }
        return payload;
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.TokenExpiredError) {
            throw new JwtExpiredError('Access token has expired');
        }
        else if (error instanceof jsonwebtoken_1.JsonWebTokenError) {
            throw new JwtInvalidError(`Invalid access token: ${error.message}`);
        }
        else if (error instanceof jsonwebtoken_1.NotBeforeError) {
            throw new JwtInvalidError('Token not yet valid');
        }
        else if (error instanceof JwtError) {
            throw error;
        }
        else {
            logger_util_1.logger.error('Unexpected error verifying access token', { error });
            throw new JwtError('Failed to verify access token');
        }
    }
}
function verifyRefreshToken(token) {
    try {
        const payload = jwt.verify(token, env_1.config.JWT_REFRESH_SECRET, {
            issuer: 'messenger-api',
            audience: 'messenger-client',
        });
        if (payload.type !== TokenType.REFRESH) {
            throw new JwtInvalidError('Invalid token type');
        }
        return payload;
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.TokenExpiredError) {
            throw new JwtExpiredError('Refresh token has expired');
        }
        else if (error instanceof jsonwebtoken_1.JsonWebTokenError) {
            throw new JwtInvalidError(`Invalid refresh token: ${error.message}`);
        }
        else if (error instanceof jsonwebtoken_1.NotBeforeError) {
            throw new JwtInvalidError('Token not yet valid');
        }
        else if (error instanceof JwtError) {
            throw error;
        }
        else {
            logger_util_1.logger.error('Unexpected error verifying refresh token', { error });
            throw new JwtError('Failed to verify refresh token');
        }
    }
}
function decodeToken(token) {
    try {
        const decoded = jwt.decode(token);
        return decoded;
    }
    catch (error) {
        logger_util_1.logger.warn('Failed to decode token', { error });
        return null;
    }
}
function extractTokenFromHeader(authHeader) {
    if (!authHeader) {
        return null;
    }
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return null;
    }
    return parts[1] || null;
}
function isTokenExpired(token) {
    try {
        const decoded = decodeToken(token);
        if (!decoded || !decoded.exp) {
            return true;
        }
        const now = Math.floor(Date.now() / 1000);
        return decoded.exp < now;
    }
    catch (error) {
        return true;
    }
}
function getTokenExpiration(token) {
    try {
        const decoded = decodeToken(token);
        if (!decoded || !decoded.exp) {
            return null;
        }
        return new Date(decoded.exp * 1000);
    }
    catch (error) {
        return null;
    }
}
function refreshAccessToken(refreshToken) {
    const payload = verifyRefreshToken(refreshToken);
    return generateAccessToken(payload.userId);
}
function isValidTokenFormat(token) {
    if (!token || typeof token !== 'string') {
        return false;
    }
    const parts = token.split('.');
    if (parts.length !== 3) {
        return false;
    }
    try {
        parts.forEach((part) => {
            Buffer.from(part, 'base64');
        });
        return true;
    }
    catch (error) {
        return false;
    }
}
//# sourceMappingURL=jwt.util.js.map