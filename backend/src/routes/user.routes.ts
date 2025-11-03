import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { UserService } from '../services/user.service';
import { UserRepository } from '../repositories/user.repository';
import { ContactRepository } from '../repositories/contact.repository';
import { ChatRepository } from '../repositories/chat.repository';
import { authMiddleware } from '../middleware/auth.middleware';
import { searchRateLimit } from '../middleware/rate-limit.middleware';
import { validateBody, validateParams, createUuidParamsSchema } from '../middleware/validation.middleware';
import { userUpdateSchema } from '../utils/validators.util';

const router = Router();

// Initialize repositories
const userRepo = new UserRepository();
const contactRepo = new ContactRepository();
const chatRepo = new ChatRepository();

// Initialize services
const userService = new UserService(userRepo, contactRepo, chatRepo);
const userController = new UserController(userService);

// All routes require authentication
router.use(authMiddleware.authenticate);

// User routes
router.get('/profile', userController.getProfile);
router.put('/profile', validateBody(userUpdateSchema), userController.updateProfile);
router.get('/search', searchRateLimit, userController.searchUsers);
router.get('/:userId', validateParams(createUuidParamsSchema('userId')), userController.getUserById);

export { router as userRoutes };
