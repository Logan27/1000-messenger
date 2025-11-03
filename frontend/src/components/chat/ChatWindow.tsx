import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ChatHeader } from './ChatHeader';
import { TypingIndicator } from './TypingIndicator';
import { useChatStore } from '../../store/chatStore';
import { useWebSocket } from '../../hooks/useWebSocket';
import { apiService } from '../../services/api.service';

export const ChatWindow: React.FC = () => {
  const { chatId, slug, messageId } = useParams<{ chatId?: string; slug?: string; messageId?: string }>();
  const { activeChat, messages, typingUsers, setActiveChat } = useChatStore();
  const { startTyping, stopTyping } = useWebSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Determine the effective chat ID from URL params or active chat state
  const effectiveChatId = chatId || activeChat;

  const currentMessages = useMemo(() => {
    return effectiveChatId ? messages[effectiveChatId] || [] : [];
  }, [effectiveChatId, messages]);

  const currentTypingUsers = useMemo(() => {
    return effectiveChatId ? typingUsers[effectiveChatId] || [] : [];
  }, [effectiveChatId, typingUsers]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const loadMessages = useCallback(async (targetChatId: string) => {
    try {
      const response = await apiService.getMessages(targetChatId);
      useChatStore.getState().setMessages(targetChatId, response.data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }, []);

  // Handle deep linking: Update active chat when URL params change
  useEffect(() => {
    if (chatId && chatId !== activeChat) {
      setActiveChat(chatId);
    }
  }, [chatId, activeChat, setActiveChat]);

  // Load messages when effective chat ID changes
  useEffect(() => {
    if (effectiveChatId) {
      loadMessages(effectiveChatId);
    }
  }, [effectiveChatId, loadMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages, scrollToBottom]);

  const handleSendMessage = async (content: string, files?: File[]) => {
    if (!effectiveChatId) return;

    try {
      // Upload images first if any
      let metadata = {};

      if (files && files.length > 0) {
        const uploadedImages = await Promise.all(files.map(file => apiService.uploadImage(file)));

        metadata = {
          images: uploadedImages.map(img => ({
            url: img.mediumUrl,
            thumbnailUrl: img.thumbnailUrl,
            originalUrl: img.originalUrl,
          })),
        };
      }

      await apiService.sendMessage(effectiveChatId, {
        content,
        contentType: files && files.length > 0 ? 'image' : 'text',
        metadata,
      });

      stopTyping(effectiveChatId);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleTyping = () => {
    if (!effectiveChatId) return;

    startTyping(effectiveChatId);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(effectiveChatId);
    }, 3000);
  };

  if (!effectiveChatId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <p className="text-xl">Select a chat to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <ChatHeader chatId={effectiveChatId} />

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <MessageList messages={currentMessages} messageId={messageId} />
        <div ref={messagesEndRef} />
      </div>

      {currentTypingUsers.length > 0 && <TypingIndicator users={currentTypingUsers} />}

      <MessageInput onSend={handleSendMessage} onTyping={handleTyping} />
    </div>
  );
};
