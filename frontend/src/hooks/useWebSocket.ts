import { useEffect, useCallback } from 'react';
import { wsService } from '../services/websocket.service';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';

interface Reaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
}

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  contentType: 'text' | 'image' | 'system';
  metadata?: Record<string, unknown>;
  createdAt: string;
  isEdited: boolean;
  reactions?: Reaction[];
}

interface MessageReadData {
  messageId: string;
  readBy: string;
}

interface ReactionData {
  messageId: string;
  emoji: string;
  userId: string;
}

export const useWebSocket = () => {
  const { token, isAuthenticated } = useAuthStore();
  const { addMessage, updateMessageStatus, addReaction } = useChatStore();

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    // Connect to WebSocket
    wsService.connect(token);

    // Listen for new messages
    wsService.on('message:new', (data) => {
      const message = data as Message;
      addMessage(message);
    });

    // Listen for message read receipts
    wsService.on('message:read', (data) => {
      const readData = data as MessageReadData;
      updateMessageStatus(readData.messageId, 'read', readData.readBy);
    });

    // Listen for message edits
    wsService.on('message:edited', () => {
      // Update message in store
    });

    // Listen for message deletions
    wsService.on('message:deleted', () => {
      // Remove message from store
    });

    // Listen for reactions
    wsService.on('reaction:added', (data) => {
      const reactionData = data as ReactionData;
      addReaction(reactionData.messageId, reactionData.emoji, reactionData.userId);
    });

    // Listen for typing indicators
    wsService.on('typing:start', () => {
      // Show typing indicator
    });

    wsService.on('typing:stop', () => {
      // Hide typing indicator
    });

    // Listen for user status changes
    wsService.on('user:status', () => {
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
