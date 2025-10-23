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
    wsService.on('message:new', (message) => {
      addMessage(message);
    });

    // Listen for message read receipts
    wsService.on('message:read', (data) => {
      updateMessageStatus(data.messageId, 'read', data.readBy);
    });

    // Listen for message edits
    wsService.on('message:edited', (data) => {
      // Update message in store
    });

    // Listen for message deletions
    wsService.on('message:deleted', (data) => {
      // Remove message from store
    });

    // Listen for reactions
    wsService.on('reaction:added', (data) => {
      addReaction(data.messageId, data.emoji, data.userId);
    });

    // Listen for typing indicators
    wsService.on('typing:start', (data) => {
      // Show typing indicator
    });

    wsService.on('typing:stop', (data) => {
      // Hide typing indicator
    });

    // Listen for user status changes
    wsService.on('user:status', (data) => {
      // Update user status in store
    });

    return () => {
      wsService.disconnect();
    };
  }, [isAuthenticated, token]);

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
