"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUsername = validateUsername;
exports.validatePassword = validatePassword;
exports.validateEmail = validateEmail;
exports.sanitizeString = sanitizeString;
function validateUsername(username) {
    return /^[a-zA-Z0-9_]{3,50}$/.test(username);
}
function validatePassword(password) {
    return password.length >= 8 && password.length <= 128;
}
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function sanitizeString(input) {
    return input.trim().replace(/[<>]/g, '');
}
//# sourceMappingURL=validators.util.js.map