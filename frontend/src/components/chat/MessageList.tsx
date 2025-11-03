import React, { useEffect, useRef } from 'react';
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
  messageId?: string;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, messageId }) => {
  const highlightedMessageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messageId && highlightedMessageRef.current) {
      highlightedMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [messageId]);

  return (
    <div className="space-y-4">
      {messages.map(message => (
        <div
          key={message.id}
          ref={message.id === messageId ? highlightedMessageRef : null}
          className={message.id === messageId ? 'ring-2 ring-blue-500 rounded-lg p-2' : ''}
        >
          <Message
            message={message}
            senderName="User" // This would come from user data
            senderAvatar={undefined}
          />
        </div>
      ))}
    </div>
  );
};
