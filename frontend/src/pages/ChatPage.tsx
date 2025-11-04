import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChatStore } from '../store/chatStore';
import { ChatWindow } from '../components/chat/ChatWindow';
import { apiService } from '../services/api.service';

export const ChatPage: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const {
    chats,
    activeChat,
    setChats,
    setActiveChat,
  } = useChatStore();

  // Load chats on mount
  useEffect(() => {
    const loadChats = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiService.getChats();
        setChats(response as any); // Type mismatch between API and store - cast for now
      } catch (err: any) {
        console.error('Failed to load chats:', err);
        setError(err.response?.data?.message || 'Failed to load chats. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadChats();
  }, [setChats]);

  // Select chat when chatId changes
  useEffect(() => {
    if (chatId && chats.length > 0) {
      const chat = chats.find(c => c.id === chatId);
      if (chat) {
        setActiveChat(chatId);
        setError(null);
      } else {
        setError('Chat not found');
      }
    } else if (!chatId && chats.length > 0) {
      // If no chatId is provided, redirect to the first chat
      navigate(`/chat/${chats[0].id}`, { replace: true });
    }
  }, [chatId, chats, setActiveChat, navigate]);

  const handleBackToContacts = () => {
    navigate('/contacts');
  };

  const retryLoadChats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiService.getChats();
      setChats(response as any); // Type mismatch between API and store - cast for now
    } catch (err: any) {
      console.error('Failed to load chats:', err);
      setError(err.response?.data?.message || 'Failed to load chats. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && chats.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chats...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <svg
            className="w-16 h-16 text-red-500 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error}
          </h2>
          <p className="text-gray-600 mb-6">
            We encountered an issue loading your chat. Please try again.
          </p>
          <div className="flex space-x-3">
            <button
              onClick={retryLoadChats}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={handleBackToContacts}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Back to Contacts
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <svg
            className="w-16 h-16 text-gray-300 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No Chats Yet
          </h2>
          <p className="text-gray-600 mb-6">
            Start a conversation with your contacts to begin messaging.
          </p>
          <button
            onClick={handleBackToContacts}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Go to Contacts
          </button>
        </div>
      </div>
    );
  }

  if (!chatId || !activeChat) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Select a chat to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50">
      <ChatWindow />
    </div>
  );
};
