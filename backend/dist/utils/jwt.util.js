"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAccessToken = generateAccessToken;
exports.generateRefreshToken = generateRefreshToken;
exports.verifyAccessToken = verifyAccessToken;
exports.verifyRefreshToken = verifyRefreshToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
function generateAccessToken(userId) {
    return jsonwebtoken_1.default.sign({ userId, type: 'access' }, env_1.config.JWT_SECRET, { expiresIn: env_1.JWT_CONFIG.ACCESS_TOKEN_EXPIRY });
}
function generateRefreshToken(userId) {
    return jsonwebtoken_1.default.sign({ userId, type: 'refresh' }, env_1.config.JWT_REFRESH_SECRET, { expiresIn: env_1.JWT_CONFIG.REFRESH_TOKEN_EXPIRY });
}
function verifyAccessToken(token) {
    return jsonwebtoken_1.default.verify(token, env_1.config.JWT_SECRET);
}
function verifyRefreshToken(token) {
    return jsonwebtoken_1.default.verify(token, env_1.config.JWT_REFRESH_SECRET);
}
//# sourceMappingURL=jwt.util.js.map