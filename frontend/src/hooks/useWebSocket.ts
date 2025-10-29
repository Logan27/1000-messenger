import { useEffect, useCallback } from 'react';
import { wsService } from '../services/websocket.service';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';

export const useWebSocket = () => {
  const { token, isAuthenticated } = useAuthStore();
  const { addMessage, updateMessageStatus, addReaction } = useChatStore();

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    // Connect to WebSocket
    wsService.connect(token);

    // Listen for new messages
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    wsService.on('message:new', (message: any) => {
      addMessage(message);
    });

    // Listen for message read receipts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    wsService.on('message:read', (data: any) => {
      updateMessageStatus(data.messageId as string, 'read', data.readBy as string);
    });

    // Listen for message edits
    wsService.on('message:edited', _data => {
      // Update message in store
    });

    // Listen for message deletions
    wsService.on('message:deleted', _data => {
      // Remove message from store
    });

    // Listen for reactions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    wsService.on('reaction:added', (data: any) => {
      addReaction(data.messageId as string, data.emoji as string, data.userId as string);
    });

    // Listen for typing indicators
    wsService.on('typing:start', _data => {
      // Show typing indicator
    });

    wsService.on('typing:stop', _data => {
      // Hide typing indicator
    });

    // Listen for user status changes
    wsService.on('user:status', _data => {
      // Update user status in store
    });

    return () => {
      wsService.disconnect();
    };
  }, [isAuthenticated, token, addMessage, updateMessageStatus, addReaction]);

  const sendMessage = useCallback((chatId: string, content: string) => {
    wsService.emit('message:send', { chatId, content });
  }, []);

  const startTyping = useCallback((chatId: string) => {
    wsService.emit('typing:start', { chatId });
  }, []);

  const stopTyping = useCallback((chatId: string) => {
    wsService.emit('typing:stop', { chatId });
  }, []);

  return {
    sendMessage,
    startTyping,
    stopTyping,
    isConnected: wsService.isConnected(),
  };
};
