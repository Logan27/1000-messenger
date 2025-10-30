import { MessageRepository } from '../repositories/message.repository';
import { ChatRepository } from '../repositories/chat.repository';
import { MessageDeliveryQueue } from '../queues/message-delivery.queue';
import { SocketManager } from '../websocket/socket.manager';
export interface SendMessageDto {
    chatId: string;
    senderId: string;
    content: string;
    contentType?: 'text' | 'image' | 'system';
    metadata?: Record<string, any>;
    replyToId?: string;
}
export declare class MessageService {
    private messageRepo;
    private chatRepo;
    private deliveryQueue;
    private socketManager;
    constructor(messageRepo: MessageRepository, chatRepo: ChatRepository, deliveryQueue: MessageDeliveryQueue, socketManager: SocketManager);
    sendMessage(dto: SendMessageDto): Promise<import("../repositories/message.repository").Message>;
    editMessage(messageId: string, userId: string, newContent: string): Promise<import("../repositories/message.repository").Message>;
    deleteMessage(messageId: string, userId: string): Promise<void>;
    getMessages(chatId: string, userId: string, limit?: number, cursor?: string): Promise<{
        data: import("../repositories/message.repository").Message[];
        nextCursor: string | null;
        hasMore: boolean;
    }>;
    markAsRead(messageId: string, userId: string): Promise<void>;
    addReaction(messageId: string, userId: string, emoji: string): Promise<any>;
    removeReaction(reactionId: string, userId: string): Promise<void>;
    private getUserInfo;
}
//# sourceMappingURL=message.service.d.ts.map