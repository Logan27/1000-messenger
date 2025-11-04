import { useState } from 'react';
import { Avatar } from '../common/Avatar';
import { Button } from '../common/Button';
import type { Contact } from '../../services/api.service';

interface ContactRequestProps {
  request: Contact;
  onAccept: (contactId: string) => void;
  onReject: (contactId: string) => void;
}

export const ContactRequest = ({ request, onAccept, onReject }: ContactRequestProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      await onAccept(request.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    try {
      await onReject(request.id);
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    }
  };

  return (
    <div className="flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors">
      {/* Avatar */}
      <Avatar
        src={request.contact?.avatarUrl}
        alt={request.contact?.displayName || request.contact?.username || 'User'}
        size="md"
        status={request.contact?.status}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* User info and timestamp */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {request.contact?.displayName || request.contact?.username || 'Unknown User'}
            </h3>
            {request.contact?.username && request.contact?.displayName && (
              <p className="text-sm text-gray-500 truncate">@{request.contact.username}</p>
            )}
          </div>
          <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
            {getTimeAgo(request.createdAt)}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleAccept}
            disabled={isLoading}
            className="flex-1"
          >
            Accept
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleReject}
            disabled={isLoading}
            className="flex-1"
          >
            Reject
          </Button>
        </div>
      </div>
    </div>
  );
};
