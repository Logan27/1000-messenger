import { useEffect, useRef } from 'react';
import { wsService } from '../services/websocket.service';

interface UseMessageReadOptions {
  messageId: string;
  chatId: string;
  isOwnMessage: boolean;
  isPending?: boolean;
  isFailed?: boolean;
}

export const useMessageRead = ({
  messageId,
  chatId,
  isOwnMessage,
  isPending,
  isFailed,
}: UseMessageReadOptions) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const hasBeenRead = useRef(false);

  useEffect(() => {
    // Don't mark own messages, pending messages, or failed messages as read
    if (isOwnMessage || isPending || isFailed || hasBeenRead.current) {
      return;
    }

    const element = elementRef.current;
    if (!element) return;

    // Create intersection observer to detect when message is visible
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Message is visible and hasn't been marked as read yet
          if (entry.isIntersecting && !hasBeenRead.current) {
            hasBeenRead.current = true;
            
            // Emit read event via WebSocket
            wsService.emit('message:mark-read', { messageId });
          }
        });
      },
      {
        root: null, // viewport
        rootMargin: '0px',
        threshold: 0.5, // 50% of message must be visible
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [messageId, chatId, isOwnMessage, isPending, isFailed]);

  return elementRef;
};
