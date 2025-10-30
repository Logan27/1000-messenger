// Size and rate limits
export const LIMITS = {
  // Message limits
  MESSAGE_MAX_LENGTH: 10000,
  MESSAGE_INITIAL_LOAD: 50,
  
  // Image/file limits
  IMAGE_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  IMAGE_MAX_WIDTH: 4096,
  IMAGE_MAX_HEIGHT: 4096,
  MAX_ATTACHMENTS_PER_MESSAGE: 5,
  
  // Group limits
  GROUP_MAX_PARTICIPANTS: 300,
  GROUP_NAME_MAX_LENGTH: 100,
  GROUPS_PER_USER: 100,
  
  // Rate limits
  MESSAGES_PER_SECOND_PER_USER: 10,
  CONTACT_REQUESTS_PER_DAY: 50,
  LOGIN_ATTEMPTS_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  LOGIN_MAX_ATTEMPTS: 5,
  API_RATE_WINDOW_MS: 60 * 1000, // 1 minute
  API_RATE_MAX_REQUESTS: 100,
  UPLOAD_RATE_WINDOW_MS: 60 * 1000, // 1 minute
  UPLOAD_MAX_REQUESTS: 10,
  SEARCH_RATE_WINDOW_MS: 60 * 1000, // 1 minute
  SEARCH_MAX_REQUESTS: 30,
  
  // User limits
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 50,
  DISPLAY_NAME_MAX_LENGTH: 100,
  PASSWORD_MIN_LENGTH: 8,
  BCRYPT_ROUNDS: 12,
  
  // Search and pagination
  MAX_SEARCH_RESULTS: 100,
  USER_SEARCH_MAX_RESULTS: 20,
  PAGINATION_DEFAULT_LIMIT: 50,
  PAGINATION_MAX_LIMIT: 100,
  
  // Session and token durations
  SESSION_DURATION_DAYS: 30,
  ACCESS_TOKEN_DURATION: '15m',
  REFRESH_TOKEN_DURATION: '7d',
  SIGNED_URL_EXPIRY_SECONDS: 3600, // 1 hour
  
  // Real-time features
  TYPING_INDICATOR_TIMEOUT_MS: 3000, // 3 seconds
  WEBSOCKET_HEARTBEAT_INTERVAL_MS: 30000, // 30 seconds
  WEBSOCKET_HEARTBEAT_TIMEOUT_MS: 5000, // 5 seconds
  
  // Search index retention
  SEARCH_INDEX_RETENTION_MONTHS: 3,
} as const;

// Image processing configurations
export const IMAGE_SIZES = {
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
} as const;

// Supported file types
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

// Message statuses
export const MESSAGE_STATUS = {
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
} as const;

// Message content types
export const CONTENT_TYPE = {
  TEXT: 'text',
  IMAGE: 'image',
  SYSTEM: 'system',
} as const;

// Chat types
export const CHAT_TYPE = {
  DIRECT: 'direct',
  GROUP: 'group',
} as const;

// Contact relationship statuses
export const CONTACT_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  BLOCKED: 'blocked',
} as const;

// User online statuses
export const USER_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  AWAY: 'away',
} as const;

// Chat participant roles
export const PARTICIPANT_ROLE = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
} as const;

// Regular expressions for validation
export const VALIDATION_PATTERNS = {
  USERNAME: /^[a-zA-Z0-9_]{3,50}$/,
} as const;

// Special text constants
export const TEXT_CONSTANTS = {
  DELETED_MESSAGE: '[Deleted]',
  DELETED_USER: '[Deleted User]',
  MESSAGE_DELETED: '[Message Deleted]',
} as const;

// Performance thresholds
export const PERFORMANCE_TARGETS = {
  MESSAGE_DELIVERY_MS: 100, // Average delivery time
  MESSAGE_DELIVERY_P95_MS: 300, // 95th percentile
  MESSAGE_DELIVERY_P99_MS: 500, // 99th percentile
  RECONNECTION_DELIVERY_MS: 3000, // Queued message delivery after reconnect
  MAX_CONCURRENT_CONNECTIONS: 1000,
  MESSAGE_THROUGHPUT_PER_SECOND: 50,
  MESSAGE_THROUGHPUT_SPIKE_PER_SECOND: 100,
} as const;
