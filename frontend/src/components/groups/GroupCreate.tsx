import { useState } from 'react';
import { apiService } from '../../services/api.service';
import { useChatStore } from '../../store/chatStore';

interface GroupCreateProps {
  onClose: () => void;
  onSuccess?: (chatId: string) => void;
  contacts: Array<{ id: string; username: string; displayName: string; avatarUrl?: string }>;
}

export const GroupCreate: React.FC<GroupCreateProps> = ({ onClose, onSuccess, contacts }) => {
  const [groupName, setGroupName] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addChat = useChatStore(state => state.addChat);

  const filteredContacts = contacts.filter(
    contact =>
      contact.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleParticipant = (userId: string) => {
    setSelectedParticipants(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }

    if (selectedParticipants.length === 0) {
      setError('Select at least one participant');
      return;
    }

    if (selectedParticipants.length > 299) {
      setError('Maximum 300 participants allowed');
      return;
    }

    setIsLoading(true);

    try {
      const chat = await apiService.createGroupChat(groupName.trim(), selectedParticipants);
      addChat(chat);
      onSuccess?.(chat.id);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create group');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="bg-white rounded-2xl shadow-telegram max-w-md w-full max-h-[90vh] flex flex-col">
        {/* Header - Telegram style */}
        <div className="px-6 py-4 border-b border-secondary-100 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-secondary-900">Create Group Chat</h2>
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
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 py-4 space-y-4 flex-shrink-0">
            {/* Group Name Input */}
            <div>
              <label htmlFor="groupName" className="block text-sm font-medium text-secondary-700 mb-2">
                Group Name
              </label>
              <input
                type="text"
                id="groupName"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                className="input-field"
                placeholder="Enter group name"
                maxLength={100}
                disabled={isLoading}
              />
            </div>

            {/* Search Input */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-secondary-700 mb-2">
                Add Participants
              </label>
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input-field"
                placeholder="Search contacts..."
                disabled={isLoading}
              />
            </div>

            {/* Selected Count */}
            <div className="text-sm text-secondary-600 font-medium">
              {selectedParticipants.length} participant{selectedParticipants.length !== 1 && 's'}{' '}
              selected
            </div>
          </div>

          {/* Participants List - Telegram style */}
          <div className="flex-1 overflow-y-auto px-6 py-2">
            <div className="space-y-2">
              {filteredContacts.length === 0 ? (
                <p className="text-sm text-secondary-500 text-center py-4">No contacts found</p>
              ) : (
                filteredContacts.map(contact => (
                  <label
                    key={contact.id}
                    className="flex items-center p-3 hover:bg-secondary-50 rounded-xl cursor-pointer transition-all duration-200"
                  >
                    <input
                      type="checkbox"
                      checked={selectedParticipants.includes(contact.id)}
                      onChange={() => toggleParticipant(contact.id)}
                      className="h-5 w-5 text-primary-500 focus:ring-primary-400 border-secondary-300 rounded"
                      disabled={isLoading}
                    />
                    <div className="ml-3 flex items-center flex-1">
                      {contact.avatarUrl ? (
                        <img
                          src={contact.avatarUrl}
                          alt={contact.displayName}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-medium shadow-soft">
                          {contact.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="ml-3">
                        <p className="text-sm font-medium text-secondary-900">{contact.displayName}</p>
                        <p className="text-xs text-secondary-500">@{contact.username}</p>
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Error Message - Telegram style */}
          {error && (
            <div className="px-6 py-2">
              <p className="text-sm text-error-600 font-medium">{error}</p>
            </div>
          )}

          {/* Footer - Telegram style */}
          <div className="px-6 py-4 border-t border-secondary-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-secondary-700 bg-secondary-100 rounded-xl hover:bg-secondary-200 transition-all duration-200"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-medium text-white bg-primary-500 rounded-xl hover:bg-primary-600 transition-all duration-200 disabled:bg-secondary-300 disabled:cursor-not-allowed shadow-soft hover:shadow-medium"
              disabled={isLoading || !groupName.trim() || selectedParticipants.length === 0}
            >
              {isLoading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
