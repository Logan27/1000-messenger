import React, { useState } from 'react';
import { useChatStore } from '../../store/chatStore';
import { GroupSettings } from '../groups/GroupSettings';
import { ParticipantList } from '../groups/ParticipantList';
import { useAuthStore } from '../../store/authStore';

interface ChatHeaderProps {
  chatId: string;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ chatId }) => {
  const { chats } = useChatStore();
  const { user } = useAuthStore();
  const chat = chats.find(c => c.id === chatId);
  const [showSettings, setShowSettings] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);

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
    <>
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium">
                {chat.name ? chat.name.charAt(0).toUpperCase() : 'C'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold">{chat.name || 'Direct Message'}</h2>
                {chat.type === 'group' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {chat.participants.length}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">
                {chat.type === 'group' ? (
                  <button
                    onClick={() => setShowParticipants(true)}
                    className="hover:underline"
                  >
                    {chat.participants.length} member{chat.participants.length !== 1 ? 's' : ''}
                  </button>
                ) : (
                  'Online'
                )}
              </p>
            </div>
          </div>

          {/* Settings Button for Groups */}
          {chat.type === 'group' && user && (
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Group settings"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Modals */}
      {showSettings && user && (
        <GroupSettings
          chat={chat}
          currentUserId={user.id}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showParticipants && user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full">
            <ParticipantList
              chat={chat}
              currentUserId={user.id}
              onClose={() => setShowParticipants(false)}
            />
          </div>
        </div>
      )}
    </>
  );
};
