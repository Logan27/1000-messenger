"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationSchema = exports.markChatReadSchema = exports.markMessagesReadSchema = exports.messageDeliverySchema = exports.deliveryStatusSchema = exports.reactionSchema = exports.addReactionSchema = exports.emojiSchema = exports.uploadImageSchema = exports.attachmentSchema = exports.imageFileTypeSchema = exports.messageSchema = exports.updateMessageSchema = exports.createMessageSchema = exports.messageMetadataSchema = exports.messageFormattingSchema = exports.messageContentSchema = exports.messageContentTypeSchema = exports.chatParticipantSchema = exports.chatSchema = exports.updateParticipantRoleSchema = exports.removeParticipantSchema = exports.addParticipantsSchema = exports.updateGroupChatSchema = exports.createGroupChatSchema = exports.createDirectChatSchema = exports.chatSlugSchema = exports.chatNameSchema = exports.participantRoleSchema = exports.chatTypeSchema = exports.contactSchema = exports.contactResponseSchema = exports.contactRequestSchema = exports.contactStatusSchema = exports.sessionSchema = exports.deviceInfoSchema = exports.refreshTokenSchema = exports.userProfileSchema = exports.userUpdateSchema = exports.userLoginSchema = exports.userRegistrationSchema = exports.timestampSchema = exports.userStatusSchema = exports.avatarUrlSchema = exports.displayNameSchema = exports.emailSchema = exports.strongPasswordSchema = exports.passwordSchema = exports.usernameSchema = exports.uuidSchema = void 0;
exports.contactQueryParamsSchema = exports.messageQueryParamsSchema = exports.chatQueryParamsSchema = exports.readReceiptEventSchema = exports.presenceEventSchema = exports.typingEventSchema = exports.userSearchSchema = exports.searchQuerySchema = exports.cursorPaginationSchema = void 0;
exports.validateUsername = validateUsername;
exports.validatePassword = validatePassword;
exports.validateStrongPassword = validateStrongPassword;
exports.validateEmail = validateEmail;
exports.validateUuid = validateUuid;
exports.sanitizeString = sanitizeString;
exports.sanitizeMessageContent = sanitizeMessageContent;
exports.validate = validate;
exports.validateOrThrow = validateOrThrow;
const zod_1 = require("zod");
exports.uuidSchema = zod_1.z.string().uuid();
exports.usernameSchema = zod_1.z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must not exceed 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores');
exports.passwordSchema = zod_1.z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters');
exports.strongPasswordSchema = exports.passwordSchema.refine((password) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
}, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
});
exports.emailSchema = zod_1.z.string().email('Invalid email address');
exports.displayNameSchema = zod_1.z
    .string()
    .min(1, 'Display name cannot be empty')
    .max(100, 'Display name must not exceed 100 characters')
    .optional();
exports.avatarUrlSchema = zod_1.z
    .string()
    .url('Invalid avatar URL')
    .max(500, 'Avatar URL must not exceed 500 characters')
    .optional();
