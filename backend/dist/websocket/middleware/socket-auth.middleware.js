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
    authenticate = async (socket, next) => {
        try {
            const token = socket.handshake.auth['token'];
            if (!token) {
                logger_util_1.logger.warn('WebSocket authentication failed: No token provided', {
                    socketId: socket.id,
                    address: socket.handshake.address,
                    headers: socket.handshake.headers['user-agent'],
                });
                return next(new Error('Authentication token required'));
            }
            const { userId } = await this.authService.verifyAccessToken(token);
            const session = await this.sessionService.findByToken(token);
            if (!session || !session.isActive) {
                logger_util_1.logger.warn('WebSocket authentication failed: Invalid or expired session', {
                    socketId: socket.id,
                    userId,
                    address: socket.handshake.address,
                    hasSession: !!session,
                    isActive: session?.isActive,
                });
                return next(new Error('Invalid or expired session'));
            }
            socket.data = {
                userId,
                sessionId: session.id,
            };
            logger_util_1.logger.debug('WebSocket authenticated successfully', {
                socketId: socket.id,
                userId,
                sessionId: session.id,
            });
            next();
        }
        catch (error) {
            logger_util_1.logger.error('WebSocket authentication error', {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                socketId: socket.id,
                address: socket.handshake.address,
            });
            next(new Error('Authentication failed'));
        }
    };
}
exports.SocketAuthMiddleware = SocketAuthMiddleware;
//# sourceMappingURL=socket-auth.middleware.js.map