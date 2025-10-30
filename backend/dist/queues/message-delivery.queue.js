"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageDeliveryQueue = void 0;
const redis_1 = require("../config/redis");
const logger_util_1 = require("../utils/logger.util");
class MessageDeliveryQueue {
    messageRepo;
    socketManager;
    STREAM_KEY = 'message-delivery-stream';
    CONSUMER_GROUP = 'message-delivery-workers';
    CONSUMER_NAME = `worker-${process.pid}`;
    isProcessing = false;
    constructor(messageRepo, socketManager) {
        this.messageRepo = messageRepo;
        this.socketManager = socketManager;
    }
    async initialize() {
        try {
            await redis_1.redisClient.xGroupCreate(this.STREAM_KEY, this.CONSUMER_GROUP, '0', { MKSTREAM: true });
        }
        catch (error) {
            if (!error.message.includes('BUSYGROUP')) {
                throw error;
            }
        }
        logger_util_1.logger.info('Message delivery queue initialized');
    }
    async addMessage(data) {
        const message = {
            ...data,
            attempts: 0,
            createdAt: new Date(),
        };
        await redis_1.redisClient.xAdd(this.STREAM_KEY, '*', { data: JSON.stringify(message) });
        logger_util_1.logger.debug(`Message queued for delivery: ${data.messageId}`);
    }
    async startProcessing() {
        if (this.isProcessing) {
            return;
        }
        this.isProcessing = true;
        logger_util_1.logger.info('Message delivery queue processing started');
        while (this.isProcessing) {
            try {
                await this.processMessages();
                await this.processPendingMessages();
                await this.sleep(1000);
            }
            catch (error) {
                logger_util_1.logger.error('Error in message delivery queue', error);
                await this.sleep(5000);
            }
        }
    }
    stopProcessing() {
        this.isProcessing = false;
        logger_util_1.logger.info('Message delivery queue processing stopped');
    }
    async processMessages() {
        const messages = await redis_1.redisClient.xReadGroup(this.CONSUMER_GROUP, this.CONSUMER_NAME, [{ key: this.STREAM_KEY, id: '>' }], { COUNT: 10, BLOCK: 1000 });
        if (!messages || messages.length === 0) {
            return;
        }
        for (const [_stream, messageList] of messages) {
            for (const { id, message } of messageList) {
                try {
                    const data = JSON.parse(message.data);
                    await this.deliverMessage(data);
                    await redis_1.redisClient.xAck(this.STREAM_KEY, this.CONSUMER_GROUP, id);
                }
                catch (error) {
                    logger_util_1.logger.error(`Failed to process message ${id}`, error);
                }
            }
        }
    }
    async processPendingMessages() {
        const pending = await redis_1.redisClient.xPending(this.STREAM_KEY, this.CONSUMER_GROUP, '-', '+', 10);
        if (!pending || pending.length === 0) {
            return;
        }
        for (const item of pending) {
            if (item.millisecondsSinceLastDelivery > 60000) {
                const claimed = await redis_1.redisClient.xClaim(this.STREAM_KEY, this.CONSUMER_GROUP, this.CONSUMER_NAME, 60000, [item.id]);
                for (const { id, message } of claimed) {
                    try {
                        const data = JSON.parse(message.data);
                        data.attempts++;
                        if (data.attempts > 5) {
                            logger_util_1.logger.error(`Message ${data.messageId} failed after 5 attempts`);
                            await redis_1.redisClient.xAck(this.STREAM_KEY, this.CONSUMER_GROUP, id);
                            continue;
                        }
                        await this.deliverMessage(data);
                        await redis_1.redisClient.xAck(this.STREAM_KEY, this.CONSUMER_GROUP, id);
                    }
                    catch (error) {
                        logger_util_1.logger.error(`Failed to process pending message ${id}`, error);
                    }
                }
            }
        }
    }
    async deliverMessage(data) {
        const message = await this.messageRepo.findById(data.messageId);
        if (!message) {
            logger_util_1.logger.warn(`Message not found: ${data.messageId}`);
            return;
        }
        for (const recipientId of data.recipients) {
            try {
                const deliveryStatus = await this.messageRepo.getDeliveryStatus(data.messageId, recipientId);
                if (deliveryStatus?.status === 'delivered' || deliveryStatus?.status === 'read') {
                    continue;
                }
                const isOnline = await this.isUserOnline(recipientId);
                if (isOnline) {
                    this.socketManager.sendToUser(recipientId, 'message:new', message);
                    await this.messageRepo.updateDeliveryStatus(data.messageId, recipientId, 'delivered');
                }
            }
            catch (error) {
                logger_util_1.logger.error(`Failed to deliver message to user ${recipientId}`, error);
            }
        }
    }
    async isUserOnline(userId) {
        const sessions = await redis_1.redisClient.keys(`session:${userId}:*`);
        return sessions.length > 0;
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.MessageDeliveryQueue = MessageDeliveryQueue;
//# sourceMappingURL=message-delivery.queue.js.map