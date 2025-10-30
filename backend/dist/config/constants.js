"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PERFORMANCE_TARGETS = exports.TEXT_CONSTANTS = exports.VALIDATION_PATTERNS = exports.PARTICIPANT_ROLE = exports.USER_STATUS = exports.CONTACT_STATUS = exports.CHAT_TYPE = exports.CONTENT_TYPE = exports.MESSAGE_STATUS = exports.ALLOWED_IMAGE_TYPES = exports.IMAGE_SIZES = exports.LIMITS = void 0;
exports.LIMITS = {
    MESSAGE_MAX_LENGTH: 10000,
    MESSAGE_INITIAL_LOAD: 50,
    IMAGE_MAX_SIZE: 10 * 1024 * 1024,
    IMAGE_MAX_WIDTH: 4096,
    IMAGE_MAX_HEIGHT: 4096,
    MAX_ATTACHMENTS_PER_MESSAGE: 5,
    GROUP_MAX_PARTICIPANTS: 300,
    GROUP_NAME_MAX_LENGTH: 100,
    GROUPS_PER_USER: 100,
    MESSAGES_PER_SECOND_PER_USER: 10,
    CONTACT_REQUESTS_PER_DAY: 50,
    LOGIN_ATTEMPTS_WINDOW_MS: 15 * 60 * 1000,
    LOGIN_MAX_ATTEMPTS: 5,
    API_RATE_WINDOW_MS: 60 * 1000,
    API_RATE_MAX_REQUESTS: 100,
    UPLOAD_RATE_WINDOW_MS: 60 * 1000,
    UPLOAD_MAX_REQUESTS: 10,
    SEARCH_RATE_WINDOW_MS: 60 * 1000,
    SEARCH_MAX_REQUESTS: 30,
    USERNAME_MIN_LENGTH: 3,
    USERNAME_MAX_LENGTH: 50,
    DISPLAY_NAME_MAX_LENGTH: 100,
    PASSWORD_MIN_LENGTH: 8,
    BCRYPT_ROUNDS: 12,
    MAX_SEARCH_RESULTS: 100,
    USER_SEARCH_MAX_RESULTS: 20,
    PAGINATION_DEFAULT_LIMIT: 50,
    PAGINATION_MAX_LIMIT: 100,
    SESSION_DURATION_DAYS: 30,
    ACCESS_TOKEN_DURATION: '15m',
    REFRESH_TOKEN_DURATION: '7d',
    SIGNED_URL_EXPIRY_SECONDS: 3600,
    TYPING_INDICATOR_TIMEOUT_MS: 3000,
    WEBSOCKET_HEARTBEAT_INTERVAL_MS: 30000,
    WEBSOCKET_HEARTBEAT_TIMEOUT_MS: 5000,
    SEARCH_INDEX_RETENTION_MONTHS: 3,
};
exports.IMAGE_SIZES = {
    ORIGINAL: {
        quality: 85,
        progressive: true,
    },
    MEDIUM: {
        maxWidth: 800,
        maxHeight: 800,
        quality: 80,
    },
    THUMBNAIL: {
        width: 300,
        height: 300,
        quality: 75,
    },
};
exports.ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
];
exports.MESSAGE_STATUS = {
    SENT: 'sent',
    DELIVERED: 'delivered',
    READ: 'read',
};
exports.CONTENT_TYPE = {
    TEXT: 'text',
    IMAGE: 'image',
    SYSTEM: 'system',
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
exports.VALIDATION_PATTERNS = {
    USERNAME: /^[a-zA-Z0-9_]{3,50}$/,
};
exports.TEXT_CONSTANTS = {
    DELETED_MESSAGE: '[Deleted]',
    DELETED_USER: '[Deleted User]',
    MESSAGE_DELETED: '[Message Deleted]',
};
exports.PERFORMANCE_TARGETS = {
    MESSAGE_DELIVERY_MS: 100,
    MESSAGE_DELIVERY_P95_MS: 300,
    MESSAGE_DELIVERY_P99_MS: 500,
    RECONNECTION_DELIVERY_MS: 3000,
    MAX_CONCURRENT_CONNECTIONS: 1000,
    MESSAGE_THROUGHPUT_PER_SECOND: 50,
    MESSAGE_THROUGHPUT_SPIKE_PER_SECOND: 100,
};
//# sourceMappingURL=constants.js.map