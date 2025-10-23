import { Router } from 'express';
import { ContactController } from '../controllers/contact.controller';
import { ContactService } from '../services/contact.service';
import { ContactRepository } from '../repositories/contact.repository';
import { UserRepository } from '../repositories/user.repository';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { AuthService } from '../services/auth.service';
import { SessionService } from '../services/session.service';

const router = Router();

// Initialize services
const userRepo = new UserRepository();
const contactRepo = new ContactRepository();
const sessionService = new SessionService();
const authService = new AuthService(userRepo, sessionService);
const contactService = new ContactService(contactRepo, userRepo);
const contactController = new ContactController(contactService);
const authMiddleware = new AuthMiddleware(authService);

// All routes require authentication
router.use(authMiddleware.authenticate);

// Contact routes
router.get('/', contactController.getContacts);
router.get('/pending', contactController.getPendingRequests);
router.post('/request', contactController.sendRequest);
router.post('/:requestId/accept', contactController.acceptRequest);
router.post('/:requestId/reject', contactController.rejectRequest);
router.delete('/:contactId', contactController.removeContact);
router.post('/:contactId/block', contactController.blockContact);
router.delete('/:contactId/block', contactController.unblockContact);

export { router as contactRoutes };
