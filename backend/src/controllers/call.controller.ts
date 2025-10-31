/**
 * Call Controller
 * 
 * Handles HTTP requests for WebRTC call operations:
 * - POST /api/calls/respond - Accept or reject a call
 * - POST /api/calls/:callId/end - End an active call
 * 
 * These endpoints work in coordination with WebSocket events for real-time signaling.
 */

import { Request, Response } from 'express';
import { callService } from '../services/call.service';
import { respondToCallSchema, endCallSchema } from '../utils/validators.util';
import { asyncHandler } from '../middleware/error.middleware';
import { logger } from '../utils/logger.util';
import { getSocketManager } from '../websocket/socket.manager';

/**
 * POST /api/calls/respond
 * 
 * Respond to an incoming call (accept or reject)
 * 
 * Request body:
 * - callId: string (UUID)
 * - response: 'accept' | 'reject'
 * - sdp: any (optional, WebRTC SDP answer)
 * 
 * Response:
 * - 200: Call response processed
 * - 400: Invalid request
 * - 404: Call not found
 * - 500: Server error
 */
export const respondToCall = asyncHandler(async (req: Request, res: Response) => {
  // Validate request body
  const validatedData = respondToCallSchema.parse(req.body);
  const userId = (req as any).user.id; // From auth middleware
  
  const { callId, response, sdp } = validatedData;
  
  logger.info(`User ${userId} responding to call ${callId}: ${response}`);
  
  // Process response
  const call = await callService.respondToCall({
    callId,
    userId,
    response,
    sdp,
  });
  
  // Emit WebSocket event to caller
  const socketManager = getSocketManager();
  if (socketManager) {
    socketManager.emitToUser(call.callerId, 'call.response', {
      callId: call.id,
      response,
      call,
      timestamp: new Date().toISOString(),
    });
    
    logger.info(`Call response event sent to caller ${call.callerId}`);
  }
  
  // If rejected, also emit call.ended to both parties
  if (response === 'reject') {
    if (socketManager) {
      socketManager.emitToUser(call.callerId, 'call.ended', {
        callId: call.id,
        reason: 'rejected',
        timestamp: new Date().toISOString(),
      });
      socketManager.emitToUser(userId, 'call.ended', {
        callId: call.id,
        reason: 'rejected',
        timestamp: new Date().toISOString(),
      });
    }
  }
  
  res.status(200).json({
    success: true,
    data: {
      call,
    },
  });
});

/**
 * POST /api/calls/:callId/end
 * 
 * End an active call
 * 
 * URL params:
 * - callId: string (UUID)
 * 
 * Response:
 * - 200: Call ended successfully
 * - 400: Invalid request
 * - 404: Call not found
 * - 500: Server error
 */
export const endCall = asyncHandler(async (req: Request, res: Response) => {
  const { callId } = req.params;
  const userId = (req as any).user.id; // From auth middleware
  
  // Ensure callId exists
  if (!callId) {
    throw new Error('Call ID is required');
  }
  
  // Validate callId
  endCallSchema.parse({ callId });
  
  logger.info(`User ${userId} ending call ${callId}`);
  
  // End call
  const call = await callService.endCall({
    callId,
    userId,
  });
  
  // Emit WebSocket event to both parties
  const socketManager = getSocketManager();
  if (socketManager) {
    socketManager.emitToUser(call.callerId, 'call.ended', {
      callId: call.id,
      reason: 'ended',
      endedBy: userId,
      timestamp: new Date().toISOString(),
    });
    
    socketManager.emitToUser(call.recipientId, 'call.ended', {
      callId: call.id,
      reason: 'ended',
      endedBy: userId,
      timestamp: new Date().toISOString(),
    });
    
    logger.info(`Call ended event sent to both parties`);
  }
  
  res.status(200).json({
    success: true,
    data: {
      call,
    },
  });
});

/**
 * GET /api/calls/active
 * 
 * Get the current user's active call (if any)
 * 
 * Response:
 * - 200: Active call or null
 * - 500: Server error
 */
export const getActiveCall = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  
  const call = await callService.getActiveCallForUser(userId);
  
  res.status(200).json({
    success: true,
    data: {
      call,
    },
  });
});
