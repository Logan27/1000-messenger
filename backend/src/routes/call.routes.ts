/**
 * Call Routes
 * 
 * Routes for WebRTC call operations
 * All routes require authentication
 */

import { Router } from 'express';
import { respondToCall, endCall, getActiveCall } from '../controllers/call.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All call routes require authentication
router.use(authMiddleware.authenticate.bind(authMiddleware));

/**
 * POST /api/calls/respond
 * Accept or reject an incoming call
 */
router.post('/respond', respondToCall);

/**
 * POST /api/calls/:callId/end
 * End an active call
 */
router.post('/:callId/end', endCall);

/**
 * GET /api/calls/active
 * Get the current user's active call (if any)
 */
router.get('/active', getActiveCall);

export { router as callRoutes };
