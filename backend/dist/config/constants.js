"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PARTICIPANT_ROLE = exports.USER_STATUS = exports.CONTACT_STATUS = exports.CHAT_TYPE = exports.MESSAGE_STATUS = exports.LIMITS = void 0;
exports.LIMITS = {
    MESSAGE_MAX_LENGTH: 10000,
    IMAGE_MAX_SIZE: 10 * 1024 * 1024,
    IMAGE_MAX_WIDTH: 4096,
    IMAGE_MAX_HEIGHT: 4096,
    GROUP_MAX_PARTICIPANTS: 300,
    MESSAGES_PER_SECOND_PER_USER: 10,
    CONTACT_REQUESTS_PER_DAY: 50,
    GROUPS_PER_USER: 100,
    MAX_SEARCH_RESULTS: 100,
    PAGINATION_DEFAULT_LIMIT: 50,
    PAGINATION_MAX_LIMIT: 100,
    SESSION_DURATION_DAYS: 30,
    ACCESS_TOKEN_DURATION: '15m',
    REFRESH_TOKEN_DURATION: '7d',
};
exports.MESSAGE_STATUS = {
    SENT: 'sent',
    DELIVERED: 'delivered',
    READ: 'read',
};
exports.CHAT_TYPE = {
    DIRECT: 'direct',
    GROUP: 'group',
};
exports.CONTACT_STATUS = {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    BLOCKED: 'blocked',
};
exports.USER_STATUS = {
    ONLINE: 'online',
    OFFLINE: 'offline',
    AWAY: 'away',
};
exports.PARTICIPANT_ROLE = {
    OWNER: 'owner',
    ADMIN: 'admin',
    MEMBER: 'member',
};
//# sourceMappingURL=constants.js.map