import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { UserService } from '../services/user.service';
import { UserRepository } from '../repositories/user.repository';
import { authMiddleware } from '../middleware/auth.middleware';
import { searchRateLimit } from '../middleware/rate-limit.middleware';

const router = Router();

// Initialize services
const userRepo = new UserRepository();
const userService = new UserService(userRepo);
const userController = new UserController(userService);

// All routes require authentication
router.use(authMiddleware.authenticate);

// User routes
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.get('/search', searchRateLimit, userController.searchUsers);
router.get('/:userId', userController.getUserById);

export { router as userRoutes };
