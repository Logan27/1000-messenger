import { redisClient, REDIS_CONFIG } from '../config/redis';
import { MessageRepository } from '../repositories/message.repository';
import { SocketManager } from '../websocket/socket.manager';
import { logger } from '../utils/logger.util';
import { PERFORMANCE_TARGETS } from '../config/constants';

interface QueuedMessage {
  messageId: string;
  chatId: string;
  recipients: string[];
  attempts: number;
  createdAt: Date;
  queuedAt?: Date;
}

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

export class MessageDeliveryQueue {
  private readonly STREAM_KEY = REDIS_CONFIG.STREAMS.MESSAGE_DELIVERY;
  private readonly DEAD_LETTER_KEY = `${REDIS_CONFIG.STREAMS.MESSAGE_DELIVERY}:dead-letter`;
  private readonly CONSUMER_GROUP = 'message-delivery-workers';
  private readonly CONSUMER_NAME = `worker-${process.pid}-${Date.now()}`;
  private isProcessing = false;
  
  // Configuration with defaults
  private readonly config: Required<QueueConfig> = {
    maxRetries: 5,
    retryDelayMs: 60000, // 1 minute
    batchSize: 10,
    pollIntervalMs: 1000,
    errorRetryDelayMs: 5000,
  };
  
  // Metrics tracking
  private metrics: QueueMetrics = {
    processed: 0,
    failed: 0,
    retried: 0,
    deadLettered: 0,
    avgProcessingTimeMs: 0,
  };

  constructor(
    private messageRepo: MessageRepository,
    private socketManager: SocketManager,
    customConfig?: QueueConfig
  ) {
    if (customConfig) {
      this.config = { ...this.config, ...customConfig };
    }
    logger.info(`MessageDeliveryQueue initialized with consumer: ${this.CONSUMER_NAME}`);
  }

  /**
   * Initialize the message delivery queue
   * Creates consumer group and prepares Redis Streams
   */
  async initialize(): Promise<void> {
    try {
      // Create consumer group if it doesn't exist
      await redisClient.xGroupCreate(this.STREAM_KEY, this.CONSUMER_GROUP, '0', { 
        MKSTREAM: true 
      });
      logger.info('Consumer group created successfully');
    } catch (error: any) {
      if (!error.message?.includes('BUSYGROUP')) {
        logger.error('Failed to create consumer group', error);
        throw error;
      }
      logger.debug('Consumer group already exists');
    }
    
    // Log configuration
    logger.info('Message delivery queue initialized', {
      stream: this.STREAM_KEY,
      consumerGroup: this.CONSUMER_GROUP,
      consumerName: this.CONSUMER_NAME,
      config: this.config,
    });
  }

  /**
   * Add a message to the delivery queue
   * @param data Message data including messageId, chatId, and recipients
   */
  async addMessage(data: { 
    messageId: string; 
    chatId: string; 
    recipients: string[] 
  }): Promise<void> {
    try {
      const message: QueuedMessage = {
        ...data,
        attempts: 0,
        createdAt: new Date(),
        queuedAt: new Date(),
      };

      await redisClient.xAdd(this.STREAM_KEY, '*', { 
        data: JSON.stringify(message) 
      });

      logger.debug(`Message queued for delivery: ${data.messageId}`, {
        chatId: data.chatId,
        recipientCount: data.recipients.length,
      });
    } catch (error) {
      logger.error('Failed to add message to queue', { error, data });
      throw error;
    }
  }

  /**
   * Start processing messages from the queue
   * Continuously polls for new messages and processes them
   */
  async startProcessing(): Promise<void> {
    if (this.isProcessing) {
      logger.warn('Message processing already started');
      return;
    }

    this.isProcessing = true;
    logger.info('Message delivery queue processing started', {
      consumer: this.CONSUMER_NAME,
      batchSize: this.config.batchSize,
      pollInterval: this.config.pollIntervalMs,
    });

    while (this.isProcessing) {
      try {
        // Process new messages
        await this.processMessages();
        
        // Process pending/retry messages
        await this.processPendingMessages();
        
        // Log metrics periodically
        if (this.metrics.processed % 100 === 0 && this.metrics.processed > 0) {
          this.logMetrics();
        }
        
        // Wait before next poll
        await this.sleep(this.config.pollIntervalMs);
      } catch (error) {
        logger.error('Error in message delivery queue processing', error);
        this.metrics.failed++;
        
        // Wait longer on error to prevent error loops
        await this.sleep(this.config.errorRetryDelayMs);
      }
    }
    
    logger.info('Message delivery queue processing loop exited');
  }

  /**
   * Stop processing messages
   * Gracefully stops the processing loop
   */
  stopProcessing(): void {
    if (!this.isProcessing) {
      logger.warn('Message processing already stopped');
      return;
    }
    
    this.isProcessing = false;
    logger.info('Message delivery queue processing stopped', {
      finalMetrics: this.metrics,
    });
  }

