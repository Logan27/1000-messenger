import { useEffect, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useChatStore } from '../../store/chatStore';
import { apiService } from '../../services/api.service';
import { ChatWindow } from './ChatWindow';

export const ChatLayout = () => {
  const { setChats } = useChatStore();

  const loadChats = useCallback(async () => {
    try {
      const response = await apiService.getChats();
      setChats(response.data || []);
    } catch (error) {
      console.error('Failed to load chats:', error);
    }
  }, [setChats]);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-80 bg-white border-r border-gray-200">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Chats</h2>
        </div>
        <div className="overflow-y-auto">
          {/* Chat list would go here */}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<ChatWindow />} />
          <Route path="/chat/:chatId" element={<ChatWindow />} />
        </Routes>
      </div>
    </div>
  );
};
