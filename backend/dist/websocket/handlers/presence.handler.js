"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PresenceHandler = void 0;
const logger_util_1 = require("../../utils/logger.util");
class PresenceHandler {
    userRepo;
    constructor(userRepo) {
        this.userRepo = userRepo;
    }
    setupHandlers(socket) {
        const { userId } = socket.data;
        socket.on('presence:update', async (data) => {
            try {
                await this.userRepo.updateStatus(userId, data.status);
                socket.broadcast.emit('user.status', {
                    userId,
                    status: data.status,
                    timestamp: new Date(),
                });
                logger_util_1.logger.info(`User ${userId} status updated to ${data.status}`);
            }
            catch (error) {
                logger_util_1.logger.error('Failed to update user presence', error);
                socket.emit('presence:error', {
                    error: 'Failed to update status',
                });
            }
        });
        socket.on('presence:heartbeat', async () => {
            try {
                await this.userRepo.updateLastSeen(userId);
                socket.emit('presence:heartbeat:ack');
            }
            catch (error) {
                logger_util_1.logger.error('Failed to update heartbeat', error);
            }
        });
    }
}
exports.PresenceHandler = PresenceHandler;
//# sourceMappingURL=presence.handler.js.map