  /**
   * Process new messages from the stream
   * Reads messages using consumer group and delivers them
   */
  private async processMessages(): Promise<void> {
    try {
      const messages = await redisClient.xReadGroup(
        this.CONSUMER_GROUP,
        this.CONSUMER_NAME,
        [{ key: this.STREAM_KEY, id: '>' }],
        { COUNT: this.config.batchSize, BLOCK: 1000 }
      );

      if (!messages || messages.length === 0) {
        return;
      }

      for (const streamEntry of messages) {
        if (!streamEntry || !streamEntry.messages) {
          continue;
        }
        
        for (const { id, message } of streamEntry.messages) {
          const startTime = Date.now();
          
          try {
            const data: QueuedMessage = JSON.parse(message['data'] as string);
            
            // Deliver message to recipients
            await this.deliverMessage(data);

            // Acknowledge successful processing
            await redisClient.xAck(this.STREAM_KEY, this.CONSUMER_GROUP, id);
            
            // Update metrics
            this.metrics.processed++;
            this.updateAvgProcessingTime(Date.now() - startTime);
            
            logger.debug(`Message processed successfully: ${id}`, {
              messageId: data.messageId,
              processingTime: Date.now() - startTime,
            });
          } catch (error) {
            logger.error(`Failed to process message ${id}`, error);
            this.metrics.failed++;
            
            // Don't ACK - message will be retried via pending processing
          }
        }
      }
    } catch (error) {
      logger.error('Error reading from stream', error);
      throw error;
    }
  }

  /**
   * Process pending (unacknowledged) messages
   * Handles retry logic for messages that failed or weren't acknowledged
   */
  private async processPendingMessages(): Promise<void> {
    try {
      // Get pending messages (unacknowledged) using xPendingRange
      const pending = await redisClient.xPendingRange(
        this.STREAM_KEY,
        this.CONSUMER_GROUP,
        '-',
        '+',
        this.config.batchSize
      );

      if (!pending || pending.length === 0) {
        return;
      }

      for (const item of pending) {
        // Only process if message has been pending for longer than retry delay
        if (item.millisecondsSinceLastDelivery < this.config.retryDelayMs) {
          continue;
        }

        try {
          // Claim the message for this consumer
          const claimed = await redisClient.xClaim(
            this.STREAM_KEY,
            this.CONSUMER_GROUP,
            this.CONSUMER_NAME,
            this.config.retryDelayMs,
            [item.id]
          );

          if (claimed && claimed.length > 0) {
            for (const claimedItem of claimed) {
              if (!claimedItem) continue;
              const { id, message } = claimedItem;
              try {
                const data: QueuedMessage = JSON.parse(message['data'] as string);
                data.attempts++;

                // Check if max retries exceeded
                if (data.attempts > this.config.maxRetries) {
                  logger.error(`Message ${data.messageId} failed after ${this.config.maxRetries} attempts`, {
                    messageId: data.messageId,
                    chatId: data.chatId,
                    attempts: data.attempts,
                  });
                 
                  // Move to dead letter queue
                  await this.moveToDeadLetter(data, id);
                 
                  // Acknowledge to remove from pending
                  await redisClient.xAck(this.STREAM_KEY, this.CONSUMER_GROUP, id);
                  this.metrics.deadLettered++;
                  continue;
                }

                // Retry delivery
                logger.info(`Retrying message delivery (attempt ${data.attempts}/${this.config.maxRetries})`, {
                  messageId: data.messageId,
                  chatId: data.chatId,
                });
                
                await this.deliverMessage(data);
                await redisClient.xAck(this.STREAM_KEY, this.CONSUMER_GROUP, id);
                this.metrics.retried++;
                
              } catch (error) {
                logger.error(`Failed to process pending message ${id}`, error);
                // Don't ACK - will retry again
              }
            }
          }
        } catch (error) {
          logger.error(`Failed to claim pending message ${item.id}`, error);
        }
      }
    } catch (error) {
      logger.error('Error processing pending messages', error);
    }
  }