exports.userStatusSchema = zod_1.z.enum(['online', 'offline', 'away']);
exports.timestampSchema = zod_1.z.union([zod_1.z.string().datetime(), zod_1.z.date()]);
exports.userRegistrationSchema = zod_1.z.object({
    username: exports.usernameSchema,
    password: exports.passwordSchema,
    displayName: exports.displayNameSchema,
});
exports.userLoginSchema = zod_1.z.object({
    username: zod_1.z.string().min(1, 'Username is required'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.userUpdateSchema = zod_1.z.object({
    displayName: exports.displayNameSchema,
    avatarUrl: exports.avatarUrlSchema,
    status: exports.userStatusSchema.optional(),
});
exports.userProfileSchema = zod_1.z.object({
    id: exports.uuidSchema,
    username: exports.usernameSchema,
    displayName: zod_1.z.string().max(100).nullable(),
    avatarUrl: zod_1.z.string().max(500).nullable(),
    status: exports.userStatusSchema,
    lastSeen: exports.timestampSchema.nullable(),
    createdAt: exports.timestampSchema,
    updatedAt: exports.timestampSchema,
});
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, 'Refresh token is required'),
});
exports.deviceInfoSchema = zod_1.z.object({
    deviceId: zod_1.z.string().optional(),
    deviceType: zod_1.z.string().optional(),
    deviceName: zod_1.z.string().optional(),
    ipAddress: zod_1.z.string().ip().optional(),
    userAgent: zod_1.z.string().optional(),
});
exports.sessionSchema = zod_1.z.object({
    id: exports.uuidSchema,
    userId: exports.uuidSchema,
    sessionToken: zod_1.z.string(),
    deviceId: zod_1.z.string().nullable(),
    deviceType: zod_1.z.string().nullable(),
    deviceName: zod_1.z.string().nullable(),
    socketId: zod_1.z.string().nullable(),
    ipAddress: zod_1.z.string().nullable(),
    userAgent: zod_1.z.string().nullable(),
    isActive: zod_1.z.boolean(),
    lastActivity: exports.timestampSchema,
    createdAt: exports.timestampSchema,
    expiresAt: exports.timestampSchema,
});
exports.contactStatusSchema = zod_1.z.enum(['pending', 'accepted', 'blocked']);
exports.contactRequestSchema = zod_1.z.object({
    contactId: exports.uuidSchema,
});
exports.contactResponseSchema = zod_1.z.object({
    contactRequestId: exports.uuidSchema,
    action: zod_1.z.enum(['accept', 'reject']),
});
exports.contactSchema = zod_1.z.object({
    id: exports.uuidSchema,
    userId: exports.uuidSchema,
    contactId: exports.uuidSchema,
    status: exports.contactStatusSchema,
    requestedBy: exports.uuidSchema,
    createdAt: exports.timestampSchema,
    acceptedAt: exports.timestampSchema.nullable(),
});
exports.chatTypeSchema = zod_1.z.enum(['direct', 'group']);
exports.participantRoleSchema = zod_1.z.enum(['owner', 'admin', 'member']);
exports.chatNameSchema = zod_1.z
    .string()
    .min(1, 'Chat name cannot be empty')
    .max(100, 'Chat name must not exceed 100 characters');
exports.chatSlugSchema = zod_1.z
    .string()
    .min(1)
    .max(100, 'Chat slug must not exceed 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Chat slug can only contain lowercase letters, numbers, and hyphens')
    .optional();
exports.createDirectChatSchema = zod_1.z.object({
    participantId: exports.uuidSchema,
});
exports.createGroupChatSchema = zod_1.z.object({
    name: exports.chatNameSchema,
    participantIds: zod_1.z
        .array(exports.uuidSchema)
        .min(1, 'Group chat must have at least one participant')
        .max(299, 'Group chat cannot have more than 299 participants'),
    avatarUrl: exports.avatarUrlSchema,
    slug: exports.chatSlugSchema,
});
exports.updateGroupChatSchema = zod_1.z.object({
    name: exports.chatNameSchema.optional(),
    avatarUrl: exports.avatarUrlSchema,
    slug: exports.chatSlugSchema,
});
exports.addParticipantsSchema = zod_1.z.object({
    participantIds: zod_1.z
        .array(exports.uuidSchema)
        .min(1, 'Must add at least one participant')
        .max(50, 'Cannot add more than 50 participants at once'),
});
exports.removeParticipantSchema = zod_1.z.object({
    participantId: exports.uuidSchema,
});
exports.updateParticipantRoleSchema = zod_1.z.object({
    participantId: exports.uuidSchema,
    role: exports.participantRoleSchema,
});
exports.chatSchema = zod_1.z.object({
    id: exports.uuidSchema,
    type: exports.chatTypeSchema,
    name: zod_1.z.string().max(100).nullable(),
    slug: zod_1.z.string().max(100).nullable(),
    avatarUrl: zod_1.z.string().max(500).nullable(),
    ownerId: exports.uuidSchema.nullable(),
    createdAt: exports.timestampSchema,
    updatedAt: exports.timestampSchema,
    lastMessageAt: exports.timestampSchema.nullable(),
    isDeleted: zod_1.z.boolean(),
});
exports.chatParticipantSchema = zod_1.z.object({
    id: exports.uuidSchema,
    chatId: exports.uuidSchema,
    userId: exports.uuidSchema,
    role: exports.participantRoleSchema,
    joinedAt: exports.timestampSchema,
    leftAt: exports.timestampSchema.nullable(),
});
exports.messageContentTypeSchema = zod_1.z.enum(['text', 'image', 'system']);
exports.messageContentSchema = zod_1.z
    .string()
    .min(1, 'Message content cannot be empty')
    .max(10000, 'Message content must not exceed 10,000 characters');
