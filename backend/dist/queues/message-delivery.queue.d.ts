import { MessageRepository } from '../repositories/message.repository';
import { SocketManager } from '../websocket/socket.manager';
interface QueueConfig {
    maxRetries?: number;
    retryDelayMs?: number;
    batchSize?: number;
    pollIntervalMs?: number;
    errorRetryDelayMs?: number;
}
interface QueueMetrics {
    processed: number;
    failed: number;
    retried: number;
    deadLettered: number;
    avgProcessingTimeMs: number;
}
export declare class MessageDeliveryQueue {
    private messageRepo;
    private socketManager;
    private readonly STREAM_KEY;
    private readonly DEAD_LETTER_KEY;
    private readonly CONSUMER_GROUP;
    private readonly CONSUMER_NAME;
    private isProcessing;
    private readonly config;
    private metrics;
    constructor(messageRepo: MessageRepository, socketManager: SocketManager, customConfig?: QueueConfig);
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
    private moveToDeadLetter;
    private updateAvgProcessingTime;
    private logMetrics;
    getMetrics(): Readonly<QueueMetrics>;
    getHealthStatus(): Promise<{
        healthy: boolean;
        isProcessing: boolean;
        consumerName: string;
        pendingCount: number;
        streamLength: number;
        metrics: QueueMetrics;
    }>;
    resetMetrics(): void;
    private sleep;
}
export {};
//# sourceMappingURL=message-delivery.queue.d.ts.map