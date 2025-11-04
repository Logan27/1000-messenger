import React, { useEffect, useRef, memo } from 'react';
import { Message } from './Message';

interface MessageMetadata {
  images?: Array<{
    url: string;
    thumbnailUrl: string;
    originalUrl: string;
  }>;
  [key: string]: unknown;
}

interface MessageListProps {
  messages: Array<{
    id: string;
    senderId: string;
    content: string;
    contentType: string;
    metadata?: Record<string, unknown>;
    createdAt: string;
    isEdited: boolean;
    reactions?: Array<{ id: string; emoji: string; userId: string }>;
  }>;
  highlightedMessageId?: string | null;
}

const MessageListComponent: React.FC<MessageListProps> = ({ messages, highlightedMessageId }) => {
  return (
    <div className="space-y-4">
      {messages.map(message => {
        const isHighlighted = message.id === highlightedMessageId;

        // System messages get special rendering
        if (message.contentType === 'system') {
          return (
            <div
              key={message.id}
              id={`message-${message.id}`}
              className="flex justify-center py-2"
            >
              <div className="bg-gray-100 text-gray-600 text-sm px-4 py-2 rounded-full">
                {message.content}
              </div>
            </div>
          );
        }

        // Regular messages
        return (
          <div
            key={message.id}
            id={`message-${message.id}`}
            className={`transition-all duration-300 ${
              isHighlighted
                ? 'ring-2 ring-blue-500 rounded-lg p-2 bg-blue-50'
                : ''
            }`}
          >
            <Message
              message={message}
              senderName="User" // This would come from user data
              senderAvatar={undefined}
            />
          </div>
        );
      })}
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
// Only re-render if messages or highlightedMessageId change
export const MessageList = memo(MessageListComponent, (prevProps, nextProps) => {
  return (
    prevProps.messages.length === nextProps.messages.length &&
    prevProps.highlightedMessageId === nextProps.highlightedMessageId &&
    prevProps.messages.every((msg, idx) => msg.id === nextProps.messages[idx]?.id)
  );
});