exports.messageFormattingSchema = zod_1.z.object({
    bold: zod_1.z.array(zod_1.z.tuple([zod_1.z.number(), zod_1.z.number()])).optional(),
    italic: zod_1.z.array(zod_1.z.tuple([zod_1.z.number(), zod_1.z.number()])).optional(),
});
exports.messageMetadataSchema = zod_1.z.object({
    formatting: exports.messageFormattingSchema.optional(),
    attachments: zod_1.z.array(exports.uuidSchema).optional(),
    systemMessageType: zod_1.z.string().optional(),
});
exports.createMessageSchema = zod_1.z.object({
    content: exports.messageContentSchema,
    contentType: exports.messageContentTypeSchema.optional(),
    metadata: exports.messageMetadataSchema.optional(),
    replyToId: exports.uuidSchema.optional(),
});
exports.updateMessageSchema = zod_1.z.object({
    content: exports.messageContentSchema,
    metadata: exports.messageMetadataSchema.optional(),
});
exports.messageSchema = zod_1.z.object({
    id: exports.uuidSchema,
    chatId: exports.uuidSchema,
    senderId: exports.uuidSchema.nullable(),
    content: zod_1.z.string().max(10000),
    contentType: exports.messageContentTypeSchema,
    metadata: zod_1.z.record(zod_1.z.any()),
    replyToId: exports.uuidSchema.nullable(),
    isEdited: zod_1.z.boolean(),
    editedAt: exports.timestampSchema.nullable(),
    isDeleted: zod_1.z.boolean(),
    deletedAt: exports.timestampSchema.nullable(),
    createdAt: exports.timestampSchema,
});
exports.imageFileTypeSchema = zod_1.z.enum([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
]);
exports.attachmentSchema = zod_1.z.object({
    id: exports.uuidSchema,
    messageId: exports.uuidSchema,
    fileName: zod_1.z.string().min(1).max(255),
    fileType: exports.imageFileTypeSchema,
    fileSize: zod_1.z
        .number()
        .int()
        .positive()
        .max(10485760, 'File size must not exceed 10MB'),
    storageKey: zod_1.z.string().max(500),
    thumbnailKey: zod_1.z.string().max(500),
    url: zod_1.z.string().url().max(500),
    thumbnailUrl: zod_1.z.string().url().max(500),
    width: zod_1.z.number().int().positive().nullable(),
    height: zod_1.z.number().int().positive().nullable(),
    createdAt: exports.timestampSchema,
});
exports.uploadImageSchema = zod_1.z.object({
    fileName: zod_1.z.string().min(1).max(255),
    fileType: exports.imageFileTypeSchema,
    fileSize: zod_1.z
        .number()
        .int()
        .positive()
        .max(10485760, 'File size must not exceed 10MB'),
});
exports.emojiSchema = zod_1.z
    .string()
    .min(1, 'Emoji cannot be empty')
    .max(10, 'Emoji must not exceed 10 characters');
