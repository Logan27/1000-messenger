import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import type { Chat as APIChat, Message as APIMessage, Reaction as APIReaction } from '../services/api.service';

// Re-export types from API service for consistency
type Chat = APIChat;
type Message = APIMessage;
type Reaction = APIReaction;

interface ChatState {
  chats: Chat[];
  messages: Record<string, Message[]>;
  activeChat: string | null;
  typingUsers: Record<string, string[]>;
  
  // Pagination state
  messageCursors: Record<string, string | null>; // Track cursor for each chat
  hasMoreMessages: Record<string, boolean>; // Track if more messages available
  isLoadingMessages: Record<string, boolean>; // Track loading state per chat

  // Actions
  setChats: (chats: Chat[]) => void;
  addChat: (chat: Chat) => void;
  updateChat: (chatId: string, updates: Partial<Chat>) => void;
  removeChat: (chatId: string) => void;
  setActiveChat: (chatId: string | null) => void;

  setMessages: (chatId: string, messages: Message[]) => void;
  prependMessages: (chatId: string, messages: Message[], cursor: string | null, hasMore: boolean) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (messageId: string) => void;
  
  setLoadingMessages: (chatId: string, isLoading: boolean) => void;

  addReaction: (messageId: string, emoji: string, userId: string) => void;
  removeReaction: (messageId: string, reactionId: string) => void;

  updateMessageStatus: (messageId: string, status: string, userId: string) => void;

  setTyping: (chatId: string, userId: string, isTyping: boolean) => void;

  incrementUnread: (chatId: string) => void;
  resetUnread: (chatId: string) => void;
  
  updateMessageDeliveryStatus: (
    messageId: string,
    deliveryStatus: 'sent' | 'delivered' | 'read',
    readCount?: { total: number; read: number }
  ) => void;
}

