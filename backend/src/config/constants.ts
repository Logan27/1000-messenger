export const LIMITS = {
  MESSAGE_MAX_LENGTH: 10000,
  IMAGE_MAX_SIZE: 10 * 1024 * 1024, // 10MB
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

export const MESSAGE_STATUS = {
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
} as const;

export const CHAT_TYPE = {
  DIRECT: 'direct',
  GROUP: 'group',
} as const;

export const CONTACT_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  BLOCKED: 'blocked',
} as const;

export const USER_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  AWAY: 'away',
} as const;

export const PARTICIPANT_ROLE = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
} as const;
