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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Create Group Chat</h2>
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
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 py-4 space-y-4 flex-shrink-0">
            {/* Group Name Input */}
            <div>
              <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-1">
                Group Name
              </label>
              <input
                type="text"
                id="groupName"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter group name"
                maxLength={100}
                disabled={isLoading}
              />
            </div>

            {/* Search Input */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Add Participants
              </label>
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search contacts..."
                disabled={isLoading}
              />
            </div>

            {/* Selected Count */}
            <div className="text-sm text-gray-600">
              {selectedParticipants.length} participant{selectedParticipants.length !== 1 && 's'}{' '}
              selected
            </div>
          </div>

          {/* Participants List */}
          <div className="flex-1 overflow-y-auto px-6 py-2">
            <div className="space-y-2">
              {filteredContacts.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No contacts found</p>
              ) : (
                filteredContacts.map(contact => (
                  <label
                    key={contact.id}
                    className="flex items-center p-2 hover:bg-gray-50 rounded-md cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedParticipants.includes(contact.id)}
                      onChange={() => toggleParticipant(contact.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      disabled={isLoading}
                    />
                    <div className="ml-3 flex items-center flex-1">
                      {contact.avatarUrl ? (
                        <img
                          src={contact.avatarUrl}
                          alt={contact.displayName}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                          {contact.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{contact.displayName}</p>
                        <p className="text-xs text-gray-500">@{contact.username}</p>
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="px-6 py-2">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
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
