import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';
import { UserRepository } from '../repositories/user.repository';
import { SessionService } from '../services/session.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate, registerSchema, loginSchema } from '../middleware/validation.middleware';
import { refreshTokenSchema } from '../utils/validators.util';
import { authRateLimit } from '../middleware/rate-limit.middleware';

const router = Router();

// Initialize services
const userRepo = new UserRepository();
const sessionService = new SessionService();
const authService = new AuthService(userRepo, sessionService);
const authController = new AuthController(authService);

// Public routes
router.post('/register', authRateLimit, validate(registerSchema), authController.register);

router.post('/login', authRateLimit, validate(loginSchema), authController.login);

router.post('/refresh', authRateLimit, validate(refreshTokenSchema), authController.refreshToken);

// Protected routes
router.post('/logout', authMiddleware.authenticate, authController.logout);

export { router as authRoutes };
