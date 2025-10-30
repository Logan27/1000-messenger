export interface Message {
    id: string;
    chatId: string;
    senderId: string;
    content: string;
    contentType: 'text' | 'image' | 'system';
    metadata: Record<string, any>;
    replyToId?: string;
    isEdited: boolean;
    editedAt?: Date;
    isDeleted: boolean;
    deletedAt?: Date;
    createdAt: Date;
}
export declare class MessageRepository {
    create(data: Partial<Message>): Promise<Message>;
    findById(id: string): Promise<Message | null>;
    update(id: string, data: Partial<Message>): Promise<Message>;
    getMessagesByChatId(chatId: string, limit?: number, cursor?: string): Promise<Message[]>;
    createDeliveryRecords(messageId: string, userIds: string[]): Promise<void>;
    updateDeliveryStatus(messageId: string, userId: string, status: 'sent' | 'delivered' | 'read'): Promise<void>;
    getDeliveryStatus(messageId: string, userId: string): Promise<any>;
    getUndeliveredMessages(userId: string): Promise<Message[]>;
    saveEditHistory(data: {
        messageId: string;
        oldContent: string;
        oldMetadata: any;
    }): Promise<void>;
    addReaction(messageId: string, userId: string, emoji: string): Promise<any>;
    findReactionById(id: string): Promise<any>;
    deleteReaction(id: string): Promise<void>;
    getReactionsByMessageId(messageId: string): Promise<any[]>;
    searchMessages(userId: string, searchQuery: string, chatId?: string): Promise<Message[]>;
    private mapRow;
}
//# sourceMappingURL=message.repository.d.ts.map