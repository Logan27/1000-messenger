import React, { useState, useEffect, useCallback } from 'react';

export interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  onClear?: () => void;
  debounceMs?: number;
  minLength?: number;
  autoFocus?: boolean;
  className?: string;
}

/**
 * SearchBar component - Reusable search input with debouncing
 *
 * @example
 * ```tsx
 * <SearchBar
 *   placeholder="Search messages..."
 *   onSearch={handleSearch}
 *   onClear={handleClear}
 *   debounceMs={300}
 *   minLength={2}
 * />
 * ```
 */
export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search...',
  onSearch,
  onClear,
  debounceMs = 300,
  minLength = 1,
  autoFocus = false,
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Debounced search effect
  useEffect(() => {
    if (query.length === 0) {
      onClear?.();
      return;
    }

    if (query.length < minLength) {
      return;
    }

    const timer = setTimeout(() => {
      onSearch(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, onSearch, onClear, debounceMs, minLength]);

  const handleClear = useCallback(() => {
    setQuery('');
    onClear?.();
  }, [onClear]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      handleClear();
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Icon */}
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <svg
          className={`w-5 h-5 transition-colors ${
            isFocused ? 'text-blue-500' : 'text-gray-400'
          }`}
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
      </div>

      {/* Input Field */}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={`
          w-full pl-10 pr-10 py-2
          border border-gray-300 rounded-lg
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          transition-all duration-200
          ${isFocused ? 'shadow-md' : 'shadow-sm'}
        `}
      />

      {/* Clear Button */}
      {query.length > 0 && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 transform -translate-y-1/2
                     text-gray-400 hover:text-gray-600
                     focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full
                     transition-colors p-1"
          aria-label="Clear search"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}

      {/* Helper Text */}
      {query.length > 0 && query.length < minLength && (
        <div className="absolute top-full left-0 right-0 mt-1">
          <p className="text-xs text-gray-500">
            Type at least {minLength} characters to search
          </p>
        </div>
      )}
    </div>
  );
};
