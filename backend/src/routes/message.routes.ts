import { Router } from 'express';
import { MessageController } from '../controllers/message.controller';
import { MessageService } from '../services/message.service';
import { MessageRepository } from '../repositories/message.repository';
import { ChatRepository } from '../repositories/chat.repository';
import { authMiddleware } from '../middleware/auth.middleware';
import { MessageDeliveryQueue } from '../queues/message-delivery.queue';
import { SocketManager } from '../websocket/socket.manager';
import { validate, messageSchema } from '../middleware/validation.middleware';
import { messageRateLimit } from '../middleware/rate-limit.middleware';

const router = Router();

// Initialize services
const chatRepo = new ChatRepository();
const messageRepo = new MessageRepository();

// Note: These would be injected in a real app
const messageDeliveryQueue = {} as MessageDeliveryQueue;
const socketManager = {} as SocketManager;

const messageService = new MessageService(
  messageRepo,
  chatRepo,
  messageDeliveryQueue,
  socketManager
);
const messageController = new MessageController(messageService);

// All routes require authentication
router.use(authMiddleware.authenticate);

// Message routes
router.post('/:chatId', messageRateLimit, validate(messageSchema), messageController.sendMessage);

router.get('/:chatId', messageController.getMessages);
router.put('/:messageId', messageController.editMessage);
router.delete('/:messageId', messageController.deleteMessage);
router.post('/:messageId/read', messageController.markAsRead);
router.post('/:messageId/reactions', messageController.addReaction);
router.delete('/reactions/:reactionId', messageController.removeReaction);

export { router as messageRoutes };
