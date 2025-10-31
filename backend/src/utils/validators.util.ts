import { z } from 'zod';

// ============================================================================
// PRIMITIVE VALIDATORS
// ============================================================================

export const uuidSchema = z.string().uuid();

export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(50, 'Username must not exceed 50 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters');

export const strongPasswordSchema = passwordSchema.refine(
  (password) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
  },
  {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  }
);

export const emailSchema = z.string().email('Invalid email address');

export const displayNameSchema = z
  .string()
  .min(1, 'Display name cannot be empty')
  .max(100, 'Display name must not exceed 100 characters')
  .optional();

export const avatarUrlSchema = z
  .string()
  .url('Invalid avatar URL')
  .max(500, 'Avatar URL must not exceed 500 characters')
  .optional();

export const userStatusSchema = z.enum(['online', 'offline', 'away']);

export const timestampSchema = z.union([z.string().datetime(), z.date()]);

// ============================================================================
// USER SCHEMAS
// ============================================================================

export const userRegistrationSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
  displayName: displayNameSchema,
});

export const userLoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const userUpdateSchema = z.object({
  displayName: displayNameSchema,
  avatarUrl: avatarUrlSchema,
  status: userStatusSchema.optional(),
});

export const userProfileSchema = z.object({
  id: uuidSchema,
  username: usernameSchema,
  displayName: z.string().max(100).nullable(),
  avatarUrl: z.string().max(500).nullable(),
  status: userStatusSchema,
  lastSeen: timestampSchema.nullable(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

// ============================================================================
// AUTH SCHEMAS
// ============================================================================

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const deviceInfoSchema = z.object({
  deviceId: z.string().optional(),
  deviceType: z.string().optional(),
  deviceName: z.string().optional(),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().optional(),
});

export const sessionSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  sessionToken: z.string(),
  deviceId: z.string().nullable(),
  deviceType: z.string().nullable(),
  deviceName: z.string().nullable(),
  socketId: z.string().nullable(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  isActive: z.boolean(),
  lastActivity: timestampSchema,
  createdAt: timestampSchema,
  expiresAt: timestampSchema,
});

// ============================================================================
// CONTACT SCHEMAS
// ============================================================================

export const contactStatusSchema = z.enum(['pending', 'accepted', 'blocked']);

export const contactRequestSchema = z.object({
  contactId: uuidSchema,
});

export const contactResponseSchema = z.object({
  contactRequestId: uuidSchema,
  action: z.enum(['accept', 'reject']),
});

export const contactSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  contactId: uuidSchema,
  status: contactStatusSchema,
  requestedBy: uuidSchema,
  createdAt: timestampSchema,
  acceptedAt: timestampSchema.nullable(),
});

// ============================================================================
// CHAT SCHEMAS
// ============================================================================

export const chatTypeSchema = z.enum(['direct', 'group']);

export const participantRoleSchema = z.enum(['owner', 'admin', 'member']);

export const chatNameSchema = z
  .string()
  .min(1, 'Chat name cannot be empty')
  .max(100, 'Chat name must not exceed 100 characters');

export const chatSlugSchema = z
  .string()
  .min(1)
  .max(100, 'Chat slug must not exceed 100 characters')
  .regex(/^[a-z0-9-]+$/, 'Chat slug can only contain lowercase letters, numbers, and hyphens')
  .optional();

export const createDirectChatSchema = z.object({
  participantId: uuidSchema,
});

export const createGroupChatSchema = z.object({
  name: chatNameSchema,
  participantIds: z
    .array(uuidSchema)
    .min(1, 'Group chat must have at least one participant')
    .max(299, 'Group chat cannot have more than 299 participants'),
  avatarUrl: avatarUrlSchema,
  slug: chatSlugSchema,
});

export const updateGroupChatSchema = z.object({
  name: chatNameSchema.optional(),
  avatarUrl: avatarUrlSchema,
  slug: chatSlugSchema,
});

