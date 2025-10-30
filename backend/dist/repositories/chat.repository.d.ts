import { CHAT_TYPE } from '../config/constants';
export interface Chat {
    id: string;
    type: (typeof CHAT_TYPE)[keyof typeof CHAT_TYPE];
    name?: string;
    slug?: string;
    avatarUrl?: string;
    ownerId?: string;
    createdAt: Date;
    updatedAt: Date;
    lastMessageAt?: Date;
    isDeleted: boolean;
}
export declare class ChatRepository {
    create(data: Partial<Chat>): Promise<Chat>;
    findById(id: string): Promise<Chat | null>;
    findBySlug(slug: string): Promise<Chat | null>;
    findDirectChat(user1Id: string, user2Id: string): Promise<Chat | null>;
    getUserChats(userId: string): Promise<any[]>;
    findSharedChats(user1Id: string, user2Id: string): Promise<string[]>;
    addParticipant(chatId: string, userId: string, role?: string): Promise<void>;
    removeParticipant(chatId: string, userId: string): Promise<void>;
    getActiveParticipantIds(chatId: string): Promise<string[]>;
    countActiveParticipants(chatId: string): Promise<number>;
    isUserParticipant(chatId: string, userId: string): Promise<boolean>;
    updateLastMessageAt(chatId: string): Promise<void>;
    incrementUnreadCounts(chatId: string, userIds: string[]): Promise<void>;
    resetUnreadCount(chatId: string, userId: string): Promise<void>;
    update(chatId: string, data: Partial<Chat>): Promise<Chat>;
    delete(chatId: string): Promise<void>;
    private mapRow;
}
//# sourceMappingURL=chat.repository.d.ts.map