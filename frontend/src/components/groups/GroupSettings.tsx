import { useState } from 'react';
import { apiService } from '../../services/api.service';
import { useChatStore } from '../../store/chatStore';
import type { Chat } from '../../services/api.service';

interface GroupSettingsProps {
  chat: Chat;
  currentUserId: string;
  onClose: () => void;
  onLeave?: () => void;
  onDelete?: () => void;
}

export const GroupSettings: React.FC<GroupSettingsProps> = ({
  chat,
  currentUserId,
  onClose,
  onLeave,
  onDelete,
}) => {
  const [groupName, setGroupName] = useState(chat.name || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const updateChat = useChatStore(state => state.updateChat);
  const removeChat = useChatStore(state => state.removeChat);

  const currentParticipant = chat.participants.find(p => p.userId === currentUserId);
  const isOwner = currentParticipant?.role === 'owner';
  const isAdmin = currentParticipant?.role === 'admin';
  const canManage = isOwner || isAdmin;

  const handleSave = async () => {
    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedChat = await apiService.updateGroupChat(chat.id, { name: groupName.trim() });
      updateChat(chat.id, updatedChat);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update group');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await apiService.leaveChat(chat.id);
      removeChat(chat.id);
      onLeave?.();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to leave group');
    } finally {
      setIsLoading(false);
      setShowLeaveConfirm(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await apiService.deleteGroupChat(chat.id);
      removeChat(chat.id);
      onDelete?.();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete group');
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Group Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
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
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Group Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Group Name</label>
            {isEditing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={100}
                  disabled={isLoading}
                />
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSave}
                    className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                    disabled={isLoading || !groupName.trim()}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setGroupName(chat.name || '');
                      setIsEditing(false);
                      setError(null);
                    }}
                    className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-gray-900">{chat.name}</p>
                {canManage && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Edit
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Participants Count */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Participants</label>
            <p className="text-gray-900">{chat.participants.length} member{chat.participants.length !== 1 && 's'}</p>
          </div>

          {/* Your Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Role</label>
            <p className="text-gray-900 capitalize">{currentParticipant?.role || 'Member'}</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Footer - Actions */}
        <div className="px-6 py-4 border-t border-gray-200 space-y-2">
          {!showLeaveConfirm && !showDeleteConfirm && (
            <>
              <button
                onClick={() => setShowLeaveConfirm(true)}
                className="w-full px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                disabled={isLoading}
              >
                Leave Group
              </button>
              {isOwner && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
                  disabled={isLoading}
                >
                  Delete Group
                </button>
              )}
            </>
          )}

          {/* Leave Confirmation */}
          {showLeaveConfirm && (
            <div className="space-y-2">
              <p className="text-sm text-gray-700">
                Are you sure you want to leave this group?
                {isOwner && ' Ownership will be transferred to another admin or member.'}
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleLeave}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-gray-400"
                  disabled={isLoading}
                >
                  {isLoading ? 'Leaving...' : 'Confirm Leave'}
                </button>
                <button
                  onClick={() => setShowLeaveConfirm(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  disabled={isLoading}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div className="space-y-2">
              <p className="text-sm text-gray-700">
                Are you sure you want to delete this group? This action cannot be undone and all
                members will lose access.
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-700 rounded-md hover:bg-red-800 disabled:bg-gray-400"
                  disabled={isLoading}
                >
                  {isLoading ? 'Deleting...' : 'Confirm Delete'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  disabled={isLoading}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
