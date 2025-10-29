import { redisClient } from '../config/redis';
import { MessageRepository } from '../repositories/message.repository';
import { SocketManager } from '../websocket/socket.manager';
import { logger } from '../utils/logger.util';

interface QueuedMessage {
  messageId: string;
  chatId: string;
  recipients: string[];
  attempts: number;
  createdAt: Date;
}

export class MessageDeliveryQueue {
  private readonly STREAM_KEY = 'message-delivery-stream';
  private readonly CONSUMER_GROUP = 'message-delivery-workers';
  private readonly CONSUMER_NAME = `worker-${process.pid}`;
  private isProcessing = false;

  constructor(
    private messageRepo: MessageRepository,
    private socketManager: SocketManager
  ) {}

  async initialize() {
    try {
      // Create consumer group if it doesn't exist
      await redisClient.xGroupCreate(this.STREAM_KEY, this.CONSUMER_GROUP, '0', { MKSTREAM: true });
    } catch (error: any) {
      if (!error.message.includes('BUSYGROUP')) {
        throw error;
      }
    }
    logger.info('Message delivery queue initialized');
  }

  async addMessage(data: { messageId: string; chatId: string; recipients: string[] }) {
    const message: QueuedMessage = {
      ...data,
      attempts: 0,
      createdAt: new Date(),
    };

    await redisClient.xAdd(this.STREAM_KEY, '*', { data: JSON.stringify(message) });

    logger.debug(`Message queued for delivery: ${data.messageId}`);
  }

  async startProcessing() {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    logger.info('Message delivery queue processing started');

    while (this.isProcessing) {
      try {
        await this.processMessages();
        await this.processPendingMessages();
        await this.sleep(1000); // Check every second
      } catch (error) {
        logger.error('Error in message delivery queue', error);
        await this.sleep(5000); // Wait longer on error
      }
    }
  }

  stopProcessing() {
    this.isProcessing = false;
    logger.info('Message delivery queue processing stopped');
  }

  private async processMessages() {
    const messages = await redisClient.xReadGroup(
      this.CONSUMER_GROUP,
      this.CONSUMER_NAME,
      [{ key: this.STREAM_KEY, id: '>' }],
      { COUNT: 10, BLOCK: 1000 }
    );

    if (!messages || messages.length === 0) {
      return;
    }

    for (const [_stream, messageList] of messages) {
      for (const { id, message } of messageList) {
        try {
          const data: QueuedMessage = JSON.parse(message.data);
          await this.deliverMessage(data);

          // Acknowledge message
          await redisClient.xAck(this.STREAM_KEY, this.CONSUMER_GROUP, id);
        } catch (error) {
          logger.error(`Failed to process message ${id}`, error);
        }
      }
    }
  }

  private async processPendingMessages() {
    // Process messages that weren't acknowledged (e.g., if worker crashed)
    const pending = await redisClient.xPending(this.STREAM_KEY, this.CONSUMER_GROUP, '-', '+', 10);

    if (!pending || pending.length === 0) {
      return;
    }

    for (const item of pending) {
      if (item.millisecondsSinceLastDelivery > 60000) {
        // 1 minute
        // Claim the message
        const claimed = await redisClient.xClaim(
          this.STREAM_KEY,
          this.CONSUMER_GROUP,
          this.CONSUMER_NAME,
          60000,
          [item.id]
        );

        for (const { id, message } of claimed) {
          try {
            const data: QueuedMessage = JSON.parse(message.data);
            data.attempts++;

            if (data.attempts > 5) {
              logger.error(`Message ${data.messageId} failed after 5 attempts`);
              await redisClient.xAck(this.STREAM_KEY, this.CONSUMER_GROUP, id);
              continue;
            }

            await this.deliverMessage(data);
            await redisClient.xAck(this.STREAM_KEY, this.CONSUMER_GROUP, id);
          } catch (error) {
            logger.error(`Failed to process pending message ${id}`, error);
          }
        }
      }
    }
  }

  private async deliverMessage(data: QueuedMessage) {
    const message = await this.messageRepo.findById(data.messageId);
    if (!message) {
      logger.warn(`Message not found: ${data.messageId}`);
      return;
    }

    for (const recipientId of data.recipients) {
      try {
        // Check delivery status
        const deliveryStatus = await this.messageRepo.getDeliveryStatus(
          data.messageId,
          recipientId
        );

        if (deliveryStatus?.status === 'delivered' || deliveryStatus?.status === 'read') {
          continue; // Already delivered
        }

        // Check if user is online
        const isOnline = await this.isUserOnline(recipientId);

        if (isOnline) {
          // Send via WebSocket
          this.socketManager.sendToUser(recipientId, 'message:new', message);

          // Mark as delivered
          await this.messageRepo.updateDeliveryStatus(data.messageId, recipientId, 'delivered');
        }
      } catch (error) {
        logger.error(`Failed to deliver message to user ${recipientId}`, error);
      }
    }
  }

  private async isUserOnline(userId: string): Promise<boolean> {
    // Check if user has active sessions
    const sessions = await redisClient.keys(`session:${userId}:*`);
    return sessions.length > 0;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
