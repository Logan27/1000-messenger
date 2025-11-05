import React from 'react';
import { Message } from '../../services/api.service';
import { Avatar } from '../common';
import { formatDistanceToNow } from 'date-fns';

export interface MessageSearchResultsProps {
  results: Message[];
  isLoading: boolean;
  searchQuery: string;
  onResultClick: (message: Message) => void;
  emptyMessage?: string;
}

/**
 * MessageSearchResults component - Displays search results for messages
 *
 * @example
 * ```tsx
 * <MessageSearchResults
 *   results={searchResults}
 *   isLoading={isSearching}
 *   searchQuery="hello"
 *   onResultClick={handleResultClick}
 * />
 * ```
 */
export const MessageSearchResults: React.FC<MessageSearchResultsProps> = ({
  results,
  isLoading,
  searchQuery,
  onResultClick,
  emptyMessage = 'No messages found',
}) => {
  const highlightText = (text: string, query: string): JSX.Element => {
    if (!query.trim()) {
      return <>{text}</>;
    }

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <>
        {parts.map((part, index) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark
              key={index}
              className="bg-yellow-200 text-secondary-900 font-medium rounded px-0.5"
            >
              {part}
            </mark>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </>
    );
  };

  const formatTimestamp = (timestamp: string): string => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'Unknown time';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-secondary-600">Searching...</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-secondary-500">
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
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <p className="text-center">{emptyMessage}</p>
        {searchQuery && (
          <p className="text-sm text-gray-400 mt-2">
            No results for &quot;{searchQuery}&quot;
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {results.map((message) => (
        <button
          key={message.id}
          onClick={() => onResultClick(message)}
          className="w-full text-left p-4 bg-white border border-secondary-200 rounded-xl hover:bg-secondary-50 hover:border-blue-300 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <div className="flex items-start space-x-3">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <Avatar
                avatarUrl={message.sender?.avatarUrl}
                name={message.sender?.displayName || message.sender?.username || 'User'}
                size="sm"
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Header: Sender and Timestamp */}
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-secondary-900 truncate">
                  {message.sender?.displayName || message.sender?.username || 'Unknown User'}
                </p>
                <span className="text-xs text-secondary-500 ml-2 flex-shrink-0">
                  {formatTimestamp(message.createdAt)}
                </span>
              </div>

              {/* Message Content with Highlighting */}
              <p className="text-sm text-secondary-700 line-clamp-2">
                {highlightText(message.content, searchQuery)}
              </p>

              {/* Chat Info */}
              <div className="flex items-center space-x-2 mt-2">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <span className="text-xs text-secondary-500 truncate">
                  {/* Chat name would be displayed here if available */}
                  Chat
                </span>
              </div>

              {/* Edited Indicator */}
              {message.isEdited && (
                <span className="text-xs text-gray-400 italic mt-1 block">
                  (edited)
                </span>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};
