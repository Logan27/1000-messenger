import React from 'react';
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
}

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  return (
    <div className="space-y-4">
      {messages.map(message => (
        <Message
          key={message.id}
          message={message}
          senderName="User" // This would come from user data
          senderAvatar={undefined}
        />
      ))}
    </div>
  );
};
