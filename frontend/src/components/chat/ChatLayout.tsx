import React, { useEffect, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useChatStore } from '../../store/chatStore';
import { apiService } from '../../services/api.service';
import { ChatWindow } from './ChatWindow';

export const ChatLayout: React.FC = () => {
  const { chats, setChats } = useChatStore();

  const loadChats = useCallback(async () => {
    try {
      const data = await apiService.getChats();
      setChats(data);
    } catch (error) {
      console.error('Failed to load chats:', error);
    }
  }, [setChats]);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold">Chats</h1>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
              onClick={() => window.location.href = `/chat/${chat.id}`}
            >
              <div className="flex items-center">
                <div className="flex-1">
                  <h3 className="font-semibold">{chat.name || 'Chat'}</h3>
                  {chat.lastMessage && (
                    <p className="text-sm text-gray-500 truncate">
                      {chat.lastMessage.content}
                    </p>
                  )}
                </div>
                {chat.unreadCount > 0 && (
                  <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                    {chat.unreadCount}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <Routes>
          <Route path="/chat/:chatId" element={<ChatWindow />} />
          <Route
            path="/"
            element={
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Select a chat to start messaging
              </div>
            }
          />
        </Routes>
      </div>
    </div>
  );
};
