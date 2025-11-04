import { Router } from 'express';
import multer from 'multer';
import { AttachmentController } from '../controllers/attachment.controller';
import { StorageService } from '../services/storage.service';
import { MessageService } from '../services/message.service';
import { MessageRepository } from '../repositories/message.repository';
import { ChatRepository } from '../repositories/chat.repository';
import { MessageDeliveryQueue } from '../queues/message-delivery.queue';
import { SocketManager } from '../websocket/socket.manager';
import { authMiddleware } from '../middleware/auth.middleware';
import { uploadRateLimit } from '../middleware/rate-limit.middleware';
import { LIMITS } from '../config/constants';

const router = Router();

// Initialize services
const messageRepo = new MessageRepository();
const chatRepo = new ChatRepository();

// Note: These would be injected in a real app
const deliveryQueue = {} as MessageDeliveryQueue;
const socketManager = {} as SocketManager;

const messageService = new MessageService(messageRepo, chatRepo, deliveryQueue, socketManager);
const storageService = new StorageService();
const attachmentController = new AttachmentController(storageService, messageService);

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: LIMITS.IMAGE_MAX_SIZE, // 10MB
  },
  fileFilter: (_req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// All routes require authentication
router.use(authMiddleware.authenticate);

// Upload image attachment
router.post(
  '/upload',
  uploadRateLimit,
  upload.single('image'),
  attachmentController.uploadImage
);

// Get attachment metadata
router.get('/:attachmentId', attachmentController.getAttachment);

export { router as attachmentRoutes };
