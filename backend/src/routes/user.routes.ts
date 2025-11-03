import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { UserService } from '../services/user.service';
import { UserRepository } from '../repositories/user.repository';
import { ContactRepository } from '../repositories/contact.repository';
import { ChatRepository } from '../repositories/chat.repository';
import { authMiddleware } from '../middleware/auth.middleware';
import { uploadRateLimit, searchRateLimit } from '../middleware/rate-limit.middleware';
import { validateBody, validateParams, createUuidParamsSchema } from '../middleware/validation.middleware';
import { validateImageUpload } from '../middleware/security.middleware';
import { uploadSingle } from '../middleware/upload.middleware';
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

// User routes - specific routes must come before parameterized routes
router.get('/me', userController.getProfile);
router.put('/me', validateBody(userUpdateSchema), userController.updateProfile);
router.patch('/me/avatar', uploadRateLimit, uploadSingle.single('avatar'), validateImageUpload, userController.updateAvatar);
router.get('/search', searchRateLimit, userController.searchUsers);
router.get('/:id', validateParams(createUuidParamsSchema('id')), userController.getUserById);

export { router as userRoutes };
