import { Router } from 'express';
import { HealthController } from '../controllers/health.controller';

const router = Router();
const healthController = new HealthController();

// Health check routes (no authentication required)
router.get('/', healthController.health);
router.get('/ready', healthController.ready);

export { router as healthRoutes };
