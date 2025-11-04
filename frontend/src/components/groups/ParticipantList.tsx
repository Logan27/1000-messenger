import { useState } from 'react';
import { apiService } from '../../services/api.service';
import { useChatStore } from '../../store/chatStore';
import type { Chat, ChatParticipant } from '../../services/api.service';

interface ParticipantListProps {
  chat: Chat;
  currentUserId: string;
  onClose?: () => void;
}

export const ParticipantList: React.FC<ParticipantListProps> = ({
  chat,
  currentUserId,
  onClose,
}) => {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<string | null>(null);

  const updateChat = useChatStore(state => state.updateChat);

  const currentParticipant = chat.participants.find(p => p.userId === currentUserId);
  const isOwner = currentParticipant?.role === 'owner';
  const isAdmin = currentParticipant?.role === 'admin';
  const canManage = isOwner || isAdmin;

  const handleRemoveParticipant = async (userId: string) => {
    setIsLoading(userId);
    setError(null);

    try {
      await apiService.removeParticipant(chat.id, userId);
      
      // Update local state
      updateChat(chat.id, {
        participants: chat.participants.filter(p => p.userId !== userId),
      });

      setShowRemoveConfirm(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to remove participant');
    } finally {
      setIsLoading(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Participants ({chat.participants.length})
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Participants List */}
      <div className="max-h-96 overflow-y-auto">
        {chat.participants.map((participant: ChatParticipant) => (
          <div
            key={participant.id}
            className="px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
          >
            {showRemoveConfirm === participant.userId ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-700">
                  Remove {participant.user?.displayName || participant.user?.username || 'this participant'} from the
                  group?
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleRemoveParticipant(participant.userId)}
                    className="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-gray-400"
                    disabled={!!isLoading}
                  >
                    {isLoading === participant.userId ? 'Removing...' : 'Confirm'}
                  </button>
                  <button
                    onClick={() => setShowRemoveConfirm(null)}
                    className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    disabled={!!isLoading}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {/* Avatar */}
                  {participant.user?.avatarUrl ? (
                    <img
                      src={participant.user.avatarUrl}
                      alt={participant.user.displayName}
                      className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                      {(participant.user?.displayName || participant.user?.username || '?')
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {participant.user?.displayName || participant.user?.username || 'Unknown User'}
                        {participant.userId === currentUserId && (
                          <span className="ml-1 text-gray-500">(You)</span>
                        )}
                      </p>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(
                          participant.role
                        )}`}
                      >
                        {participant.role}
                      </span>
                    </div>
                    {participant.user?.username && (
                      <p className="text-xs text-gray-500 truncate">@{participant.user.username}</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {canManage &&
                  participant.userId !== currentUserId &&
                  participant.role !== 'owner' && (
                    <button
                      onClick={() => setShowRemoveConfirm(participant.userId)}
                      className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors flex-shrink-0"
                      disabled={!!isLoading}
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
