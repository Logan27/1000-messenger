import React, { useMemo } from 'react';
import { Avatar } from '../common';
import { Contact } from '../../store/contactStore';

interface ContactListProps {
  contacts: Contact[];
  onContactClick: (contactId: string) => void;
  selectedContactId?: string;
  isLoading?: boolean;
  emptyMessage?: string;
}

export const ContactList: React.FC<ContactListProps> = ({
  contacts,
  onContactClick,
  selectedContactId,
  isLoading = false,
  emptyMessage = 'No contacts yet',
}) => {
  // Sort contacts: online first, then by username alphabetically
  const sortedContacts = useMemo(() => {
    return [...contacts].sort((a, b) => {
      // Online status priority: online > away > offline
      const statusPriority = { online: 0, away: 1, offline: 2 };
      const statusDiff = statusPriority[a.status] - statusPriority[b.status];
      
      if (statusDiff !== 0) {
        return statusDiff;
      }
      
      // If same status, sort alphabetically by display name or username
      const nameA = (a.displayName || a.username).toLowerCase();
      const nameB = (b.displayName || b.username).toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [contacts]);

  const getStatusColor = (status: Contact['status']) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  const formatLastSeen = (lastSeen?: string) => {
    if (!lastSeen) return 'Never';
    
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-gray-500">
        <svg
          className="w-16 h-16 mb-4 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <p className="text-center">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto">
      {sortedContacts.map((contact) => (
        <button
          key={contact.id}
          onClick={() => onContactClick(contact.id)}
          className={`w-full flex items-center space-x-3 p-3 hover:bg-gray-50 transition-colors ${
            selectedContactId === contact.id ? 'bg-blue-50 hover:bg-blue-100' : ''
          } ${contact.isBlocked ? 'opacity-50' : ''}`}
          disabled={contact.isBlocked}
        >
          <div className="relative">
            <Avatar
              avatarUrl={contact.avatarUrl}
              name={contact.displayName || contact.username}
              size="md"
            />
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(
                contact.status
              )}`}
              aria-label={`Status: ${contact.status}`}
            />
          </div>
          
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900 truncate">
                {contact.displayName || contact.username}
              </p>
              {contact.status === 'offline' && contact.lastSeen && (
                <span className="text-xs text-gray-500">
                  {formatLastSeen(contact.lastSeen)}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <p className="text-xs text-gray-500 truncate">@{contact.username}</p>
              {contact.isBlocked && (
                <span className="text-xs text-red-600 font-medium">Blocked</span>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};
