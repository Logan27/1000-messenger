/**
 * Call Service
 * 
 * Manages WebRTC call state and signaling for voice/video calls.
 * Uses in-memory storage for call state (calls are ephemeral).
 * 
 * Features:
 * - Call initiation and response handling
 * - Call state management (pending, active, ended)
 * - WebSocket signaling coordination
 * - Automatic cleanup of ended calls
 */

import { logger } from '../utils/logger.util';
import { NotFoundError, ValidationError } from '../middleware/error.middleware';

// Call types
export type CallType = 'audio' | 'video';
export type CallStatus = 'pending' | 'active' | 'ended' | 'rejected';

// Call interface
export interface Call {
  id: string;
  callerId: string;
  callerName: string;
  recipientId: string;
  recipientName?: string;
  type: CallType;
  status: CallStatus;
  createdAt: Date;
  answeredAt?: Date;
  endedAt?: Date;
  sdp?: any; // WebRTC SDP offer/answer
  iceCandidates?: any[]; // ICE candidates
}

// In-memory call storage
class CallStore {
  private calls: Map<string, Call> = new Map();
  private userCalls: Map<string, Set<string>> = new Map(); // userId -> Set<callId>

  // Create a new call
  create(call: Call): void {
    this.calls.set(call.id, call);
    
    // Track by caller
    if (!this.userCalls.has(call.callerId)) {
      this.userCalls.set(call.callerId, new Set());
    }
    this.userCalls.get(call.callerId)!.add(call.id);
    
    // Track by recipient
    if (!this.userCalls.has(call.recipientId)) {
      this.userCalls.set(call.recipientId, new Set());
    }
    this.userCalls.get(call.recipientId)!.add(call.id);
    
    logger.info(`Call created: ${call.id} (${call.callerId} -> ${call.recipientId})`);
  }

  // Get call by ID
  get(callId: string): Call | undefined {
    return this.calls.get(callId);
  }

  // Update call
  update(callId: string, updates: Partial<Call>): Call | undefined {
    const call = this.calls.get(callId);
    if (!call) return undefined;
    
    const updatedCall = { ...call, ...updates };
    this.calls.set(callId, updatedCall);
    return updatedCall;
  }

  // Delete call
  delete(callId: string): void {
    const call = this.calls.get(callId);
    if (!call) return;
    
    // Remove from user tracking
    this.userCalls.get(call.callerId)?.delete(callId);
    this.userCalls.get(call.recipientId)?.delete(callId);
    
    // Remove call
    this.calls.delete(callId);
    logger.info(`Call deleted: ${callId}`);
  }

  // Get all calls for a user
  getByUser(userId: string): Call[] {
    const callIds = this.userCalls.get(userId) || new Set();
    return Array.from(callIds)
      .map(id => this.calls.get(id))
      .filter((call): call is Call => call !== undefined);
  }

  // Get active call for a user
  getActiveCall(userId: string): Call | undefined {
    return this.getByUser(userId).find(
      call => call.status === 'pending' || call.status === 'active'
    );
  }

  // Cleanup old ended calls (older than 1 hour)
  cleanup(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const toDelete: string[] = [];
    
    this.calls.forEach((call, id) => {
      if (call.status === 'ended' && call.endedAt && call.endedAt < oneHourAgo) {
        toDelete.push(id);
      }
    });
    
    toDelete.forEach(id => this.delete(id));
    
    if (toDelete.length > 0) {
      logger.info(`Cleaned up ${toDelete.length} old calls`);
    }
  }
}

// Singleton instance
const callStore = new CallStore();

// Run cleanup every 10 minutes
setInterval(() => callStore.cleanup(), 10 * 60 * 1000);