export const useChatStore = create<ChatState>()(
  devtools(
    persist(
      set => ({
        chats: [],
        messages: {},
        activeChat: null,
        typingUsers: {},
        messageCursors: {},
        hasMoreMessages: {},
        isLoadingMessages: {},

        setChats: chats => set({ chats }),

        addChat: chat =>
          set(state => ({
            chats: [chat, ...state.chats],
          })),

        updateChat: (chatId, updates) =>
          set(state => ({
            chats: state.chats.map(chat =>
              chat.id === chatId ? { ...chat, ...updates } : chat
            ),
          })),

        removeChat: chatId =>
          set(state => ({
            chats: state.chats.filter(chat => chat.id !== chatId),
            activeChat: state.activeChat === chatId ? null : state.activeChat,
          })),

        setActiveChat: chatId => set({ activeChat: chatId }),

        setMessages: (chatId, messages) =>
          set(state => ({
            messages: {
              ...state.messages,
              [chatId]: messages,
            },
            messageCursors: {
              ...state.messageCursors,
              [chatId]: messages.length > 0 ? messages[0].createdAt : null,
            },
            hasMoreMessages: {
              ...state.hasMoreMessages,
              [chatId]: messages.length >= 50, // Assume more if we got a full page
            },
          })),

        prependMessages: (chatId, messages, cursor, hasMore) =>
          set(state => {
            const existingMessages = state.messages[chatId] || [];
            const newMessages = [...messages, ...existingMessages];

            return {
              messages: {
                ...state.messages,
                [chatId]: newMessages,
              },
              messageCursors: {
                ...state.messageCursors,
                [chatId]: cursor,
              },
              hasMoreMessages: {
                ...state.hasMoreMessages,
                [chatId]: hasMore,
              },
              isLoadingMessages: {
                ...state.isLoadingMessages,
                [chatId]: false,
              },
            };
          }),

        setLoadingMessages: (chatId, isLoading) =>
          set(state => ({
            isLoadingMessages: {
              ...state.isLoadingMessages,
              [chatId]: isLoading,
            },
          })),

        addMessage: message =>
          set(state => {
            const chatMessages = state.messages[message.chatId] || [];

            // Check if message already exists
            if (chatMessages.some(m => m.id === message.id)) {
              return state;
            }

            return {
              messages: {
                ...state.messages,
                [message.chatId]: [...chatMessages, message],
              },
              chats: state.chats.map(chat =>
                chat.id === message.chatId
                  ? {
                      ...chat,
                      lastMessage: message,
                      lastMessageAt: message.createdAt,
                    }
                  : chat
              ),
            };
          }),

        updateMessage: (messageId, updates) =>
          set(state => {
            const newMessages = { ...state.messages };

            for (const chatId in newMessages) {
              newMessages[chatId] = newMessages[chatId].map(msg =>
                msg.id === messageId ? { ...msg, ...updates } : msg
              );
            }

            return { messages: newMessages };
          }),

        deleteMessage: messageId =>
          set(state => {
            const newMessages = { ...state.messages };

            for (const chatId in newMessages) {
              newMessages[chatId] = newMessages[chatId].filter(msg => msg.id !== messageId);
            }

            return { messages: newMessages };
          }),

        addReaction: (messageId, emoji, userId) =>
          set(state => {
            const newMessages = { ...state.messages };

            for (const chatId in newMessages) {
              newMessages[chatId] = newMessages[chatId].map(msg => {
                if (msg.id === messageId) {
                  const reactions = msg.reactions || [];
                  return {
                    ...msg,
                    reactions: [
                      ...reactions,
                      { 
                        id: Date.now().toString(), 
                        messageId, 
                        userId, 
                        emoji,
                        createdAt: new Date().toISOString()
                      },
                    ],
                  };
                }
                return msg;
              });
            }

            return { messages: newMessages };
          }),

        removeReaction: (messageId, reactionId) =>
          set(state => {
            const newMessages = { ...state.messages };

            for (const chatId in newMessages) {
              newMessages[chatId] = newMessages[chatId].map(msg => {
                if (msg.id === messageId) {
                  return {
                    ...msg,
                    reactions: (msg.reactions || []).filter(r => r.id !== reactionId),
                  };
                }
                return msg;
              });
            }

            return { messages: newMessages };
          }),

        updateMessageStatus: (_messageId, _status, _userId) =>
          set(state => {
            // Update delivery status metadata
            return state;
          }),

        setTyping: (chatId, userId, isTyping) =>
          set(state => {
            const typingUsers = state.typingUsers[chatId] || [];

            return {
              typingUsers: {
                ...state.typingUsers,
                [chatId]: isTyping
                  ? [...typingUsers.filter(id => id !== userId), userId]
                  : typingUsers.filter(id => id !== userId),
              },
            };
          }),

        incrementUnread: chatId =>
          set(state => ({
            chats: state.chats.map(chat =>
              chat.id === chatId ? { ...chat, unreadCount: (chat.unreadCount || 0) + 1 } : chat
            ),
          })),

        resetUnread: chatId =>
          set(state => ({
            chats: state.chats.map(chat =>
              chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
            ),
          })),

        updateMessageDeliveryStatus: (
          messageId: string,
          deliveryStatus: 'sent' | 'delivered' | 'read',
          readCount?: { total: number; read: number }
        ) =>
          set(state => {
            const newMessages = { ...state.messages };
            for (const chatId in newMessages) {
              const chatMessages = newMessages[chatId];
              const messageIndex = chatMessages.findIndex(m => m.id === messageId);
              if (messageIndex !== -1) {
                chatMessages[messageIndex] = {
                  ...chatMessages[messageIndex],
                  deliveryStatus,
                  readCount,
                };
              }
            }
            return { messages: newMessages };
          }),
      }),
      {
        name: 'chat-storage',
        partialize: state => ({
          chats: state.chats,
          activeChat: state.activeChat,
          // Don't persist messages to avoid unbounded memory growth
          // Messages will be fetched from the server on demand
        }),
      }
    )
  )
);
