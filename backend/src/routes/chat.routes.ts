import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';
import { ChatService } from '../services/chat.service';
import { ChatRepository } from '../repositories/chat.repository';
import { UserRepository } from '../repositories/user.repository';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate, chatSchema } from '../middleware/validation.middleware';
import { messageRateLimit } from '../middleware/rate-limit.middleware';

const router = Router();

// Initialize services
const userRepo = new UserRepository();
const chatRepo = new ChatRepository();
const chatService = new ChatService(chatRepo, userRepo);
const chatController = new ChatController(chatService);

// All routes require authentication
router.use(authMiddleware.authenticate);

// Chat routes
router.get('/', chatController.getUserChats);
router.get('/:chatId', chatController.getChatById);
router.get('/slug/:slug', chatController.getChatBySlug);

router.post('/direct', chatController.createDirectChat);
router.post('/group', messageRateLimit, validate(chatSchema), chatController.createGroupChat);

router.put('/:chatId', chatController.updateChat);
router.post('/:chatId/participants', chatController.addParticipants);
router.delete('/:chatId/participants/:userId', chatController.removeParticipant);
router.post('/:chatId/leave', chatController.leaveChat);
router.delete('/:chatId', chatController.deleteChat);

export { router as chatRoutes };
