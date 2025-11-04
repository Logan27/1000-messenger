import { useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  threshold?: number; // Distance from top in pixels to trigger load
}

/**
 * Custom hook for implementing infinite scroll functionality
 * Triggers onLoadMore when user scrolls near the top of the container
 */
export const useInfiniteScroll = ({
  onLoadMore,
  hasMore,
  isLoading,
  threshold = 100,
}: UseInfiniteScrollOptions) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousScrollHeight = useRef<number>(0);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container || isLoading || !hasMore) return;

    // Check if user scrolled near the top
    if (container.scrollTop <= threshold) {
      // Store current scroll position before loading
      previousScrollHeight.current = container.scrollHeight;
      onLoadMore();
    }
  }, [onLoadMore, hasMore, isLoading, threshold]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Restore scroll position after loading more messages
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !previousScrollHeight.current) return;

    const newScrollHeight = container.scrollHeight;
    const scrollDiff = newScrollHeight - previousScrollHeight.current;

    if (scrollDiff > 0) {
      container.scrollTop = scrollDiff;
      previousScrollHeight.current = 0;
    }
  });

  return containerRef;
};
