import { z } from 'zod';
export declare const uuidSchema: z.ZodString;
export declare const usernameSchema: z.ZodString;
export declare const passwordSchema: z.ZodString;
export declare const strongPasswordSchema: z.ZodEffects<z.ZodString, string, string>;
export declare const emailSchema: z.ZodString;
export declare const displayNameSchema: z.ZodOptional<z.ZodString>;
export declare const avatarUrlSchema: z.ZodOptional<z.ZodString>;
export declare const userStatusSchema: z.ZodEnum<["online", "offline", "away"]>;
export declare const timestampSchema: z.ZodUnion<[z.ZodString, z.ZodDate]>;
export declare const userRegistrationSchema: z.ZodObject<{
    username: z.ZodString;
    password: z.ZodString;
    displayName: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    password: string;
    username: string;
    displayName?: string | undefined;
}, {
    password: string;
    username: string;
    displayName?: string | undefined;
}>;
export declare const userLoginSchema: z.ZodObject<{
    username: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    username: string;
}, {
    password: string;
    username: string;
}>;
export declare const userUpdateSchema: z.ZodObject<{
    displayName: z.ZodOptional<z.ZodString>;
    avatarUrl: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["online", "offline", "away"]>>;
}, "strip", z.ZodTypeAny, {
    status?: "online" | "offline" | "away" | undefined;
    displayName?: string | undefined;
    avatarUrl?: string | undefined;
}, {
    status?: "online" | "offline" | "away" | undefined;
    displayName?: string | undefined;
    avatarUrl?: string | undefined;
}>;
export declare const userProfileSchema: z.ZodObject<{
    id: z.ZodString;
    username: z.ZodString;
    displayName: z.ZodNullable<z.ZodString>;
    avatarUrl: z.ZodNullable<z.ZodString>;
    status: z.ZodEnum<["online", "offline", "away"]>;
    lastSeen: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
    createdAt: z.ZodUnion<[z.ZodString, z.ZodDate]>;
    updatedAt: z.ZodUnion<[z.ZodString, z.ZodDate]>;
}, "strip", z.ZodTypeAny, {
    status: "online" | "offline" | "away";
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    lastSeen: string | Date | null;
    createdAt: string | Date;
    updatedAt: string | Date;
}, {
    status: "online" | "offline" | "away";
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    lastSeen: string | Date | null;
    createdAt: string | Date;
    updatedAt: string | Date;
}>;
export declare const refreshTokenSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export declare const deviceInfoSchema: z.ZodObject<{
    deviceId: z.ZodOptional<z.ZodString>;
    deviceType: z.ZodOptional<z.ZodString>;
    deviceName: z.ZodOptional<z.ZodString>;
    ipAddress: z.ZodOptional<z.ZodString>;
    userAgent: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    deviceType?: string | undefined;
    deviceName?: string | undefined;
    deviceId?: string | undefined;
    ipAddress?: string | undefined;
    userAgent?: string | undefined;
}, {
    deviceType?: string | undefined;
    deviceName?: string | undefined;
    deviceId?: string | undefined;
    ipAddress?: string | undefined;
    userAgent?: string | undefined;
}>;
export declare const sessionSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    sessionToken: z.ZodString;
    deviceId: z.ZodNullable<z.ZodString>;
    deviceType: z.ZodNullable<z.ZodString>;
    deviceName: z.ZodNullable<z.ZodString>;
    socketId: z.ZodNullable<z.ZodString>;
    ipAddress: z.ZodNullable<z.ZodString>;
    userAgent: z.ZodNullable<z.ZodString>;
    isActive: z.ZodBoolean;
    lastActivity: z.ZodUnion<[z.ZodString, z.ZodDate]>;
    createdAt: z.ZodUnion<[z.ZodString, z.ZodDate]>;
    expiresAt: z.ZodUnion<[z.ZodString, z.ZodDate]>;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string | Date;
    isActive: boolean;
    userId: string;
    deviceType: string | null;
    deviceName: string | null;
    lastActivity: string | Date;
    deviceId: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    sessionToken: string;
    socketId: string | null;
    expiresAt: string | Date;
}, {
    id: string;
    createdAt: string | Date;
    isActive: boolean;
    userId: string;
    deviceType: string | null;
    deviceName: string | null;
    lastActivity: string | Date;
    deviceId: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    sessionToken: string;
    socketId: string | null;
    expiresAt: string | Date;
}>;
export declare const contactStatusSchema: z.ZodEnum<["pending", "accepted", "blocked"]>;
export declare const contactRequestSchema: z.ZodObject<{
    contactId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    contactId: string;
}, {
    contactId: string;
}>;
export declare const contactResponseSchema: z.ZodObject<{
    contactRequestId: z.ZodString;
    action: z.ZodEnum<["accept", "reject"]>;
}, "strip", z.ZodTypeAny, {
    contactRequestId: string;
    action: "accept" | "reject";
}, {
    contactRequestId: string;
    action: "accept" | "reject";
}>;
export declare const contactSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    contactId: z.ZodString;
    status: z.ZodEnum<["pending", "accepted", "blocked"]>;
    requestedBy: z.ZodString;
    createdAt: z.ZodUnion<[z.ZodString, z.ZodDate]>;
    acceptedAt: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "accepted" | "blocked";
    id: string;
    createdAt: string | Date;
    userId: string;
    contactId: string;
    requestedBy: string;
    acceptedAt: string | Date | null;
}, {
    status: "pending" | "accepted" | "blocked";
    id: string;
    createdAt: string | Date;
    userId: string;
    contactId: string;
    requestedBy: string;
    acceptedAt: string | Date | null;
}>;
export declare const chatTypeSchema: z.ZodEnum<["direct", "group"]>;
export declare const participantRoleSchema: z.ZodEnum<["owner", "admin", "member"]>;
export declare const chatNameSchema: z.ZodString;
export declare const chatSlugSchema: z.ZodOptional<z.ZodString>;
export declare const createDirectChatSchema: z.ZodObject<{
    participantId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    participantId: string;
}, {
    participantId: string;
}>;
export declare const createGroupChatSchema: z.ZodObject<{
    name: z.ZodString;
    participantIds: z.ZodArray<z.ZodString, "many">;
    avatarUrl: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    participantIds: string[];
    avatarUrl?: string | undefined;
    slug?: string | undefined;
}, {
    name: string;
    participantIds: string[];
    avatarUrl?: string | undefined;
    slug?: string | undefined;
}>;
export declare const updateGroupChatSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    avatarUrl: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    avatarUrl?: string | undefined;
    name?: string | undefined;
    slug?: string | undefined;
}, {
    avatarUrl?: string | undefined;
    name?: string | undefined;
    slug?: string | undefined;
}>;
export declare const addParticipantsSchema: z.ZodObject<{
    participantIds: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    participantIds: string[];
}, {
    participantIds: string[];
}>;
export declare const removeParticipantSchema: z.ZodObject<{
    participantId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    participantId: string;
}, {
    participantId: string;
}>;
export declare const updateParticipantRoleSchema: z.ZodObject<{
    participantId: z.ZodString;
    role: z.ZodEnum<["owner", "admin", "member"]>;
}, "strip", z.ZodTypeAny, {
    role: "owner" | "admin" | "member";
    participantId: string;
}, {
    role: "owner" | "admin" | "member";
    participantId: string;
}>;
export declare const chatSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<["direct", "group"]>;
    name: z.ZodNullable<z.ZodString>;
    slug: z.ZodNullable<z.ZodString>;
    avatarUrl: z.ZodNullable<z.ZodString>;
    ownerId: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodUnion<[z.ZodString, z.ZodDate]>;
    updatedAt: z.ZodUnion<[z.ZodString, z.ZodDate]>;
    lastMessageAt: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
    isDeleted: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    type: "direct" | "group";
    id: string;
    avatarUrl: string | null;
    createdAt: string | Date;
    updatedAt: string | Date;
    name: string | null;
    slug: string | null;
    ownerId: string | null;
    lastMessageAt: string | Date | null;
    isDeleted: boolean;
}, {
    type: "direct" | "group";
    id: string;
    avatarUrl: string | null;
    createdAt: string | Date;
    updatedAt: string | Date;
    name: string | null;
    slug: string | null;
    ownerId: string | null;
    lastMessageAt: string | Date | null;
    isDeleted: boolean;
}>;
export declare const chatParticipantSchema: z.ZodObject<{
    id: z.ZodString;
    chatId: z.ZodString;
    userId: z.ZodString;
    role: z.ZodEnum<["owner", "admin", "member"]>;
    joinedAt: z.ZodUnion<[z.ZodString, z.ZodDate]>;
    leftAt: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    role: "owner" | "admin" | "member";
    userId: string;
    chatId: string;
    joinedAt: string | Date;
    leftAt: string | Date | null;
}, {
    id: string;
    role: "owner" | "admin" | "member";
    userId: string;
    chatId: string;
    joinedAt: string | Date;
    leftAt: string | Date | null;
}>;
export declare const messageContentTypeSchema: z.ZodEnum<["text", "image", "system"]>;
export declare const messageContentSchema: z.ZodString;
export declare const messageFormattingSchema: z.ZodObject<{
    bold: z.ZodOptional<z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>, "many">>;
    italic: z.ZodOptional<z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>, "many">>;
}, "strip", z.ZodTypeAny, {
    bold?: [number, number][] | undefined;
    italic?: [number, number][] | undefined;
}, {
    bold?: [number, number][] | undefined;
    italic?: [number, number][] | undefined;
}>;
export declare const messageMetadataSchema: z.ZodObject<{
    formatting: z.ZodOptional<z.ZodObject<{
        bold: z.ZodOptional<z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>, "many">>;
        italic: z.ZodOptional<z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>, "many">>;
    }, "strip", z.ZodTypeAny, {
        bold?: [number, number][] | undefined;
        italic?: [number, number][] | undefined;
    }, {
        bold?: [number, number][] | undefined;
        italic?: [number, number][] | undefined;
    }>>;
    attachments: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    systemMessageType: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    formatting?: {
        bold?: [number, number][] | undefined;
        italic?: [number, number][] | undefined;
    } | undefined;
    attachments?: string[] | undefined;
    systemMessageType?: string | undefined;
}, {
    formatting?: {
        bold?: [number, number][] | undefined;
        italic?: [number, number][] | undefined;
    } | undefined;
    attachments?: string[] | undefined;
    systemMessageType?: string | undefined;
}>;
export declare const createMessageSchema: z.ZodObject<{
    content: z.ZodString;
    contentType: z.ZodOptional<z.ZodEnum<["text", "image", "system"]>>;
    metadata: z.ZodOptional<z.ZodObject<{
        formatting: z.ZodOptional<z.ZodObject<{
            bold: z.ZodOptional<z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>, "many">>;
            italic: z.ZodOptional<z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>, "many">>;
        }, "strip", z.ZodTypeAny, {
            bold?: [number, number][] | undefined;
            italic?: [number, number][] | undefined;
        }, {
            bold?: [number, number][] | undefined;
            italic?: [number, number][] | undefined;
        }>>;
        attachments: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        systemMessageType: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        formatting?: {
            bold?: [number, number][] | undefined;
            italic?: [number, number][] | undefined;
        } | undefined;
        attachments?: string[] | undefined;
        systemMessageType?: string | undefined;
    }, {
        formatting?: {
            bold?: [number, number][] | undefined;
            italic?: [number, number][] | undefined;
        } | undefined;
        attachments?: string[] | undefined;
        systemMessageType?: string | undefined;
    }>>;
    replyToId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    content: string;
    contentType?: "text" | "image" | "system" | undefined;
    metadata?: {
        formatting?: {
            bold?: [number, number][] | undefined;
            italic?: [number, number][] | undefined;
        } | undefined;
        attachments?: string[] | undefined;
        systemMessageType?: string | undefined;
    } | undefined;
    replyToId?: string | undefined;
}, {
    content: string;
    contentType?: "text" | "image" | "system" | undefined;
    metadata?: {
        formatting?: {
            bold?: [number, number][] | undefined;
            italic?: [number, number][] | undefined;
        } | undefined;
        attachments?: string[] | undefined;
        systemMessageType?: string | undefined;
    } | undefined;
    replyToId?: string | undefined;
}>;
export declare const updateMessageSchema: z.ZodObject<{
    content: z.ZodString;
    metadata: z.ZodOptional<z.ZodObject<{
        formatting: z.ZodOptional<z.ZodObject<{
            bold: z.ZodOptional<z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>, "many">>;
            italic: z.ZodOptional<z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>, "many">>;
        }, "strip", z.ZodTypeAny, {
            bold?: [number, number][] | undefined;
            italic?: [number, number][] | undefined;
        }, {
            bold?: [number, number][] | undefined;
            italic?: [number, number][] | undefined;
        }>>;
        attachments: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        systemMessageType: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        formatting?: {
            bold?: [number, number][] | undefined;
            italic?: [number, number][] | undefined;
        } | undefined;
        attachments?: string[] | undefined;
        systemMessageType?: string | undefined;
    }, {
        formatting?: {
            bold?: [number, number][] | undefined;
            italic?: [number, number][] | undefined;
        } | undefined;
        attachments?: string[] | undefined;
        systemMessageType?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    content: string;
    metadata?: {
        formatting?: {
            bold?: [number, number][] | undefined;
            italic?: [number, number][] | undefined;
        } | undefined;
        attachments?: string[] | undefined;
        systemMessageType?: string | undefined;
    } | undefined;
}, {
    content: string;
    metadata?: {
        formatting?: {
            bold?: [number, number][] | undefined;
            italic?: [number, number][] | undefined;
        } | undefined;
        attachments?: string[] | undefined;
        systemMessageType?: string | undefined;
    } | undefined;
}>;
export declare const messageSchema: z.ZodObject<{
    id: z.ZodString;
    chatId: z.ZodString;
    senderId: z.ZodNullable<z.ZodString>;
    content: z.ZodString;
    contentType: z.ZodEnum<["text", "image", "system"]>;
    metadata: z.ZodRecord<z.ZodString, z.ZodAny>;
    replyToId: z.ZodNullable<z.ZodString>;
    isEdited: z.ZodBoolean;
    editedAt: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
    isDeleted: z.ZodBoolean;
    deletedAt: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
    createdAt: z.ZodUnion<[z.ZodString, z.ZodDate]>;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string | Date;
    isDeleted: boolean;
    chatId: string;
    content: string;
    contentType: "text" | "image" | "system";
    metadata: Record<string, any>;
    replyToId: string | null;
    senderId: string | null;
    isEdited: boolean;
    editedAt: string | Date | null;
    deletedAt: string | Date | null;
}, {
    id: string;
    createdAt: string | Date;
    isDeleted: boolean;
    chatId: string;
    content: string;
    contentType: "text" | "image" | "system";
    metadata: Record<string, any>;
    replyToId: string | null;
    senderId: string | null;
    isEdited: boolean;
    editedAt: string | Date | null;
    deletedAt: string | Date | null;
}>;
export declare const imageFileTypeSchema: z.ZodEnum<["image/jpeg", "image/png", "image/gif", "image/webp"]>;
export declare const attachmentSchema: z.ZodObject<{
    id: z.ZodString;
    messageId: z.ZodString;
    fileName: z.ZodString;
    fileType: z.ZodEnum<["image/jpeg", "image/png", "image/gif", "image/webp"]>;
    fileSize: z.ZodNumber;
    storageKey: z.ZodString;
    thumbnailKey: z.ZodString;
    url: z.ZodString;
    thumbnailUrl: z.ZodString;
    width: z.ZodNullable<z.ZodNumber>;
    height: z.ZodNullable<z.ZodNumber>;
    createdAt: z.ZodUnion<[z.ZodString, z.ZodDate]>;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string | Date;
    url: string;
    messageId: string;
    fileName: string;
    fileType: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
    fileSize: number;
    storageKey: string;
    thumbnailKey: string;
    thumbnailUrl: string;
    width: number | null;
    height: number | null;
}, {
    id: string;
    createdAt: string | Date;
    url: string;
    messageId: string;
    fileName: string;
    fileType: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
    fileSize: number;
    storageKey: string;
    thumbnailKey: string;
    thumbnailUrl: string;
    width: number | null;
    height: number | null;
}>;
export declare const uploadImageSchema: z.ZodObject<{
    fileName: z.ZodString;
    fileType: z.ZodEnum<["image/jpeg", "image/png", "image/gif", "image/webp"]>;
    fileSize: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    fileName: string;
    fileType: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
    fileSize: number;
}, {
    fileName: string;
    fileType: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
    fileSize: number;
}>;
export declare const emojiSchema: z.ZodString;
export declare const addReactionSchema: z.ZodObject<{
    emoji: z.ZodString;
}, "strip", z.ZodTypeAny, {
    emoji: string;
}, {
    emoji: string;
}>;
export declare const reactionSchema: z.ZodObject<{
    id: z.ZodString;
    messageId: z.ZodString;
    userId: z.ZodString;
    emoji: z.ZodString;
    createdAt: z.ZodUnion<[z.ZodString, z.ZodDate]>;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string | Date;
    userId: string;
    messageId: string;
    emoji: string;
}, {
    id: string;
    createdAt: string | Date;
    userId: string;
    messageId: string;
    emoji: string;
}>;
export declare const deliveryStatusSchema: z.ZodEnum<["pending", "delivered", "read"]>;
export declare const messageDeliverySchema: z.ZodObject<{
    id: z.ZodString;
    messageId: z.ZodString;
    userId: z.ZodString;
    status: z.ZodEnum<["pending", "delivered", "read"]>;
    deliveredAt: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
    readAt: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
    createdAt: z.ZodUnion<[z.ZodString, z.ZodDate]>;
}, "strip", z.ZodTypeAny, {
    status: "delivered" | "read" | "pending";
    id: string;
    createdAt: string | Date;
    userId: string;
    messageId: string;
    deliveredAt: string | Date | null;
    readAt: string | Date | null;
}, {
    status: "delivered" | "read" | "pending";
    id: string;
    createdAt: string | Date;
    userId: string;
    messageId: string;
    deliveredAt: string | Date | null;
    readAt: string | Date | null;
}>;
export declare const markMessagesReadSchema: z.ZodObject<{
    messageIds: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    messageIds: string[];
}, {
    messageIds: string[];
}>;
export declare const markChatReadSchema: z.ZodObject<{
    chatId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    chatId: string;
}, {
    chatId: string;
}>;
export declare const paginationSchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    offset: number;
}, {
    limit?: number | undefined;
    offset?: number | undefined;
}>;
export declare const cursorPaginationSchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodNumber>;
    cursor: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    cursor?: string | undefined;
}, {
    limit?: number | undefined;
    cursor?: string | undefined;
}>;
export declare const searchQuerySchema: z.ZodObject<{
    query: z.ZodString;
    chatId: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    query: string;
    chatId?: string | undefined;
}, {
    query: string;
    limit?: number | undefined;
    chatId?: string | undefined;
}>;
export declare const userSearchSchema: z.ZodObject<{
    query: z.ZodString;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    query: string;
}, {
    query: string;
    limit?: number | undefined;
}>;
export declare const typingEventSchema: z.ZodObject<{
    chatId: z.ZodString;
    isTyping: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    chatId: string;
    isTyping: boolean;
}, {
    chatId: string;
    isTyping: boolean;
}>;
export declare const presenceEventSchema: z.ZodObject<{
    status: z.ZodEnum<["online", "offline", "away"]>;
}, "strip", z.ZodTypeAny, {
    status: "online" | "offline" | "away";
}, {
    status: "online" | "offline" | "away";
}>;
export declare const readReceiptEventSchema: z.ZodObject<{
    chatId: z.ZodString;
    messageId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    chatId: string;
    messageId: string;
}, {
    chatId: string;
    messageId: string;
}>;
export declare const chatQueryParamsSchema: z.ZodObject<{
    type: z.ZodOptional<z.ZodEnum<["direct", "group"]>>;
    includeDeleted: z.ZodOptional<z.ZodEffects<z.ZodString, boolean, string>>;
    limit: z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>;
    offset: z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    type?: "direct" | "group" | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
    includeDeleted?: boolean | undefined;
}, {
    type?: "direct" | "group" | undefined;
    limit?: string | undefined;
    offset?: string | undefined;
    includeDeleted?: string | undefined;
}>;
export declare const messageQueryParamsSchema: z.ZodObject<{
    chatId: z.ZodOptional<z.ZodString>;
    before: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
    after: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
    limit: z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>;
    offset: z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    limit?: number | undefined;
    chatId?: string | undefined;
    offset?: number | undefined;
    before?: string | Date | undefined;
    after?: string | Date | undefined;
}, {
    limit?: string | undefined;
    chatId?: string | undefined;
    offset?: string | undefined;
    before?: string | Date | undefined;
    after?: string | Date | undefined;
}>;
export declare const contactQueryParamsSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["pending", "accepted", "blocked"]>>;
    limit: z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>;
    offset: z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    status?: "pending" | "accepted" | "blocked" | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
}, {
    status?: "pending" | "accepted" | "blocked" | undefined;
    limit?: string | undefined;
    offset?: string | undefined;
}>;
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
export declare const callTypeSchema: z.ZodEnum<["audio", "video"]>;
export declare const callResponseSchema: z.ZodEnum<["accept", "reject"]>;
export declare const respondToCallSchema: z.ZodObject<{
    callId: z.ZodString;
    response: z.ZodEnum<["accept", "reject"]>;
    sdp: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    callId: string;
    response: "accept" | "reject";
    sdp?: any;
}, {
    callId: string;
    response: "accept" | "reject";
    sdp?: any;
}>;
export declare const endCallSchema: z.ZodObject<{
    callId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    callId: string;
}, {
    callId: string;
}>;
export declare const callSchema: z.ZodObject<{
    id: z.ZodString;
    callerId: z.ZodString;
    callerName: z.ZodString;
    recipientId: z.ZodString;
    recipientName: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<["audio", "video"]>;
    status: z.ZodEnum<["pending", "active", "ended", "rejected"]>;
    createdAt: z.ZodUnion<[z.ZodString, z.ZodDate]>;
    answeredAt: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
    endedAt: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
    sdp: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    type: "audio" | "video";
    status: "pending" | "active" | "ended" | "rejected";
    id: string;
    createdAt: string | Date;
    callerId: string;
    callerName: string;
    recipientId: string;
    sdp?: any;
    recipientName?: string | undefined;
    answeredAt?: string | Date | undefined;
    endedAt?: string | Date | undefined;
}, {
    type: "audio" | "video";
    status: "pending" | "active" | "ended" | "rejected";
    id: string;
    createdAt: string | Date;
    callerId: string;
    callerName: string;
    recipientId: string;
    sdp?: any;
    recipientName?: string | undefined;
    answeredAt?: string | Date | undefined;
    endedAt?: string | Date | undefined;
}>;
export type CallType = z.infer<typeof callTypeSchema>;
export type CallResponse = z.infer<typeof callResponseSchema>;
export type RespondToCall = z.infer<typeof respondToCallSchema>;
export type EndCall = z.infer<typeof endCallSchema>;
export type Call = z.infer<typeof callSchema>;
export declare function validateUsername(username: string): boolean;
export declare function validatePassword(password: string): boolean;
export declare function validateStrongPassword(password: string): boolean;
export declare function validateEmail(email: string): boolean;
export declare function validateUuid(uuid: string): boolean;
export declare function sanitizeString(input: string): string;
export declare function sanitizeMessageContent(content: string): string;
export interface ValidationResult<T> {
    success: boolean;
    data?: T;
    errors?: Array<{
        field: string;
        message: string;
    }>;
}
export declare function validate<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T>;
export declare function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T;
//# sourceMappingURL=validators.util.d.ts.map