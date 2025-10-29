"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketAuthMiddleware = void 0;
const logger_util_1 = require("../../utils/logger.util");
class SocketAuthMiddleware {
    authService;
    sessionService;
    constructor(authService, sessionService) {
        this.authService = authService;
        this.sessionService = sessionService;
    }
    async authenticate(socket, next) {
        try {
            const token = socket.handshake.auth['token'];
            if (!token) {
                return next(new Error('Authentication token required'));
            }
            const { userId } = await this.authService.verifyAccessToken(token);
            const session = await this.sessionService.findByToken(token);
            if (!session || !session.isActive) {
                return next(new Error('Invalid or expired session'));
            }
            socket.data = {
                userId,
                sessionId: session.id,
            };
            next();
        }
        catch (error) {
            logger_util_1.logger.error('Socket authentication failed', error);
            next(new Error('Authentication failed'));
        }
    }
}
exports.SocketAuthMiddleware = SocketAuthMiddleware;
//# sourceMappingURL=socket-auth.middleware.js.map