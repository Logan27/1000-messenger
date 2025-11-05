import React, { useEffect, memo, useState, useCallback } from 'react';
import { List, useDynamicRowHeight, useListRef } from 'react-window';
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

// Constants for virtualization
const SYSTEM_MESSAGE_HEIGHT = 60;
const REGULAR_MESSAGE_BASE_HEIGHT = 80;
const MESSAGE_WITH_IMAGE_HEIGHT = 400;
const VIRTUALIZATION_THRESHOLD = 100; // Only virtualize if more than 100 messages

// Helper function to estimate message height
const estimateMessageHeight = (message: MessageListProps['messages'][0]): number => {
  if (message.contentType === 'system') {
    return SYSTEM_MESSAGE_HEIGHT;
  }

  // Check if message has images
  const metadata = message.metadata as MessageMetadata | undefined;
  if (metadata?.images && metadata.images.length > 0) {
    return MESSAGE_WITH_IMAGE_HEIGHT;
  }

  // Calculate height based on content length (approximate)
  const contentLines = Math.ceil(message.content.length / 50);
  const contentHeight = contentLines * 20;

  // Add space for reactions
  const reactionsHeight = message.reactions && message.reactions.length > 0 ? 30 : 0;

  return Math.max(REGULAR_MESSAGE_BASE_HEIGHT, contentHeight + reactionsHeight + 40);
};

// Row props interface for the new API
interface RowProps {
  message: MessageListProps['messages'][0];
  isHighlighted: boolean;
}

// Non-virtualized component for small lists
const SimpleMessageList: React.FC<MessageListProps> = ({ messages, highlightedMessageId }) => {
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

// Virtualized component for large lists using new react-window API
const VirtualizedMessageList: React.FC<MessageListProps> = ({ messages, highlightedMessageId }) => {
  const listRef = useListRef();
  const [containerHeight, setContainerHeight] = useState(600);

  // Use dynamic row height hook
  const dynamicRowHeight = useDynamicRowHeight({
    defaultRowHeight: REGULAR_MESSAGE_BASE_HEIGHT,
    key: 'message-list',
  });

  // Row renderer component - match the new API signature
  const RowComponent = useCallback(({
    index,
    style,
    ariaAttributes
  }: {
    index: number;
    style: React.CSSProperties;
    ariaAttributes: any;
  }) => {
    const message = messages[index];
    if (!message) return null;

    const isHighlighted = message.id === highlightedMessageId;

    // System messages
    if (message.contentType === 'system') {
      return (
        <div style={style} {...ariaAttributes}>
          <div
            id={`message-${message.id}`}
            className="flex justify-center py-2"
          >
            <div className="bg-gray-100 text-gray-600 text-sm px-4 py-2 rounded-full">
              {message.content}
            </div>
          </div>
        </div>
      );
    }

    // Regular messages
    return (
      <div style={style} {...ariaAttributes}>
        <div
          id={`message-${message.id}`}
          className={`px-4 py-2 transition-all duration-300 ${
            isHighlighted
              ? 'ring-2 ring-blue-500 rounded-lg bg-blue-50'
              : ''
          }`}
        >
          <Message
            message={message}
            senderName="User"
            senderAvatar={undefined}
          />
        </div>
      </div>
    );
  }, [messages, highlightedMessageId]);

  // Update container height on mount and resize
  useEffect(() => {
    const updateHeight = () => {
      const current = listRef.current;
      if (current?.element?.parentElement) {
        setContainerHeight(current.element.parentElement.clientHeight || 600);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [listRef]);

  // Scroll to highlighted message
  useEffect(() => {
    if (highlightedMessageId && listRef.current) {
      const index = messages.findIndex(m => m.id === highlightedMessageId);
      if (index !== -1) {
        listRef.current.scrollToRow({
          index,
          align: 'center',
          behavior: 'smooth',
        });
      }
    }
  }, [highlightedMessageId, messages, listRef]);

  return (
    <div className="h-full">
      <List
        listRef={listRef.current ? undefined : listRef as any}
        defaultHeight={containerHeight}
        rowCount={messages.length}
        rowHeight={dynamicRowHeight}
        rowComponent={RowComponent}
        rowProps={{}}
        overscanCount={5}
      />
    </div>
  );
};

const MessageListComponent: React.FC<MessageListProps> = ({ messages, highlightedMessageId }) => {
  // Use simple list for small message counts, virtualized for large
  if (messages.length < VIRTUALIZATION_THRESHOLD) {
    return <SimpleMessageList messages={messages} highlightedMessageId={highlightedMessageId} />;
  }

  return <VirtualizedMessageList messages={messages} highlightedMessageId={highlightedMessageId} />;
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
