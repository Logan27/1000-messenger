import { Router } from 'express';
import { ContactController } from '../controllers/contact.controller';
import { ContactService } from '../services/contact.service';
import { ContactRepository } from '../repositories/contact.repository';
import { UserRepository } from '../repositories/user.repository';
import { authMiddleware } from '../middleware/auth.middleware';
import { contactRequestRateLimit } from '../middleware/rate-limit.middleware';

const router = Router();

// Initialize services
const userRepo = new UserRepository();
const contactRepo = new ContactRepository();
const contactService = new ContactService(contactRepo, userRepo);
const contactController = new ContactController(contactService);

// All routes require authentication
router.use(authMiddleware.authenticate);

// Contact routes
router.get('/', contactController.getContacts);
router.get('/pending', contactController.getPendingRequests);
router.post('/request', contactRequestRateLimit, contactController.sendRequest);
router.post('/:requestId/accept', contactController.acceptRequest);
router.post('/:requestId/reject', contactController.rejectRequest);
router.delete('/:contactId', contactController.removeContact);
router.post('/:contactId/block', contactController.blockContact);
router.delete('/:contactId/block', contactController.unblockContact);

export { router as contactRoutes };
