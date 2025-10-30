import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface Participant {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
}

interface MessageMetadata {
  images?: Array<{
    url: string;
    thumbnailUrl: string;
    originalUrl: string;
  }>;
  [key: string]: unknown;
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

interface Reaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
}

interface Participant {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
}

interface Chat {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  slug?: string;
  avatarUrl?: string;
  participants: Array<Record<string, unknown>>;
  lastMessage?: Message;
  unreadCount: number;
  lastMessageAt?: string;
}

interface ChatState {
  chats: Chat[];
  messages: Record<string, Message[]>;
  activeChat: string | null;
  typingUsers: Record<string, string[]>;

  // Actions
  setChats: (chats: Chat[]) => void;
  addChat: (chat: Chat) => void;
  setActiveChat: (chatId: string | null) => void;

  setMessages: (chatId: string, messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (messageId: string) => void;

  addReaction: (messageId: string, emoji: string, userId: string) => void;
  removeReaction: (messageId: string, reactionId: string) => void;

  updateMessageStatus: (messageId: string, status: string, userId: string) => void;

  setTyping: (chatId: string, userId: string, isTyping: boolean) => void;

  incrementUnread: (chatId: string) => void;
  resetUnread: (chatId: string) => void;
}

export const useChatStore = create<ChatState>()(
  devtools(
    persist(
      set => ({
        chats: [],
        messages: {},
        activeChat: null,
        typingUsers: {},

        setChats: chats => set({ chats }),

        addChat: chat =>
          set(state => ({
            chats: [chat, ...state.chats],
          })),

        setActiveChat: chatId => set({ activeChat: chatId }),

        setMessages: (chatId, messages) =>
          set(state => ({
            messages: {
              ...state.messages,
              [chatId]: messages,
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
                      { id: Date.now().toString(), messageId, userId, emoji },
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
              chat.id === chatId ? { ...chat, unreadCount: chat.unreadCount + 1 } : chat
            ),
          })),

        resetUnread: chatId =>
          set(state => ({
            chats: state.chats.map(chat =>
              chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
            ),
          })),
      }),
      {
        name: 'chat-storage',
        partialize: state => ({
          chats: state.chats,
          activeChat: state.activeChat,
        }),
      }
    )
  )
);