exports.addReactionSchema = zod_1.z.object({
    emoji: exports.emojiSchema,
});
exports.reactionSchema = zod_1.z.object({
    id: exports.uuidSchema,
    messageId: exports.uuidSchema,
    userId: exports.uuidSchema,
    emoji: exports.emojiSchema,
    createdAt: exports.timestampSchema,
});
exports.deliveryStatusSchema = zod_1.z.enum(['pending', 'delivered', 'read']);
exports.messageDeliverySchema = zod_1.z.object({
    id: exports.uuidSchema,
    messageId: exports.uuidSchema,
    userId: exports.uuidSchema,
    status: exports.deliveryStatusSchema,
    deliveredAt: exports.timestampSchema.nullable(),
    readAt: exports.timestampSchema.nullable(),
    createdAt: exports.timestampSchema,
});
exports.markMessagesReadSchema = zod_1.z.object({
    messageIds: zod_1.z.array(exports.uuidSchema).min(1, 'Must provide at least one message ID'),
});
exports.markChatReadSchema = zod_1.z.object({
    chatId: exports.uuidSchema,
});
exports.paginationSchema = zod_1.z.object({
    limit: zod_1.z
        .number()
        .int()
        .positive()
        .max(100, 'Limit must not exceed 100')
        .default(50),
    offset: zod_1.z
        .number()
        .int()
        .min(0, 'Offset must be non-negative')
        .default(0),
});
exports.cursorPaginationSchema = zod_1.z.object({
    limit: zod_1.z
        .number()
        .int()
        .positive()
        .max(100, 'Limit must not exceed 100')
        .default(50),
    cursor: exports.uuidSchema.optional(),
});
exports.searchQuerySchema = zod_1.z.object({
    query: zod_1.z
        .string()
        .min(1, 'Search query cannot be empty')
        .max(100, 'Search query must not exceed 100 characters'),
    chatId: exports.uuidSchema.optional(),
    limit: zod_1.z
        .number()
        .int()
        .positive()
        .max(100, 'Limit must not exceed 100')
        .default(20),
});
exports.userSearchSchema = zod_1.z.object({
    query: zod_1.z
        .string()
        .min(1, 'Search query cannot be empty')
        .max(50, 'Search query must not exceed 50 characters'),
    limit: zod_1.z
        .number()
        .int()
        .positive()
        .max(20, 'Limit must not exceed 20')
        .default(20),
});
exports.typingEventSchema = zod_1.z.object({
    chatId: exports.uuidSchema,
    isTyping: zod_1.z.boolean(),
});
exports.presenceEventSchema = zod_1.z.object({
    status: exports.userStatusSchema,
});
exports.readReceiptEventSchema = zod_1.z.object({
    chatId: exports.uuidSchema,
    messageId: exports.uuidSchema,
});
exports.chatQueryParamsSchema = zod_1.z.object({
    type: exports.chatTypeSchema.optional(),
    includeDeleted: zod_1.z
        .string()
        .transform((val) => val === 'true')
        .optional(),
    limit: zod_1.z.string().transform(Number).pipe(zod_1.z.number().int().positive().max(100)).optional(),
    offset: zod_1.z.string().transform(Number).pipe(zod_1.z.number().int().min(0)).optional(),
});
exports.messageQueryParamsSchema = zod_1.z.object({
    chatId: exports.uuidSchema.optional(),
    before: exports.timestampSchema.optional(),
    after: exports.timestampSchema.optional(),
    limit: zod_1.z.string().transform(Number).pipe(zod_1.z.number().int().positive().max(100)).optional(),
    offset: zod_1.z.string().transform(Number).pipe(zod_1.z.number().int().min(0)).optional(),
});
exports.contactQueryParamsSchema = zod_1.z.object({
    status: exports.contactStatusSchema.optional(),
    limit: zod_1.z.string().transform(Number).pipe(zod_1.z.number().int().positive().max(100)).optional(),
    offset: zod_1.z.string().transform(Number).pipe(zod_1.z.number().int().min(0)).optional(),
});
function validateUsername(username) {
    return exports.usernameSchema.safeParse(username).success;
}
function validatePassword(password) {
    return exports.passwordSchema.safeParse(password).success;
}
function validateStrongPassword(password) {
    return exports.strongPasswordSchema.safeParse(password).success;
}
function validateEmail(email) {
    return exports.emailSchema.safeParse(email).success;
}
function validateUuid(uuid) {
    return exports.uuidSchema.safeParse(uuid).success;
}
function sanitizeString(input) {
    return input.trim().replace(/[<>]/g, '');
}
function sanitizeMessageContent(content) {
    return content
        .trim()
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]+>/g, '');
}
function validate(schema, data) {
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
function validateOrThrow(schema, data) {
    return schema.parse(data);
}
//# sourceMappingURL=validators.util.js.map