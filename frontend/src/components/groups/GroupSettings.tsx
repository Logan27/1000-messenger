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
    <div className="modal-overlay">
      <div className="bg-white rounded-2xl shadow-telegram max-w-lg w-full max-h-[90vh] flex flex-col">
        {/* Header - Telegram style */}
        <div className="px-6 py-4 border-b border-secondary-100 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-secondary-900">Group Settings</h2>
          <button
            onClick={onClose}
            className="btn-icon text-secondary-400 hover:text-secondary-600"
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

        {/* Content - Telegram style */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Group Name */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">Group Name</label>
            {isEditing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  className="input-field"
                  maxLength={100}
                  disabled={isLoading}
                />
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-xl hover:bg-primary-600 disabled:bg-secondary-300 shadow-soft transition-all duration-200"
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
                    className="px-4 py-2 text-sm font-medium text-secondary-700 bg-secondary-100 rounded-xl hover:bg-secondary-200 transition-all duration-200"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-secondary-50 rounded-xl">
                <p className="text-secondary-900 font-medium">{chat.name}</p>
                {canManage && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200"
                  >
                    Edit
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Participants Count */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">Participants</label>
            <p className="text-secondary-900 p-3 bg-secondary-50 rounded-xl font-medium">
              {chat.participants.length} member{chat.participants.length !== 1 && 's'}
            </p>
          </div>

          {/* Your Role */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">Your Role</label>
            <p className="text-secondary-900 p-3 bg-secondary-50 rounded-xl font-medium capitalize">
              {currentParticipant?.role || 'Member'}
            </p>
          </div>

          {/* Error Message - Telegram style */}
          {error && (
            <div className="p-4 bg-error-50 border border-error-200 rounded-xl animate-slide-down">
              <p className="text-sm text-error-700 font-medium">{error}</p>
            </div>
          )}
        </div>

        {/* Footer - Actions - Telegram style */}
        <div className="px-6 py-4 border-t border-secondary-100 space-y-2">
          {!showLeaveConfirm && !showDeleteConfirm && (
            <>
              <button
                onClick={() => setShowLeaveConfirm(true)}
                className="w-full px-4 py-3 text-sm font-medium text-error-600 bg-error-50 rounded-xl hover:bg-error-100 transition-all duration-200"
                disabled={isLoading}
              >
                Leave Group
              </button>
              {isOwner && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full px-4 py-3 text-sm font-medium text-error-700 bg-error-100 rounded-xl hover:bg-error-200 transition-all duration-200"
                  disabled={isLoading}
                >
                  Delete Group
                </button>
              )}
            </>
          )}

          {/* Leave Confirmation - Telegram style */}
          {showLeaveConfirm && (
            <div className="space-y-3">
              <p className="text-sm text-secondary-700">
                Are you sure you want to leave this group?
                {isOwner && ' Ownership will be transferred to another admin or member.'}
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleLeave}
                  className="flex-1 px-4 py-3 text-sm font-medium text-white bg-error-600 rounded-xl hover:bg-error-700 disabled:bg-secondary-400 shadow-soft transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? 'Leaving...' : 'Confirm Leave'}
                </button>
                <button
                  onClick={() => setShowLeaveConfirm(false)}
                  className="flex-1 px-4 py-3 text-sm font-medium text-secondary-700 bg-secondary-100 rounded-xl hover:bg-secondary-200 transition-all duration-200"
                  disabled={isLoading}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Delete Confirmation - Telegram style */}
          {showDeleteConfirm && (
            <div className="space-y-3">
              <p className="text-sm text-secondary-700">
                Are you sure you want to delete this group? This action cannot be undone and all
                members will lose access.
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-3 text-sm font-medium text-white bg-error-700 rounded-xl hover:bg-error-800 disabled:bg-secondary-400 shadow-soft transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? 'Deleting...' : 'Confirm Delete'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-3 text-sm font-medium text-secondary-700 bg-secondary-100 rounded-xl hover:bg-secondary-200 transition-all duration-200"
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
