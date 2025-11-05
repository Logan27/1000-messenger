import React, { useState } from 'react';
import { useChatStore } from '../../store/chatStore';
import { GroupSettings } from '../groups/GroupSettings';
import { ParticipantList } from '../groups/ParticipantList';
import { useAuthStore } from '../../store/authStore';
import { Avatar } from '../common/Avatar';

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
      <div className="bg-white border-b border-secondary-100 shadow-soft p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full animate-pulse"></div>
          <div>
            <h2 className="font-semibold text-secondary-900">Loading...</h2>
            <p className="text-sm text-secondary-500">Connecting...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white border-b border-secondary-100 shadow-soft p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar
              name={chat.name || 'Direct Message'}
              size="md"
              status="online"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-secondary-900">
                  {chat.name || 'Direct Message'}
                </h2>
                {chat.type === 'group' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                    {chat.participants.length}
                  </span>
                )}
              </div>
              <p className="text-sm text-secondary-500">
                {chat.type === 'group' ? (
                  <button
                    onClick={() => setShowParticipants(true)}
                    className="hover:text-primary-600 transition-colors duration-200"
                  >
                    {chat.participants.length} member{chat.participants.length !== 1 ? 's' : ''}
                  </button>
                ) : (
                  <span className="text-success-500">Online</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Copy Link Button (T226) */}
            <button
              onClick={() => {
                const url = chat.type === 'group' && chat.slug
                  ? `${window.location.origin}/chat/slug/${chat.slug}`
                  : `${window.location.origin}/chat/${chat.id}`;
                navigator.clipboard.writeText(url);
                // TODO: Show toast notification
                console.log('Link copied to clipboard');
              }}
              className="btn-icon text-secondary-500 hover:text-primary-600 hover:bg-primary-50"
              aria-label="Copy chat link"
              title="Copy link"
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
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
            </button>

            {/* Settings Button for Groups */}
            {chat.type === 'group' && user && (
              <button
                onClick={() => setShowSettings(true)}
                className="btn-icon text-secondary-500 hover:text-primary-600 hover:bg-primary-50"
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
        <div className="modal-overlay">
          <div className="modal-content max-w-md">
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
