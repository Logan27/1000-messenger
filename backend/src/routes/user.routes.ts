import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { UserService } from '../services/user.service';
import { UserRepository } from '../repositories/user.repository';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { AuthService } from '../services/auth.service';
import { SessionService } from '../services/session.service';
import { searchRateLimit } from '../middleware/rate-limit.middleware';

const router = Router();

// Initialize services
const userRepo = new UserRepository();
const sessionService = new SessionService();
const authService = new AuthService(userRepo, sessionService);
const userService = new UserService(userRepo);
const userController = new UserController(userService);
const authMiddleware = new AuthMiddleware(authService);

// All routes require authentication
router.use(authMiddleware.authenticate);

// User routes
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.get('/search', searchRateLimit, userController.searchUsers);
router.get('/:userId', userController.getUserById);

export { router as userRoutes };
