import React, { useState, useEffect, useRef } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  placeholderSrc?: string;
  threshold?: number;
  rootMargin?: string;
}

/**
 * LazyImage component that loads images only when they're visible in the viewport
 * Uses Intersection Observer API for efficient lazy loading
 */
export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  onClick,
  placeholderSrc,
  threshold = 0.1,
  rootMargin = '100px',
}) => {
  const [imageSrc, setImageSrc] = useState<string | undefined>(placeholderSrc);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Skip if browser doesn't support Intersection Observer
    if (!('IntersectionObserver' in window)) {
      setImageSrc(src);
      return;
    }

    // Create observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Image is visible, start loading
            const img = new Image();
            img.src = src;

            img.onload = () => {
              setImageSrc(src);
              setIsLoading(false);
            };

            img.onerror = () => {
              setHasError(true);
              setIsLoading(false);
            };

            // Stop observing once we've started loading
            if (observerRef.current && imgRef.current) {
              observerRef.current.unobserve(imgRef.current);
            }
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    // Start observing
    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [src, threshold, rootMargin]);

  // Error state
  if (hasError) {
    return (
      <div
        className={`bg-secondary-200 flex items-center justify-center ${className}`}
        style={{ minHeight: '200px' }}
      >
        <span className="text-secondary-500 text-sm">Failed to load image</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <img
        ref={imgRef}
        src={imageSrc || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200"%3E%3C/svg%3E'}
        alt={alt}
        className={`${className} ${isLoading && !placeholderSrc ? 'blur-sm' : ''} transition-all duration-300`}
        onClick={onClick}
        loading="lazy" // Native lazy loading as fallback
      />

      {/* Loading spinner overlay */}
      {isLoading && !placeholderSrc && (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary-100 bg-opacity-75">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      )}
    </div>
  );
};

/**
 * Progressive loading strategy:
 * 1. Show placeholder (low-res or SVG) immediately
 * 2. Use Intersection Observer to detect when image enters viewport
 * 3. Load full-resolution image only when visible
 * 4. Show loading spinner during load
 * 5. Handle errors gracefully
 *
 * Performance benefits:
 * - Reduces initial page load time
 * - Saves bandwidth (only loads visible images)
 * - Improves Core Web Vitals (LCP, CLS)
 * - Better performance on slow connections
 *
 * Browser support:
 * - Modern browsers: Intersection Observer
 * - Fallback: Native lazy loading attribute
 * - Legacy browsers: Immediate load
 */
