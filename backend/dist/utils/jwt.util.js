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
    return jsonwebtoken_1.default.sign({ userId, type: 'access' }, env_1.config.JWT_SECRET, { expiresIn: '15m' });
}
function generateRefreshToken(userId) {
    return jsonwebtoken_1.default.sign({ userId, type: 'refresh' }, env_1.config.JWT_REFRESH_SECRET, { expiresIn: '7d' });
}
function verifyAccessToken(token) {
    return jsonwebtoken_1.default.verify(token, env_1.config.JWT_SECRET);
}
function verifyRefreshToken(token) {
    return jsonwebtoken_1.default.verify(token, env_1.config.JWT_REFRESH_SECRET);
}
//# sourceMappingURL=jwt.util.js.map