  /**
   * Deliver a message to all recipients
   * Checks online status and updates delivery status
   */
  private async deliverMessage(data: QueuedMessage): Promise<void> {
    const startTime = Date.now();
    
    // Fetch message from database
    const message = await this.messageRepo.findById(data.messageId);
    if (!message) {
      logger.warn(`Message not found: ${data.messageId}`, {
        chatId: data.chatId,
        attempts: data.attempts,
      });
      // Message deleted or doesn't exist - consider it delivered
      return;
    }

    let deliveredCount = 0;
    let skippedCount = 0;
    let offlineCount = 0;

    // Attempt delivery to each recipient
    for (const recipientId of data.recipients) {
      try {
        // Check delivery status
        const deliveryStatus = await this.messageRepo.getDeliveryStatus(
          data.messageId,
          recipientId
        );

        // Skip if already delivered or read
        if (deliveryStatus?.status === 'delivered' || deliveryStatus?.status === 'read') {
          skippedCount++;
          logger.debug(`Message already delivered to user ${recipientId}`, {
            messageId: data.messageId,
            status: deliveryStatus.status,
          });
          continue;
        }

        // Check if user is online
        const isOnline = await this.socketManager.isUserOnline(recipientId);

        if (isOnline) {
          // Send via WebSocket
          this.socketManager.sendToUser(recipientId, 'message.new', message);

          // Mark as delivered
          await this.messageRepo.updateDeliveryStatus(
            data.messageId, 
            recipientId, 
            'delivered'
          );
          
          deliveredCount++;
          
          logger.debug(`Message delivered to online user ${recipientId}`, {
            messageId: data.messageId,
            deliveryTime: Date.now() - startTime,
          });
        } else {
          offlineCount++;
          logger.debug(`User ${recipientId} is offline, will retry`, {
            messageId: data.messageId,
          });
        }
      } catch (error) {
        logger.error(`Failed to deliver message to user ${recipientId}`, {
          error,
          messageId: data.messageId,
          chatId: data.chatId,
        });
        // Continue with other recipients
      }
    }

    const totalTime = Date.now() - startTime;
    
    // Log delivery summary
    logger.info(`Message delivery completed`, {
      messageId: data.messageId,
      chatId: data.chatId,
      totalRecipients: data.recipients.length,
      delivered: deliveredCount,
      skipped: skippedCount,
      offline: offlineCount,
      attempts: data.attempts,
      processingTime: totalTime,
    });

    // Warn if delivery time exceeds performance target
    if (totalTime > PERFORMANCE_TARGETS.MESSAGE_DELIVERY_MS) {
      logger.warn(`Message delivery exceeded target time`, {
        messageId: data.messageId,
        actualTime: totalTime,
        targetTime: PERFORMANCE_TARGETS.MESSAGE_DELIVERY_MS,
      });
    }
  }

  /**
   * Move a failed message to the dead letter queue
   * @param data The message data
   * @param streamId The original stream ID
   */
  private async moveToDeadLetter(data: QueuedMessage, streamId: string): Promise<void> {
    try {
      const deadLetterData = {
        ...data,
        failedAt: new Date().toISOString(),
        originalStreamId: streamId,
        reason: 'max_retries_exceeded',
      };

      await redisClient.xAdd(this.DEAD_LETTER_KEY, '*', {
        data: JSON.stringify(deadLetterData),
      });

      logger.warn(`Message moved to dead letter queue`, {
        messageId: data.messageId,
        attempts: data.attempts,
        streamId,
      });
    } catch (error) {
      logger.error('Failed to move message to dead letter queue', {
        error,
        messageId: data.messageId,
      });
    }
  }

  /**
   * Update average processing time metric
   * @param processingTime Time taken to process message in ms
   */
  private updateAvgProcessingTime(processingTime: number): void {
    const totalProcessed = this.metrics.processed;
    
    if (totalProcessed === 1) {
      this.metrics.avgProcessingTimeMs = processingTime;
    } else {
      // Calculate running average
      this.metrics.avgProcessingTimeMs = 
        (this.metrics.avgProcessingTimeMs * (totalProcessed - 1) + processingTime) / totalProcessed;
    }
  }

  /**
   * Log current metrics
   */
  private logMetrics(): void {
    logger.info('Message delivery queue metrics', {
      consumer: this.CONSUMER_NAME,
      processed: this.metrics.processed,
      failed: this.metrics.failed,
      retried: this.metrics.retried,
      deadLettered: this.metrics.deadLettered,
      avgProcessingTimeMs: Math.round(this.metrics.avgProcessingTimeMs),
      targetMs: PERFORMANCE_TARGETS.MESSAGE_DELIVERY_MS,
    });
  }

  /**
   * Get current queue metrics
   * @returns Current metrics object
   */
  public getMetrics(): Readonly<QueueMetrics> {
    return { ...this.metrics };
  }

  /**
   * Get queue health status
   * @returns Health status information
   */
  public async getHealthStatus(): Promise<{
    healthy: boolean;
    isProcessing: boolean;
    consumerName: string;
    pendingCount: number;
    streamLength: number;
    metrics: QueueMetrics;
  }> {
    try {
      // Get stream info
      const streamInfo = await redisClient.xLen(this.STREAM_KEY);
      
      // Get pending count summary
      const pendingInfo = await redisClient.xPending(
        this.STREAM_KEY,
        this.CONSUMER_GROUP
      );
      
      const pendingCount = pendingInfo ? pendingInfo.pending : 0;

      // Consider unhealthy if too many pending or high failure rate
      const failureRate = this.metrics.processed > 0 
        ? this.metrics.failed / this.metrics.processed 
        : 0;
      
      const healthy = 
        this.isProcessing && 
        pendingCount < 1000 && // Less than 1000 pending messages
        failureRate < 0.1; // Less than 10% failure rate

      return {
        healthy,
        isProcessing: this.isProcessing,
        consumerName: this.CONSUMER_NAME,
        pendingCount,
        streamLength: streamInfo,
        metrics: this.metrics,
      };
    } catch (error) {
      logger.error('Error getting queue health status', error);
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

  /**
   * Reset metrics counters
   */
  public resetMetrics(): void {
    this.metrics = {
      processed: 0,
      failed: 0,
      retried: 0,
      deadLettered: 0,
      avgProcessingTimeMs: 0,
    };
    logger.info('Queue metrics reset');
  }

  /**
   * Sleep utility for async delays
   * @param ms Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}