// Call Service class
export class CallService {
  /**
   * Initiate a new call
   */
  async initiateCall(params: {
    callId: string;
    callerId: string;
    callerName: string;
    recipientId: string;
    type: CallType;
    sdp?: any;
  }): Promise<Call> {
    const { callId, callerId, callerName, recipientId, type, sdp } = params;
    
    // Check if caller already has an active call
    const existingCall = callStore.getActiveCall(callerId);
    if (existingCall) {
      throw new ValidationError('You already have an active call');
    }
    
    // Check if recipient has an active call
    const recipientCall = callStore.getActiveCall(recipientId);
    if (recipientCall) {
      throw new ValidationError('Recipient is already in a call');
    }
    
    // Create call
    const call: Call = {
      id: callId,
      callerId,
      callerName,
      recipientId,
      type,
      status: 'pending',
      createdAt: new Date(),
      sdp,
      iceCandidates: [],
    };
    
    callStore.create(call);
    
    logger.info(`Call initiated: ${callId}`, { callerId, recipientId, type });
    
    return call;
  }

  /**
   * Respond to a call (accept or reject)
   */
  async respondToCall(params: {
    callId: string;
    userId: string;
    response: 'accept' | 'reject';
    sdp?: any;
  }): Promise<Call> {
    const { callId, userId, response, sdp } = params;
    
    // Get call
    const call = callStore.get(callId);
    if (!call) {
      throw new NotFoundError('Call not found');
    }
    
    // Verify user is the recipient
    if (call.recipientId !== userId) {
      throw new ValidationError('You are not the recipient of this call');
    }
    
    // Verify call is pending
    if (call.status !== 'pending') {
      throw new ValidationError(`Call is already ${call.status}`);
    }
    
    // Update call based on response
    if (response === 'accept') {
      const updatedCall = callStore.update(callId, {
        status: 'active',
        answeredAt: new Date(),
        sdp,
      });
      
      logger.info(`Call accepted: ${callId}`, { userId });
      return updatedCall!;
    } else {
      const updatedCall = callStore.update(callId, {
        status: 'rejected',
        endedAt: new Date(),
      });
      
      logger.info(`Call rejected: ${callId}`, { userId });
      
      // Schedule deletion after 5 seconds
      setTimeout(() => callStore.delete(callId), 5000);
      
      return updatedCall!;
    }
  }

  /**
   * End a call
   */
  async endCall(params: {
    callId: string;
    userId: string;
  }): Promise<Call> {
    const { callId, userId } = params;
    
    // Get call
    const call = callStore.get(callId);
    if (!call) {
      throw new NotFoundError('Call not found');
    }
    
    // Verify user is participant
    if (call.callerId !== userId && call.recipientId !== userId) {
      throw new ValidationError('You are not a participant in this call');
    }
    
    // Update call
    const updatedCall = callStore.update(callId, {
      status: 'ended',
      endedAt: new Date(),
    });
    
    logger.info(`Call ended: ${callId}`, { userId });
    
    // Schedule deletion after 5 seconds
    setTimeout(() => callStore.delete(callId), 5000);
    
    return updatedCall!;
  }

  /**
   * Get call by ID
   */
  async getCall(callId: string): Promise<Call | null> {
    const call = callStore.get(callId);
    return call || null;
  }

  /**
   * Get active call for user
   */
  async getActiveCallForUser(userId: string): Promise<Call | null> {
    const call = callStore.getActiveCall(userId);
    return call || null;
  }

  /**
   * Add ICE candidate to call
   */
  async addIceCandidate(params: {
    callId: string;
    userId: string;
    candidate: any;
  }): Promise<void> {
    const { callId, userId, candidate } = params;
    
    // Get call
    const call = callStore.get(callId);
    if (!call) {
      throw new NotFoundError('Call not found');
    }
    
    // Verify user is participant
    if (call.callerId !== userId && call.recipientId !== userId) {
      throw new ValidationError('You are not a participant in this call');
    }
    
    // Add candidate
    if (!call.iceCandidates) {
      call.iceCandidates = [];
    }
    call.iceCandidates.push(candidate);
    
    logger.debug(`ICE candidate added to call: ${callId}`);
  }
}

// Export singleton instance
export const callService = new CallService();
