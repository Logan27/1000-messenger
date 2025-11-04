import React, { useState, useEffect, useCallback } from 'react';
import { Avatar, Button } from '../common';
import { useContactStore } from '../../store/contactStore';
import axios from 'axios';
import { config } from '../../config';

// Create axios instance with auth interceptor
const api = axios.create({
  baseURL: config.API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface SearchResult {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  isContact?: boolean;
  hasPendingRequest?: boolean;
}

interface UserSearchProps {
  placeholder?: string;
  minSearchLength?: number;
  debounceMs?: number;
}

export const UserSearch: React.FC<UserSearchProps> = ({
  placeholder = 'Search users by username...',
  minSearchLength = 2,
  debounceMs = 300,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendingRequests, setSendingRequests] = useState<Set<string>>(new Set());

  const { sendRequest } = useContactStore();

  // Debounced search function
  const searchUsers = useCallback(
    async (searchQuery: string) => {
      if (searchQuery.length < minSearchLength) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      setError(null);

      try {
        const response = await api.get('/users/search', {
          params: { q: searchQuery, limit: 20 },
        });

        setResults(response.data.users || []);
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || err.message || 'Failed to search users';
        setError(errorMessage);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [minSearchLength]
  );

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, searchUsers, debounceMs]);

  const handleSendRequest = async (userId: string) => {
    setSendingRequests((prev) => new Set(prev).add(userId));
    setError(null);

    try {
      await sendRequest(userId);
      
      // Update the result to show pending request
      setResults((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, hasPendingRequest: true } : user
        )
      );
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to send contact request';
      setError(errorMessage);
    } finally {
      setSendingRequests((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <svg
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
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
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Search Results */}
      {query.length >= minSearchLength && (
        <div className="space-y-2">
          {results.length === 0 && !isSearching && (
            <p className="text-center text-gray-500 py-8">
              No users found matching "{query}"
            </p>
          )}

          {results.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <Avatar
                  avatarUrl={user.avatarUrl}
                  name={user.displayName || user.username}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.displayName || user.username}
                  </p>
                  <p className="text-xs text-gray-500 truncate">@{user.username}</p>
                </div>
              </div>

              <div className="ml-3">
                {user.isContact ? (
                  <span className="text-sm text-gray-500 font-medium">Already a contact</span>
                ) : user.hasPendingRequest ? (
                  <span className="text-sm text-blue-600 font-medium">Request sent</span>
                ) : (
                  <Button
                    onClick={() => handleSendRequest(user.id)}
                    disabled={sendingRequests.has(user.id)}
                    size="sm"
                  >
                    {sendingRequests.has(user.id) ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Sending...</span>
                      </div>
                    ) : (
                      'Add Contact'
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Helper Text */}
      {query.length > 0 && query.length < minSearchLength && (
        <p className="text-sm text-gray-500 text-center">
          Type at least {minSearchLength} characters to search
        </p>
      )}
    </div>
  );
};
