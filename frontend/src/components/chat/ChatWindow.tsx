import React, { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ChatHeader } from './ChatHeader';
import { TypingIndicator } from './TypingIndicator';
import { useChatStore } from '../../store/chatStore';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { apiService } from '../../services/api.service';
import { wsService } from '../../services/websocket.service';

interface ReplyMessage {
  id: string;
  senderId?: string;
  sender?: {
    username: string;
  };
  content: string;
}

export const ChatWindow: React.FC = () => {
  const { chatId, slug, messageId } = useParams<{ chatId?: string; slug?: string; messageId?: string }>();
  const {
    activeChat,
    messages,
    typingUsers,
    messageCursors,
    hasMoreMessages,
    isLoadingMessages,
    setActiveChat,
    prependMessages,
    setLoadingMessages
  } = useChatStore();
  const { startTyping, stopTyping } = useWebSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const [replyTo, setReplyTo] = useState<ReplyMessage | undefined>(undefined);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

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
      useChatStore.getState().setMessages(targetChatId, response.data as any);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }, []);

  const loadMoreMessages = useCallback(async () => {
    if (!effectiveChatId || isLoadingMessages[effectiveChatId]) return;

    const cursor = messageCursors[effectiveChatId];
    if (!cursor) return;

    setLoadingMessages(effectiveChatId, true);

    try {
      const response = await apiService.getMessages(effectiveChatId, 50, cursor);
      prependMessages(
        effectiveChatId,
        response.data as any,
        response.data.length > 0 ? response.data[0].createdAt : null,
        response.data.length >= 50
      );
    } catch (error) {
      console.error('Failed to load more messages:', error);
      setLoadingMessages(effectiveChatId, false);
    }
  }, [effectiveChatId, messageCursors, isLoadingMessages, setLoadingMessages, prependMessages]);

  const scrollContainerRef = useInfiniteScroll({
    onLoadMore: loadMoreMessages,
    hasMore: effectiveChatId ? hasMoreMessages[effectiveChatId] ?? false : false,
    isLoading: effectiveChatId ? isLoadingMessages[effectiveChatId] ?? false : false,
    threshold: 100,
  });

  // Handle deep linking: Update active chat when URL params change (T224)
  useEffect(() => {
    const loadChatFromParams = async () => {
      // Handle slug-based navigation
      if (slug) {
        try {
          const response = await apiService.getChatBySlug(slug);
          const chat = response.chat;
          if (chat && chat.id !== activeChat) {
            setActiveChat(chat.id);
          }
        } catch (error) {
          console.error('Failed to load chat by slug:', error);
        }
      }
      // Handle ID-based navigation
      else if (chatId && chatId !== activeChat) {
        setActiveChat(chatId);
      }
    };

    loadChatFromParams();
  }, [chatId, slug, activeChat, setActiveChat]);

  // Listen for reply events from Message component
  useEffect(() => {
    const handleReplyEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      const message = customEvent.detail;
      setReplyTo({
        id: message.id,
        senderId: message.senderId,
        sender: message.sender || { username: 'Unknown User' },
        content: message.content,
      });
    };

    window.addEventListener('message:reply', handleReplyEvent);
    return () => window.removeEventListener('message:reply', handleReplyEvent);
  }, []);

  // Load messages when effective chat ID changes
  useEffect(() => {
    if (effectiveChatId) {
      loadMessages(effectiveChatId);
      
      // Mark all messages in this chat as read
      wsService.emit('chat:mark-all-read', { chatId: effectiveChatId });
      
      // Reset unread count
      useChatStore.getState().resetUnread(effectiveChatId);
    }
  }, [effectiveChatId, loadMessages]);

  useEffect(() => {
    // Only auto-scroll if not navigating to a specific message
    if (!messageId) {
      scrollToBottom();
    }
  }, [currentMessages, scrollToBottom, messageId]);

  // Handle deep linking to specific message (T205)
  useEffect(() => {
    if (messageId && currentMessages.length > 0) {
      // Wait a bit for DOM to update
      const timer = setTimeout(() => {
        const messageElement = document.getElementById(`message-${messageId}`);
        if (messageElement) {
          // Scroll to the message
          messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

          // Highlight the message
          setHighlightedMessageId(messageId);

          // Remove highlight after 3 seconds
          setTimeout(() => {
            setHighlightedMessageId(null);
          }, 3000);
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [messageId, currentMessages]);

  const handleSendMessage = async (content: string, files?: File[], replyToId?: string) => {
    if (!effectiveChatId) return;

    const tempId = `temp-${Date.now()}`;
    const currentUser = useChatStore.getState().chats.find(c => c.id === effectiveChatId)?.participants[0];

    // Create optimistic message
    const optimisticMessage = {
      id: tempId,
      chatId: effectiveChatId,
      senderId: currentUser?.userId || 'unknown',
      content,
      contentType: (files && files.length > 0 ? 'image' : 'text') as 'text' | 'image' | 'system',
      metadata: {},
      replyToId,
      createdAt: new Date().toISOString(),
      isEdited: false,
      reactions: [],
      isPending: true,
    };

    // Add optimistic message immediately
    useChatStore.getState().addMessage(optimisticMessage as any);

    // Clear reply state
    setReplyTo(undefined);

    try {
      // Upload images first if any
      let metadata = {};

      if (files && files.length > 0) {
        const uploadedImages = await Promise.all(files.map(file => apiService.uploadImage(file)));

        metadata = {
          images: uploadedImages.map(img => ({
            url: img.url,
            thumbnailUrl: img.thumbnailUrl,
            originalUrl: img.url,
          })),
        };
      }

      // Send actual message
      const sentMessage = await apiService.sendMessage(effectiveChatId, {
        content,
        contentType: files && files.length > 0 ? 'image' : 'text',
        metadata,
        replyToId,
      });

      // Replace optimistic message with real one
      useChatStore.getState().updateMessage(tempId, {
        ...sentMessage,
        isPending: false,
      });

      stopTyping(effectiveChatId);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Mark message as failed
      useChatStore.getState().updateMessage(tempId, {
        isFailed: true,
        isPending: false,
      } as any);
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
      <div className="flex-1 flex items-center justify-center bg-secondary-50">
        <div className="text-center">
          <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center shadow-telegram">
            <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-xl text-secondary-600 font-medium">Select a chat to start messaging</p>
          <p className="text-sm text-secondary-400 mt-2">Choose a conversation from the left sidebar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <ChatHeader chatId={effectiveChatId} />

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 bg-secondary-50">
        {effectiveChatId && isLoadingMessages[effectiveChatId] && (
          <div className="text-center py-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-soft">
              <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-secondary-600">Loading more messages...</span>
            </div>
          </div>
        )}
        <MessageList messages={currentMessages} highlightedMessageId={highlightedMessageId} />
        <div ref={messagesEndRef} />
      </div>

      {currentTypingUsers.length > 0 && <TypingIndicator users={currentTypingUsers} />}

      <MessageInput 
        onSend={handleSendMessage} 
        onTyping={handleTyping} 
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(undefined)}
      />
    </div>
  );
};
