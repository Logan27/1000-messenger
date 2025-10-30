export declare const LIMITS: {
    readonly MESSAGE_MAX_LENGTH: 10000;
    readonly MESSAGE_INITIAL_LOAD: 50;
    readonly IMAGE_MAX_SIZE: number;
    readonly IMAGE_MAX_WIDTH: 4096;
    readonly IMAGE_MAX_HEIGHT: 4096;
    readonly MAX_ATTACHMENTS_PER_MESSAGE: 5;
    readonly GROUP_MAX_PARTICIPANTS: 300;
    readonly GROUP_NAME_MAX_LENGTH: 100;
    readonly GROUPS_PER_USER: 100;
    readonly MESSAGES_PER_SECOND_PER_USER: 10;
    readonly CONTACT_REQUESTS_PER_DAY: 50;
    readonly LOGIN_ATTEMPTS_WINDOW_MS: number;
    readonly LOGIN_MAX_ATTEMPTS: 5;
    readonly API_RATE_WINDOW_MS: number;
    readonly API_RATE_MAX_REQUESTS: 100;
    readonly UPLOAD_RATE_WINDOW_MS: number;
    readonly UPLOAD_MAX_REQUESTS: 10;
    readonly SEARCH_RATE_WINDOW_MS: number;
    readonly SEARCH_MAX_REQUESTS: 30;
    readonly USERNAME_MIN_LENGTH: 3;
    readonly USERNAME_MAX_LENGTH: 50;
    readonly DISPLAY_NAME_MAX_LENGTH: 100;
    readonly PASSWORD_MIN_LENGTH: 8;
    readonly BCRYPT_ROUNDS: 12;
    readonly MAX_SEARCH_RESULTS: 100;
    readonly USER_SEARCH_MAX_RESULTS: 20;
    readonly PAGINATION_DEFAULT_LIMIT: 50;
    readonly PAGINATION_MAX_LIMIT: 100;
    readonly SESSION_DURATION_DAYS: 30;
    readonly ACCESS_TOKEN_DURATION: "15m";
    readonly REFRESH_TOKEN_DURATION: "7d";
    readonly SIGNED_URL_EXPIRY_SECONDS: 3600;
    readonly TYPING_INDICATOR_TIMEOUT_MS: 3000;
    readonly WEBSOCKET_HEARTBEAT_INTERVAL_MS: 30000;
    readonly WEBSOCKET_HEARTBEAT_TIMEOUT_MS: 5000;
    readonly SEARCH_INDEX_RETENTION_MONTHS: 3;
};
export declare const IMAGE_SIZES: {
    readonly ORIGINAL: {
        readonly quality: 85;
        readonly progressive: true;
    };
    readonly MEDIUM: {
        readonly maxWidth: 800;
        readonly maxHeight: 800;
        readonly quality: 80;
    };
    readonly THUMBNAIL: {
        readonly width: 300;
        readonly height: 300;
        readonly quality: 75;
    };
};
export declare const ALLOWED_IMAGE_TYPES: readonly ["image/jpeg", "image/png", "image/gif", "image/webp"];
export declare const MESSAGE_STATUS: {
    readonly SENT: "sent";
    readonly DELIVERED: "delivered";
    readonly READ: "read";
};
export declare const CONTENT_TYPE: {
    readonly TEXT: "text";
    readonly IMAGE: "image";
    readonly SYSTEM: "system";
};
export declare const CHAT_TYPE: {
    readonly DIRECT: "direct";
    readonly GROUP: "group";
};
export declare const CONTACT_STATUS: {
    readonly PENDING: "pending";
    readonly ACCEPTED: "accepted";
    readonly BLOCKED: "blocked";
};
export declare const USER_STATUS: {
    readonly ONLINE: "online";
    readonly OFFLINE: "offline";
    readonly AWAY: "away";
};
export declare const PARTICIPANT_ROLE: {
    readonly OWNER: "owner";
    readonly ADMIN: "admin";
    readonly MEMBER: "member";
};
export declare const VALIDATION_PATTERNS: {
    readonly USERNAME: RegExp;
};
export declare const TEXT_CONSTANTS: {
    readonly DELETED_MESSAGE: "[Deleted]";
    readonly DELETED_USER: "[Deleted User]";
    readonly MESSAGE_DELETED: "[Message Deleted]";
};
export declare const PERFORMANCE_TARGETS: {
    readonly MESSAGE_DELIVERY_MS: 100;
    readonly MESSAGE_DELIVERY_P95_MS: 300;
    readonly MESSAGE_DELIVERY_P99_MS: 500;
    readonly RECONNECTION_DELIVERY_MS: 3000;
    readonly MAX_CONCURRENT_CONNECTIONS: 1000;
    readonly MESSAGE_THROUGHPUT_PER_SECOND: 50;
    readonly MESSAGE_THROUGHPUT_SPIKE_PER_SECOND: 100;
};
//# sourceMappingURL=constants.d.ts.map