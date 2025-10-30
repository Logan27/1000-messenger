import React, { useEffect, useRef, useMemo } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ChatHeader } from './ChatHeader';
import { TypingIndicator } from './TypingIndicator';
import { useChatStore } from '../../store/chatStore';
import { useWebSocket } from '../../hooks/useWebSocket';
import { apiService } from '../../services/api.service';

export const ChatWindow: React.FC = () => {
  const { activeChat, messages, typingUsers } = useChatStore();
  const { startTyping, stopTyping } = useWebSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const currentMessages = useMemo(() => 
    activeChat ? messages[activeChat] || [] : [], 
    [activeChat, messages]
  );
  const currentTypingUsers = activeChat ? typingUsers[activeChat] || [] : [];

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const loadMessages = useCallback(async (chatId: string) => {
    try {
      const response = await apiService.getMessages(chatId);
      useChatStore.getState().setMessages(chatId, response.data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }, []);

  useEffect(() => {
    if (activeChat) {
      loadMessages(activeChat);
    }
  }, [activeChat, loadMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages, scrollToBottom]);

  const handleSendMessage = async (content: string, files?: File[]) => {
    if (!activeChat) return;

    try {
      // Upload images first if any
      let metadata = {};
      
      if (files && files.length > 0) {
        const uploadedImages = await Promise.all(
          files.map(file => apiService.uploadImage(file))
        );
        
        metadata = {
          images: uploadedImages.map(img => ({
            url: img.mediumUrl,
            thumbnailUrl: img.thumbnailUrl,
            originalUrl: img.originalUrl,
          })),
        };
      }

      await apiService.sendMessage(activeChat, {
        content,
        contentType: files && files.length > 0 ? 'image' : 'text',
        metadata,
      });

      stopTyping(activeChat);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleTyping = () => {
    if (!activeChat) return;

    startTyping(activeChat);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(activeChat);
    }, 3000);
  };

  if (!activeChat) {
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
      <ChatHeader chatId={activeChat} />
      
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <MessageList messages={currentMessages} />
        <div ref={messagesEndRef} />
      </div>

      {currentTypingUsers.length > 0 && (
        <TypingIndicator users={currentTypingUsers} />
      )}

      <MessageInput 
        onSend={handleSendMessage}
        onTyping={handleTyping}
      />
    </div>
  );
};
