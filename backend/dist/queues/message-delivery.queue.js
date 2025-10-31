"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageDeliveryQueue = void 0;
const redis_1 = require("../config/redis");
const logger_util_1 = require("../utils/logger.util");
const constants_1 = require("../config/constants");
class MessageDeliveryQueue {
    messageRepo;
    socketManager;
    STREAM_KEY = redis_1.REDIS_CONFIG.STREAMS.MESSAGE_DELIVERY;
    DEAD_LETTER_KEY = `${redis_1.REDIS_CONFIG.STREAMS.MESSAGE_DELIVERY}:dead-letter`;
    CONSUMER_GROUP = 'message-delivery-workers';
    CONSUMER_NAME = `worker-${process.pid}-${Date.now()}`;
    isProcessing = false;
    config = {
        maxRetries: 5,
        retryDelayMs: 60000,
        batchSize: 10,
        pollIntervalMs: 1000,
        errorRetryDelayMs: 5000,
    };
    metrics = {
        processed: 0,
        failed: 0,
        retried: 0,
        deadLettered: 0,
        avgProcessingTimeMs: 0,
    };
    constructor(messageRepo, socketManager, customConfig) {
        this.messageRepo = messageRepo;
        this.socketManager = socketManager;
        if (customConfig) {
            this.config = { ...this.config, ...customConfig };
        }
        logger_util_1.logger.info(`MessageDeliveryQueue initialized with consumer: ${this.CONSUMER_NAME}`);
    }
    async initialize() {
        try {
            await redis_1.redisClient.xGroupCreate(this.STREAM_KEY, this.CONSUMER_GROUP, '0', {
                MKSTREAM: true
            });
            logger_util_1.logger.info('Consumer group created successfully');
        }
        catch (error) {
            if (!error.message?.includes('BUSYGROUP')) {
                logger_util_1.logger.error('Failed to create consumer group', error);
                throw error;
            }
            logger_util_1.logger.debug('Consumer group already exists');
        }
        logger_util_1.logger.info('Message delivery queue initialized', {
            stream: this.STREAM_KEY,
            consumerGroup: this.CONSUMER_GROUP,
            consumerName: this.CONSUMER_NAME,
            config: this.config,
        });
    }
    async addMessage(data) {
        try {
            const message = {
                ...data,
                attempts: 0,
                createdAt: new Date(),
                queuedAt: new Date(),
            };
            await redis_1.redisClient.xAdd(this.STREAM_KEY, '*', {
                data: JSON.stringify(message)
            });
            logger_util_1.logger.debug(`Message queued for delivery: ${data.messageId}`, {
                chatId: data.chatId,
                recipientCount: data.recipients.length,
            });
        }
        catch (error) {
            logger_util_1.logger.error('Failed to add message to queue', { error, data });
            throw error;
        }
    }
    async startProcessing() {
        if (this.isProcessing) {
            logger_util_1.logger.warn('Message processing already started');
            return;
        }
        this.isProcessing = true;
        logger_util_1.logger.info('Message delivery queue processing started', {
            consumer: this.CONSUMER_NAME,
            batchSize: this.config.batchSize,
            pollInterval: this.config.pollIntervalMs,
        });
        while (this.isProcessing) {
            try {
                await this.processMessages();
                await this.processPendingMessages();
                if (this.metrics.processed % 100 === 0 && this.metrics.processed > 0) {
                    this.logMetrics();
                }
                await this.sleep(this.config.pollIntervalMs);
            }
            catch (error) {
                logger_util_1.logger.error('Error in message delivery queue processing', error);
                this.metrics.failed++;
                await this.sleep(this.config.errorRetryDelayMs);
            }
        }
        logger_util_1.logger.info('Message delivery queue processing loop exited');
    }
    stopProcessing() {
        if (!this.isProcessing) {
            logger_util_1.logger.warn('Message processing already stopped');
            return;
        }
        this.isProcessing = false;
        logger_util_1.logger.info('Message delivery queue processing stopped', {
            finalMetrics: this.metrics,
        });
    }
    async processMessages() {
        try {
            const messages = await redis_1.redisClient.xReadGroup(this.CONSUMER_GROUP, this.CONSUMER_NAME, [{ key: this.STREAM_KEY, id: '>' }], { COUNT: this.config.batchSize, BLOCK: 1000 });
            if (!messages || messages.length === 0) {
                return;
            }
            for (const [_stream, messageList] of messages) {
                for (const { id, message } of messageList) {
                    const startTime = Date.now();
                    try {
                        const data = JSON.parse(message.data);
                        await this.deliverMessage(data);
                        await redis_1.redisClient.xAck(this.STREAM_KEY, this.CONSUMER_GROUP, id);
                        this.metrics.processed++;
                        this.updateAvgProcessingTime(Date.now() - startTime);
                        logger_util_1.logger.debug(`Message processed successfully: ${id}`, {
                            messageId: data.messageId,
                            processingTime: Date.now() - startTime,
                        });
                    }
                    catch (error) {
                        logger_util_1.logger.error(`Failed to process message ${id}`, error);
                        this.metrics.failed++;
                    }
                }
            }
        }
        catch (error) {
            logger_util_1.logger.error('Error reading from stream', error);
            throw error;
        }
    }
    async processPendingMessages() {
        try {
            const pending = await redis_1.redisClient.xPending(this.STREAM_KEY, this.CONSUMER_GROUP, '-', '+', this.config.batchSize);
            if (!pending || pending.length === 0) {
                return;
            }
            for (const item of pending) {
                if (item.millisecondsSinceLastDelivery < this.config.retryDelayMs) {
                    continue;
                }
                try {
                    const claimed = await redis_1.redisClient.xClaim(this.STREAM_KEY, this.CONSUMER_GROUP, this.CONSUMER_NAME, this.config.retryDelayMs, [item.id]);
                    for (const { id, message } of claimed) {
                        try {
                            const data = JSON.parse(message.data);
                            data.attempts++;
                            if (data.attempts > this.config.maxRetries) {
                                logger_util_1.logger.error(`Message ${data.messageId} failed after ${this.config.maxRetries} attempts`, {
                                    messageId: data.messageId,
                                    chatId: data.chatId,
                                    attempts: data.attempts,
                                });
                                await this.moveToDeadLetter(data, id);
                                await redis_1.redisClient.xAck(this.STREAM_KEY, this.CONSUMER_GROUP, id);
                                this.metrics.deadLettered++;
                                continue;
                            }
                            logger_util_1.logger.info(`Retrying message delivery (attempt ${data.attempts}/${this.config.maxRetries})`, {
                                messageId: data.messageId,
                                chatId: data.chatId,
                            });
                            await this.deliverMessage(data);
                            await redis_1.redisClient.xAck(this.STREAM_KEY, this.CONSUMER_GROUP, id);
                            this.metrics.retried++;
                        }
                        catch (error) {
                            logger_util_1.logger.error(`Failed to process pending message ${id}`, error);
                        }
                    }
                }
                catch (error) {
                    logger_util_1.logger.error(`Failed to claim pending message ${item.id}`, error);
                }
            }
        }
        catch (error) {
            logger_util_1.logger.error('Error processing pending messages', error);
        }
    }
    async deliverMessage(data) {
        const startTime = Date.now();
        const message = await this.messageRepo.findById(data.messageId);
        if (!message) {
            logger_util_1.logger.warn(`Message not found: ${data.messageId}`, {
                chatId: data.chatId,
                attempts: data.attempts,
            });
            return;
        }
        let deliveredCount = 0;
        let skippedCount = 0;
        let offlineCount = 0;
        for (const recipientId of data.recipients) {
            try {
                const deliveryStatus = await this.messageRepo.getDeliveryStatus(data.messageId, recipientId);
                if (deliveryStatus?.status === 'delivered' || deliveryStatus?.status === 'read') {
                    skippedCount++;
                    logger_util_1.logger.debug(`Message already delivered to user ${recipientId}`, {
                        messageId: data.messageId,
                        status: deliveryStatus.status,
                    });
                    continue;
                }
                const isOnline = await this.socketManager.isUserOnline(recipientId);
                if (isOnline) {
                    this.socketManager.sendToUser(recipientId, 'message.new', message);
                    await this.messageRepo.updateDeliveryStatus(data.messageId, recipientId, 'delivered');
                    deliveredCount++;
                    logger_util_1.logger.debug(`Message delivered to online user ${recipientId}`, {
                        messageId: data.messageId,
                        deliveryTime: Date.now() - startTime,
                    });
                }
                else {
                    offlineCount++;
                    logger_util_1.logger.debug(`User ${recipientId} is offline, will retry`, {
                        messageId: data.messageId,
                    });
                }
            }
            catch (error) {
                logger_util_1.logger.error(`Failed to deliver message to user ${recipientId}`, {
                    error,
                    messageId: data.messageId,
                    chatId: data.chatId,
                });
            }
        }
        const totalTime = Date.now() - startTime;
        logger_util_1.logger.info(`Message delivery completed`, {
            messageId: data.messageId,
            chatId: data.chatId,
            totalRecipients: data.recipients.length,
            delivered: deliveredCount,
            skipped: skippedCount,
            offline: offlineCount,
            attempts: data.attempts,
            processingTime: totalTime,
        });
        if (totalTime > constants_1.PERFORMANCE_TARGETS.MESSAGE_DELIVERY_MS) {
            logger_util_1.logger.warn(`Message delivery exceeded target time`, {
                messageId: data.messageId,
                actualTime: totalTime,
                targetTime: constants_1.PERFORMANCE_TARGETS.MESSAGE_DELIVERY_MS,
            });
        }
    }
    async moveToDeadLetter(data, streamId) {
        try {
            const deadLetterData = {
                ...data,
                failedAt: new Date().toISOString(),
                originalStreamId: streamId,
                reason: 'max_retries_exceeded',
            };
            await redis_1.redisClient.xAdd(this.DEAD_LETTER_KEY, '*', {
                data: JSON.stringify(deadLetterData),
            });
            logger_util_1.logger.warn(`Message moved to dead letter queue`, {
                messageId: data.messageId,
                attempts: data.attempts,
                streamId,
            });
        }
        catch (error) {
            logger_util_1.logger.error('Failed to move message to dead letter queue', {
                error,
                messageId: data.messageId,
            });
        }
    }
    updateAvgProcessingTime(processingTime) {
        const totalProcessed = this.metrics.processed;
        if (totalProcessed === 1) {
            this.metrics.avgProcessingTimeMs = processingTime;
        }
        else {
            this.metrics.avgProcessingTimeMs =
                (this.metrics.avgProcessingTimeMs * (totalProcessed - 1) + processingTime) / totalProcessed;
        }
    }
    logMetrics() {
        logger_util_1.logger.info('Message delivery queue metrics', {
            consumer: this.CONSUMER_NAME,
            processed: this.metrics.processed,
            failed: this.metrics.failed,
            retried: this.metrics.retried,
            deadLettered: this.metrics.deadLettered,
            avgProcessingTimeMs: Math.round(this.metrics.avgProcessingTimeMs),
            targetMs: constants_1.PERFORMANCE_TARGETS.MESSAGE_DELIVERY_MS,
        });
    }
    getMetrics() {
        return { ...this.metrics };
    }
    async getHealthStatus() {
        try {
            const streamInfo = await redis_1.redisClient.xLen(this.STREAM_KEY);
            const pendingInfo = await redis_1.redisClient.xPending(this.STREAM_KEY, this.CONSUMER_GROUP, '-', '+', 1);
            const pendingCount = pendingInfo ? pendingInfo.length : 0;
            const failureRate = this.metrics.processed > 0
                ? this.metrics.failed / this.metrics.processed
                : 0;
            const healthy = this.isProcessing &&
                pendingCount < 1000 &&
                failureRate < 0.1;
            return {
                healthy,
                isProcessing: this.isProcessing,
                consumerName: this.CONSUMER_NAME,
                pendingCount,
                streamLength: streamInfo,
                metrics: this.metrics,
            };
        }
        catch (error) {
            logger_util_1.logger.error('Error getting queue health status', error);
            return {
                healthy: false,
                isProcessing: this.isProcessing,
                consumerName: this.CONSUMER_NAME,
                pendingCount: -1,
                streamLength: -1,
                metrics: this.metrics,
            };
        }
    }
    resetMetrics() {
        this.metrics = {
            processed: 0,
            failed: 0,
            retried: 0,
            deadLettered: 0,
            avgProcessingTimeMs: 0,
        };
        logger_util_1.logger.info('Queue metrics reset');
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.MessageDeliveryQueue = MessageDeliveryQueue;
//# sourceMappingURL=message-delivery.queue.js.map