import { io, Socket } from 'socket.io-client';
import { config } from '../config';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string) {
    if (this.socket?.connected) {
      return;
    }

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

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', reason => {
      console.warn('❌ WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', error => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
    });

    this.socket.on('reconnect_attempt', attempt => {
      console.warn(`Reconnection attempt ${attempt}/${this.maxReconnectAttempts}`);
    });

    this.socket.on('server:shutdown', data => {
      console.warn('Server shutdown:', data.message);
      // Show notification to user
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event: string, callback: (data: any) => void) {
    this.socket?.on(event, callback);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  off(event: string, callback?: (data: any) => void) {
    this.socket?.off(event, callback);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emit(event: string, data: any) {
    this.socket?.emit(event, data);
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const wsService = new WebSocketService();