export const addParticipantsSchema = z.object({
  participantIds: z
    .array(uuidSchema)
    .min(1, 'Must add at least one participant')
    .max(50, 'Cannot add more than 50 participants at once'),
});

export const removeParticipantSchema = z.object({
  participantId: uuidSchema,
});

export const updateParticipantRoleSchema = z.object({
  participantId: uuidSchema,
  role: participantRoleSchema,
});

export const chatSchema = z.object({
  id: uuidSchema,
  type: chatTypeSchema,
  name: z.string().max(100).nullable(),
  slug: z.string().max(100).nullable(),
  avatarUrl: z.string().max(500).nullable(),
  ownerId: uuidSchema.nullable(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  lastMessageAt: timestampSchema.nullable(),
  isDeleted: z.boolean(),
});

export const chatParticipantSchema = z.object({
  id: uuidSchema,
  chatId: uuidSchema,
  userId: uuidSchema,
  role: participantRoleSchema,
  joinedAt: timestampSchema,
  leftAt: timestampSchema.nullable(),
});

// ============================================================================
// MESSAGE SCHEMAS
// ============================================================================

export const messageContentTypeSchema = z.enum(['text', 'image', 'system']);

export const messageContentSchema = z
  .string()
  .min(1, 'Message content cannot be empty')
  .max(10000, 'Message content must not exceed 10,000 characters');

export const messageFormattingSchema = z.object({
  bold: z.array(z.tuple([z.number(), z.number()])).optional(),
  italic: z.array(z.tuple([z.number(), z.number()])).optional(),
});

export const messageMetadataSchema = z.object({
  formatting: messageFormattingSchema.optional(),
  attachments: z.array(uuidSchema).optional(),
  systemMessageType: z.string().optional(),
});

export const createMessageSchema = z.object({
  content: messageContentSchema,
  contentType: messageContentTypeSchema.optional(),
  metadata: messageMetadataSchema.optional(),
  replyToId: uuidSchema.optional(),
});

export const updateMessageSchema = z.object({
  content: messageContentSchema,
  metadata: messageMetadataSchema.optional(),
});

export const messageSchema = z.object({
  id: uuidSchema,
  chatId: uuidSchema,
  senderId: uuidSchema.nullable(),
  content: z.string().max(10000),
  contentType: messageContentTypeSchema,
  metadata: z.record(z.any()),
  replyToId: uuidSchema.nullable(),
  isEdited: z.boolean(),
  editedAt: timestampSchema.nullable(),
  isDeleted: z.boolean(),
  deletedAt: timestampSchema.nullable(),
  createdAt: timestampSchema,
});

// ============================================================================
// ATTACHMENT SCHEMAS
// ============================================================================

export const imageFileTypeSchema = z.enum([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

export const attachmentSchema = z.object({
  id: uuidSchema,
  messageId: uuidSchema,
  fileName: z.string().min(1).max(255),
  fileType: imageFileTypeSchema,
  fileSize: z
    .number()
    .int()
    .positive()
    .max(10485760, 'File size must not exceed 10MB'),
  storageKey: z.string().max(500),
  thumbnailKey: z.string().max(500),
  url: z.string().url().max(500),
  thumbnailUrl: z.string().url().max(500),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
  createdAt: timestampSchema,
});

export const uploadImageSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileType: imageFileTypeSchema,
  fileSize: z
    .number()
    .int()
    .positive()
    .max(10485760, 'File size must not exceed 10MB'),
});

// ============================================================================
// REACTION SCHEMAS
// ============================================================================

export const emojiSchema = z
  .string()
  .min(1, 'Emoji cannot be empty')
  .max(10, 'Emoji must not exceed 10 characters');

export const addReactionSchema = z.object({
  emoji: emojiSchema,
});

export const reactionSchema = z.object({
  id: uuidSchema,
  messageId: uuidSchema,
  userId: uuidSchema,
  emoji: emojiSchema,
  createdAt: timestampSchema,
});

// ============================================================================
// MESSAGE DELIVERY SCHEMAS
// ============================================================================

export const deliveryStatusSchema = z.enum(['pending', 'delivered', 'read']);

export const messageDeliverySchema = z.object({
  id: uuidSchema,
  messageId: uuidSchema,
  userId: uuidSchema,
  status: deliveryStatusSchema,
  deliveredAt: timestampSchema.nullable(),
  readAt: timestampSchema.nullable(),
  createdAt: timestampSchema,
});

export const markMessagesReadSchema = z.object({
  messageIds: z.array(uuidSchema).min(1, 'Must provide at least one message ID'),
});

export const markChatReadSchema = z.object({
  chatId: uuidSchema,
});

// ============================================================================
// PAGINATION & SEARCH SCHEMAS
// ============================================================================

export const paginationSchema = z.object({
  limit: z
    .number()
    .int()
    .positive()
    .max(100, 'Limit must not exceed 100')
    .default(50),
  offset: z
    .number()
    .int()
    .min(0, 'Offset must be non-negative')
    .default(0),
});

export const cursorPaginationSchema = z.object({
  limit: z
    .number()
    .int()
    .positive()
    .max(100, 'Limit must not exceed 100')
    .default(50),
  cursor: uuidSchema.optional(),
});

export const searchQuerySchema = z.object({
  query: z
    .string()
    .min(1, 'Search query cannot be empty')
    .max(100, 'Search query must not exceed 100 characters'),
  chatId: uuidSchema.optional(),
  limit: z
    .number()
    .int()
    .positive()
    .max(100, 'Limit must not exceed 100')
    .default(20),
});

export const userSearchSchema = z.object({
  query: z
    .string()
    .min(1, 'Search query cannot be empty')
    .max(50, 'Search query must not exceed 50 characters'),
  limit: z
    .number()
    .int()
    .positive()
    .max(20, 'Limit must not exceed 20')
    .default(20),
});

// ============================================================================
// WEBSOCKET EVENT SCHEMAS
// ============================================================================

export const typingEventSchema = z.object({
  chatId: uuidSchema,
  isTyping: z.boolean(),
});

export const presenceEventSchema = z.object({
  status: userStatusSchema,
});

export const readReceiptEventSchema = z.object({
  chatId: uuidSchema,
  messageId: uuidSchema,
});

// ============================================================================
// QUERY PARAMETER SCHEMAS
// ============================================================================

export const chatQueryParamsSchema = z.object({
  type: chatTypeSchema.optional(),
  includeDeleted: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional(),
  offset: z.string().transform(Number).pipe(z.number().int().min(0)).optional(),
});

export const messageQueryParamsSchema = z.object({
  chatId: uuidSchema.optional(),
  before: timestampSchema.optional(),
  after: timestampSchema.optional(),
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional(),
  offset: z.string().transform(Number).pipe(z.number().int().min(0)).optional(),
});

export const contactQueryParamsSchema = z.object({
  status: contactStatusSchema.optional(),
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional(),
  offset: z.string().transform(Number).pipe(z.number().int().min(0)).optional(),
});

// ============================================================================
// TYPE EXPORTS (inferred from schemas)
// ============================================================================

export type UserRegistration = z.infer<typeof userRegistrationSchema>;
export type UserLogin = z.infer<typeof userLoginSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;

export type RefreshToken = z.infer<typeof refreshTokenSchema>;
export type DeviceInfo = z.infer<typeof deviceInfoSchema>;
export type Session = z.infer<typeof sessionSchema>;

export type ContactRequest = z.infer<typeof contactRequestSchema>;
export type ContactResponse = z.infer<typeof contactResponseSchema>;
export type Contact = z.infer<typeof contactSchema>;

export type CreateDirectChat = z.infer<typeof createDirectChatSchema>;
export type CreateGroupChat = z.infer<typeof createGroupChatSchema>;
export type UpdateGroupChat = z.infer<typeof updateGroupChatSchema>;
export type AddParticipants = z.infer<typeof addParticipantsSchema>;
export type RemoveParticipant = z.infer<typeof removeParticipantSchema>;
export type UpdateParticipantRole = z.infer<typeof updateParticipantRoleSchema>;
export type Chat = z.infer<typeof chatSchema>;
export type ChatParticipant = z.infer<typeof chatParticipantSchema>;

export type CreateMessage = z.infer<typeof createMessageSchema>;
export type UpdateMessage = z.infer<typeof updateMessageSchema>;
export type Message = z.infer<typeof messageSchema>;
export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

export type Attachment = z.infer<typeof attachmentSchema>;
export type UploadImage = z.infer<typeof uploadImageSchema>;

export type AddReaction = z.infer<typeof addReactionSchema>;
export type Reaction = z.infer<typeof reactionSchema>;

export type MessageDelivery = z.infer<typeof messageDeliverySchema>;
export type MarkMessagesRead = z.infer<typeof markMessagesReadSchema>;
export type MarkChatRead = z.infer<typeof markChatReadSchema>;

export type Pagination = z.infer<typeof paginationSchema>;
export type CursorPagination = z.infer<typeof cursorPaginationSchema>;
export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type UserSearch = z.infer<typeof userSearchSchema>;

export type TypingEvent = z.infer<typeof typingEventSchema>;
export type PresenceEvent = z.infer<typeof presenceEventSchema>;
export type ReadReceiptEvent = z.infer<typeof readReceiptEventSchema>;

export type ChatQueryParams = z.infer<typeof chatQueryParamsSchema>;
export type MessageQueryParams = z.infer<typeof messageQueryParamsSchema>;
export type ContactQueryParams = z.infer<typeof contactQueryParamsSchema>;

// ============================================================================
// CALL VALIDATORS
// ============================================================================

export const callTypeSchema = z.enum(['audio', 'video']);

export const callResponseSchema = z.enum(['accept', 'reject']);

export const respondToCallSchema = z.object({
  callId: uuidSchema,
  response: callResponseSchema,
  sdp: z.any().optional(), // WebRTC SDP data
});

export const endCallSchema = z.object({
  callId: uuidSchema,
});

export const callSchema = z.object({
  id: uuidSchema,
  callerId: uuidSchema,
  callerName: z.string(),
  recipientId: uuidSchema,
  recipientName: z.string().optional(),
  type: callTypeSchema,
  status: z.enum(['pending', 'active', 'ended', 'rejected']),
  createdAt: timestampSchema,
  answeredAt: timestampSchema.optional(),
  endedAt: timestampSchema.optional(),
  sdp: z.any().optional(),
});

export type CallType = z.infer<typeof callTypeSchema>;
export type CallResponse = z.infer<typeof callResponseSchema>;
export type RespondToCall = z.infer<typeof respondToCallSchema>;
export type EndCall = z.infer<typeof endCallSchema>;
export type Call = z.infer<typeof callSchema>;

// ============================================================================
// CONVENIENCE VALIDATOR FUNCTIONS
// ============================================================================

export function validateUsername(username: string): boolean {
  return usernameSchema.safeParse(username).success;
}

export function validatePassword(password: string): boolean {
  return passwordSchema.safeParse(password).success;
}

export function validateStrongPassword(password: string): boolean {
  return strongPasswordSchema.safeParse(password).success;
}

export function validateEmail(email: string): boolean {
  return emailSchema.safeParse(email).success;
}

export function validateUuid(uuid: string): boolean {
  return uuidSchema.safeParse(uuid).success;
}

export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

export function sanitizeMessageContent(content: string): string {
  // Remove any HTML tags and script content
  return content
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '');
}

// ============================================================================
// VALIDATION RESULT HELPERS
// ============================================================================

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  return {
    success: false,
    errors: result.error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    })),
  };
}

export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}
