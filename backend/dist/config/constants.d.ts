export declare const LIMITS: {
    MESSAGE_MAX_LENGTH: number;
    IMAGE_MAX_SIZE: number;
    IMAGE_MAX_WIDTH: number;
    IMAGE_MAX_HEIGHT: number;
    GROUP_MAX_PARTICIPANTS: number;
    MESSAGES_PER_SECOND_PER_USER: number;
    CONTACT_REQUESTS_PER_DAY: number;
    GROUPS_PER_USER: number;
    MAX_SEARCH_RESULTS: number;
    PAGINATION_DEFAULT_LIMIT: number;
    PAGINATION_MAX_LIMIT: number;
    SESSION_DURATION_DAYS: number;
    ACCESS_TOKEN_DURATION: string;
    REFRESH_TOKEN_DURATION: string;
};
export declare const MESSAGE_STATUS: {
    readonly SENT: "sent";
    readonly DELIVERED: "delivered";
    readonly READ: "read";
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
//# sourceMappingURL=constants.d.ts.map