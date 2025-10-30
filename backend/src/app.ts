import express from 'express';
import cors from 'cors';
import { securityHeaders, apiRateLimit } from './middleware/security.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { authRoutes } from './routes/auth.routes';
import { userRoutes } from './routes/user.routes';
import { chatRoutes } from './routes/chat.routes';
import { messageRoutes } from './routes/message.routes';
import { contactRoutes } from './routes/contact.routes';
import { healthRoutes } from './routes/health.routes';
import { config } from './config/env';
import { logger } from './utils/logger.util';

export function createApp() {
  const app = express();

  // Security middleware
  app.use(securityHeaders);
  app.use(
    cors({
      origin: config.FRONTEND_URL,
      credentials: true,
    })
  );

  // Body parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Rate limiting
  app.use('/api/', apiRateLimit);

  // Health checks (no auth required)
  app.use('/health', healthRoutes);

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/chats', chatRoutes);
  app.use('/api/messages', messageRoutes);
  app.use('/api/contacts', contactRoutes);

  // 404 handler
  app.use(notFoundHandler);

  // Error handler (must be last)
  app.use(errorHandler);

  logger.info('Express app initialized');

  return app;
}
