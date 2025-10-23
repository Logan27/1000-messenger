import React from 'react';
import { useChatStore } from '../../store/chatStore';

interface ChatHeaderProps {
  chatId: string;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ chatId }) => {
  const { chats } = useChatStore();
  const chat = chats.find(c => c.id === chatId);

  if (!chat) {
    return (
      <div className="bg-white border-b p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
          <div>
            <h2 className="font-semibold">Loading...</h2>
            <p className="text-sm text-gray-500">Connecting...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-b p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
          <span className="text-sm font-medium">
            {chat.name ? chat.name.charAt(0).toUpperCase() : 'C'}
          </span>
        </div>
        <div>
          <h2 className="font-semibold">{chat.name || 'Direct Message'}</h2>
          <p className="text-sm text-gray-500">
            {chat.type === 'group' ? `${chat.participants.length} members` : 'Online'}
          </p>
        </div>
      </div>
    </div>
  );
};
