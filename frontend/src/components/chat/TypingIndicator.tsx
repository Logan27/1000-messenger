import React from 'react';

interface TypingIndicatorProps {
  users: string[];
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ users }) => {
  if (users.length === 0) return null;

  return (
    <div className="px-4 py-3 bg-white border-t border-secondary-100">
      <div className="flex items-center gap-2">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"></div>
          <div
            className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"
            style={{ animationDelay: '0.1s' }}
          ></div>
          <div
            className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"
            style={{ animationDelay: '0.2s' }}
          ></div>
        </div>
        <span className="text-sm text-secondary-600 font-medium">
          {users.length === 1
            ? `${users[0]} is typing...`
            : `${users.length} people are typing...`}
        </span>
      </div>
    </div>
  );
};
