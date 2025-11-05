import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchBar } from '../components/common';
import { MessageSearchResults } from '../components/search/MessageSearchResults';
import { UserSearch } from '../components/contacts/UserSearch';
import { apiService, Message, Chat } from '../services/api.service';
import { useChatStore } from '../store/chatStore';

type SearchTab = 'messages' | 'users';

export const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SearchTab>('messages');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [selectedChatFilter, setSelectedChatFilter] = useState<string>('');
  const { chats } = useChatStore();

  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Perform search
  const performSearch = useCallback(
    async (query: string, chatId?: string, resetResults = true) => {
      if (!query.trim()) {
        setResults([]);
        setHasMore(false);
        setCursor(undefined);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await apiService.searchMessages(
          query,
          chatId,
          50 // limit per page
        );

        if (resetResults) {
          setResults(response.data);
        } else {
          setResults((prev) => [...prev, ...response.data]);
        }

        setCursor(response.cursor);
        setHasMore(response.hasMore || false);
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || err.message || 'Failed to search messages';
        setError(errorMessage);
        if (resetResults) {
          setResults([]);
        }
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Handle search query change
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      performSearch(query, selectedChatFilter || undefined, true);
    },
    [performSearch, selectedChatFilter]
  );

  // Handle clear search
  const handleClear = useCallback(() => {
    setSearchQuery('');
    setResults([]);
    setHasMore(false);
    setCursor(undefined);
    setError(null);
  }, []);

  // Handle chat filter change
  const handleChatFilterChange = (chatId: string) => {
    setSelectedChatFilter(chatId);
    if (searchQuery) {
      performSearch(searchQuery, chatId || undefined, true);
    }
  };

  // Handle result click - navigate to message in chat
  const handleResultClick = useCallback(
    (message: Message) => {
      // Navigate to the chat with the message highlighted
      navigate(`/chat/${message.chatId}?messageId=${message.id}`);
    },
    [navigate]
  );

  // Load more results (infinite scroll)
  const loadMore = useCallback(() => {
    if (!isLoading && hasMore && cursor && searchQuery) {
      // For pagination, we need to modify the API to support cursor
      // For now, this is a placeholder
      console.log('Load more not fully implemented - needs cursor support in API');
    }
  }, [isLoading, hasMore, cursor, searchQuery]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore, isLoading, loadMore]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Search</h1>
            <button
              onClick={() => navigate(-1)}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
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

          {/* Tabs */}
          <div className="flex space-x-4 border-b border-gray-200 mb-4">
            <button
              onClick={() => setActiveTab('messages')}
              className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'messages'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Messages
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'users'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Users
            </button>
          </div>

          {/* Search Bar - Only for Messages tab */}
          {activeTab === 'messages' && (
            <>
              <SearchBar
                placeholder="Search messages..."
                onSearch={handleSearch}
                onClear={handleClear}
                debounceMs={400}
                minLength={2}
                autoFocus
              />

              {/* Chat Filter Dropdown */}
              {chats.length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by chat
                  </label>
                  <select
                    value={selectedChatFilter}
                    onChange={(e) => handleChatFilterChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All chats</option>
                    {chats.map((chat) => (
                      <option key={chat.id} value={chat.id}>
                        {chat.name || 'Direct Message'}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mx-6 mt-4 max-w-4xl mx-auto">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800 font-medium text-sm"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Results Count */}
      {searchQuery && results.length > 0 && !isLoading && (
        <div className="px-6 py-3 bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto">
            <p className="text-sm text-gray-600">
              Found {results.length} {results.length === 1 ? 'message' : 'messages'}
              {selectedChatFilter && ' in selected chat'}
              {hasMore && ' (showing first results)'}
            </p>
          </div>
        </div>
      )}

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-4xl mx-auto">
          {activeTab === 'users' ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <UserSearch />
            </div>
          ) : !searchQuery ? (
            <div className="flex flex-col items-center justify-center p-12 text-gray-500">
              <svg
                className="w-20 h-20 mb-4 text-gray-300"
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
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Search your messages
              </h2>
              <p className="text-center text-gray-500">
                Type at least 2 characters to start searching
              </p>
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md">
                <h3 className="font-medium text-blue-900 mb-2">Search tips:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Use keywords from message content</li>
                  <li>• Filter by specific chat to narrow results</li>
                  <li>• Click on a result to jump to that message</li>
                </ul>
              </div>
            </div>
          ) : (
            <>
              <MessageSearchResults
                results={results}
                isLoading={isLoading}
                searchQuery={searchQuery}
                onResultClick={handleResultClick}
                emptyMessage="No messages found matching your search"
              />

              {/* Load More Trigger */}
              {hasMore && (
                <div ref={loadMoreRef} className="py-4 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading more results...</p>
                </div>
              )}

              {/* End of Results */}
              {!isLoading && !hasMore && results.length > 0 && (
                <div className="py-8 text-center text-gray-500">
                  <p className="text-sm">End of search results</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
