import { io, Socket } from 'socket.io-client';
import { config } from '../config';

export type ConnectionState = 
  | 'disconnected' 
  | 'connecting' 
  | 'connected' 
  | 'reconnecting' 
  | 'error';

export interface MessagePayload {
  chatId: string;
  content: string;
  contentType?: 'text' | 'image' | 'system';
  metadata?: Record<string, unknown>;
  replyToId?: string;
}

export interface MessageSentResponse {
  messageId: string;
  chatId: string;
  timestamp: string;
}

export interface MessageErrorResponse {
  error: string;
  chatId: string;
}

export interface TypingPayload {
  chatId: string;
}

export interface PresencePayload {
  status: 'online' | 'away' | 'offline';
}

export interface UserStatusEvent {
  userId: string;
  status: 'online' | 'away' | 'offline';
  timestamp: Date;
}

export interface MessageEvent {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  contentType: 'text' | 'image' | 'system';
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ReactionAddPayload {
  messageId: string;
  emoji: string;
}

export interface ReactionRemovePayload {
  reactionId: string;
}

export interface MessageEditPayload {
  messageId: string;
  content: string;
}

export interface MessageDeletePayload {
  messageId: string;
}

export interface MessageReadPayload {
  messageId: string;
}

export interface ChatMarkAllReadPayload {
  chatId: string;
}

export interface ConnectionSuccessEvent {
  userId: string;
  timestamp: Date;
}

type EventCallback<T = unknown> = (data: T) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private connectionState: ConnectionState = 'disconnected';
  private messageQueue: Array<{ event: string; data: unknown; callback?: () => void }> = [];
  private stateListeners: Set<(state: ConnectionState) => void> = new Set();
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  connect(token: string) {
    if (this.socket?.connected) {
      return;
    }

    this.setConnectionState('connecting');

    this.socket = io(config.WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventListeners();
  }

  private setConnectionState(state: ConnectionState) {
    this.connectionState = state;
    this.stateListeners.forEach(listener => listener(state));
  }

  public onConnectionStateChange(callback: (state: ConnectionState) => void): () => void {
    this.stateListeners.add(callback);
    return () => this.stateListeners.delete(callback);
  }

  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.reconnectAttempts = 0;
      this.setConnectionState('connected');
      this.processMessageQueue();
      this.startHeartbeat();
    });

    this.socket.on('disconnect', reason => {
      console.warn('❌ WebSocket disconnected:', reason);
      this.setConnectionState('disconnected');
      this.stopHeartbeat();
    });

    this.socket.on('connect_error', error => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
      this.setConnectionState('error');
    });

    this.socket.on('reconnect_attempt', attempt => {
      console.warn(`🔄 Reconnection attempt ${attempt}/${this.maxReconnectAttempts}`);
      this.setConnectionState('reconnecting');
    });

    this.socket.on('reconnect', attempt => {
      console.log(`✅ Reconnected after ${attempt} attempts`);
      this.setConnectionState('connected');
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed after maximum attempts');
      this.setConnectionState('error');
    });

    this.socket.on('server:shutdown', (data: { message: string }) => {
      console.warn('⚠️ Server shutdown:', data.message);
    });

    this.socket.on('connection:success', (data: ConnectionSuccessEvent) => {
      console.log('✅ Connection success:', data);
    });
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('presence:heartbeat');
      }
    }, 30000); // Every 30 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private processMessageQueue() {
    if (!this.socket?.connected) return;

    while (this.messageQueue.length > 0) {
      const queued = this.messageQueue.shift();
      if (queued) {
        this.socket.emit(queued.event, queued.data);
        queued.callback?.();
      }
    }
  }

  private emitOrQueue(event: string, data: unknown, callback?: () => void) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
      callback?.();
    } else {
      this.messageQueue.push({ event, data, callback });
    }
  }

  on<T = unknown>(event: string, callback: EventCallback<T>): void {
    this.socket?.on(event, callback);
  }

  off<T = unknown>(event: string, callback?: EventCallback<T>): void {
    this.socket?.off(event, callback);
  }

  emit(event: string, data: unknown): void {
    this.emitOrQueue(event, data);
  }

  sendMessage(payload: MessagePayload, onSuccess?: (response: MessageSentResponse) => void, onError?: (error: MessageErrorResponse) => void) {
    const successHandler = (response: MessageSentResponse) => {
      onSuccess?.(response);
      this.socket?.off('message:sent', successHandler);
      this.socket?.off('message:error', errorHandler);
    };

    const errorHandler = (error: MessageErrorResponse) => {
      onError?.(error);
      this.socket?.off('message:sent', successHandler);
      this.socket?.off('message:error', errorHandler);
    };

    if (onSuccess) this.socket?.on('message:sent', successHandler);
    if (onError) this.socket?.on('message:error', errorHandler);

    this.emitOrQueue('message:send', payload);
  }

  editMessage(payload: MessageEditPayload, onSuccess?: () => void, onError?: (error: string) => void) {
    if (onSuccess) {
      const handler = (data: { messageId: string }) => {
        if (data.messageId === payload.messageId) {
          onSuccess();
          this.socket?.off('message:edit:success', handler);
        }
      };
      this.socket?.on('message:edit:success', handler);
    }

    if (onError) {
      const handler = (data: { messageId: string; error: string }) => {
        if (data.messageId === payload.messageId) {
          onError(data.error);
          this.socket?.off('message:edit:error', handler);
        }
      };
      this.socket?.on('message:edit:error', handler);
    }

    this.emitOrQueue('message:edit', payload);
  }

  deleteMessage(payload: MessageDeletePayload, onSuccess?: () => void, onError?: (error: string) => void) {
    if (onSuccess) {
      const handler = (data: { messageId: string }) => {
        if (data.messageId === payload.messageId) {
          onSuccess();
          this.socket?.off('message:delete:success', handler);
        }
      };
      this.socket?.on('message:delete:success', handler);
    }

    if (onError) {
      const handler = (data: { messageId: string; error: string }) => {
        if (data.messageId === payload.messageId) {
          onError(data.error);
          this.socket?.off('message:delete:error', handler);
        }
      };
      this.socket?.on('message:delete:error', handler);
    }

    this.emitOrQueue('message:delete', payload);
  }

  markMessageAsRead(payload: MessageReadPayload) {
    this.emitOrQueue('message:read', payload);
  }

  markChatAsRead(payload: ChatMarkAllReadPayload) {
    this.emitOrQueue('chat:mark-all-read', payload);
  }

  addReaction(payload: ReactionAddPayload, onError?: (error: string) => void) {
    if (onError) {
      const handler = (data: { messageId: string; error: string }) => {
        if (data.messageId === payload.messageId) {
          onError(data.error);
          this.socket?.off('reaction:error', handler);
        }
      };
      this.socket?.on('reaction:error', handler);
    }

    this.emitOrQueue('reaction:add', payload);
  }

  removeReaction(payload: ReactionRemovePayload, onError?: (error: string) => void) {
    if (onError) {
      const handler = (data: { reactionId: string; error: string }) => {
        if (data.reactionId === payload.reactionId) {
          onError(data.error);
          this.socket?.off('reaction:error', handler);
        }
      };
      this.socket?.on('reaction:error', handler);
    }

    this.emitOrQueue('reaction:remove', payload);
  }

  startTyping(payload: TypingPayload) {
    this.emit('typing:start', payload);
  }

  stopTyping(payload: TypingPayload) {
    this.emit('typing:stop', payload);
  }

  updatePresence(payload: PresencePayload, onError?: (error: string) => void) {
    if (onError) {
      const handler = (data: { error: string }) => {
        onError(data.error);
        this.socket?.off('presence:error', handler);
      };
      this.socket?.on('presence:error', handler);
    }

    this.emitOrQueue('presence:update', payload);
  }

  onNewMessage(callback: EventCallback<MessageEvent>): () => void {
    this.socket?.on('message:new', callback);
    return () => this.socket?.off('message:new', callback);
  }

  onMessageEdited(callback: EventCallback<MessageEvent>): () => void {
    this.socket?.on('message:edited', callback);
    return () => this.socket?.off('message:edited', callback);
  }

  onMessageDeleted(callback: EventCallback<{ messageId: string; chatId: string }>): () => void {
    this.socket?.on('message:deleted', callback);
    return () => this.socket?.off('message:deleted', callback);
  }

  onMessageRead(callback: EventCallback<{ messageId: string; readBy: string; readAt: Date }>): () => void {
    this.socket?.on('message:read', callback);
    return () => this.socket?.off('message:read', callback);
  }

  onReactionAdded(callback: EventCallback<{ messageId: string; emoji: string; userId: string }>): () => void {
    this.socket?.on('reaction:added', callback);
    return () => this.socket?.off('reaction:added', callback);
  }

  onReactionRemoved(callback: EventCallback<{ messageId: string; reactionId: string; userId: string }>): () => void {
    this.socket?.on('reaction:removed', callback);
    return () => this.socket?.off('reaction:removed', callback);
  }

  onTypingStart(callback: EventCallback<{ chatId: string; userId: string }>): () => void {
    this.socket?.on('typing:start', callback);
    return () => this.socket?.off('typing:start', callback);
  }

  onTypingStop(callback: EventCallback<{ chatId: string; userId: string }>): () => void {
    this.socket?.on('typing:stop', callback);
    return () => this.socket?.off('typing:stop', callback);
  }

  onUserStatus(callback: EventCallback<UserStatusEvent>): () => void {
    this.socket?.on('user.status', callback);
    return () => this.socket?.off('user.status', callback);
  }

  onProfileUpdate(callback: EventCallback<{ userId: string; user: unknown; timestamp: string }>): () => void {
    this.socket?.on('user:profile:update', callback);
    return () => this.socket?.off('user:profile:update', callback);
  }

  disconnect() {
    this.stopHeartbeat();
    this.socket?.disconnect();
    this.socket = null;
    this.setConnectionState('disconnected');
    this.messageQueue = [];
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getQueuedMessageCount(): number {
    return this.messageQueue.length;
  }
}

export const wsService = new WebSocketService();
