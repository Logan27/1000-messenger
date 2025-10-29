import { MessageRepository } from '../repositories/message.repository';
import { SocketManager } from '../websocket/socket.manager';
export declare class MessageDeliveryQueue {
    private messageRepo;
    private socketManager;
    private readonly STREAM_KEY;
    private readonly CONSUMER_GROUP;
    private readonly CONSUMER_NAME;
    private isProcessing;
    constructor(messageRepo: MessageRepository, socketManager: SocketManager);
    initialize(): Promise<void>;
    addMessage(data: {
        messageId: string;
        chatId: string;
        recipients: string[];
    }): Promise<void>;
    startProcessing(): Promise<void>;
    stopProcessing(): void;
    private processMessages;
    private processPendingMessages;
    private deliverMessage;
    private isUserOnline;
    private sleep;
}
//# sourceMappingURL=message-delivery.queue.d.ts.map