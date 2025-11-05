/**
 * Service Worker Registration and Management
 * Handles offline support, caching, and background sync
 */

interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

class ServiceWorkerService {
  private registration: ServiceWorkerRegistration | null = null;

  /**
   * Register the service worker
   */
  async register(config: ServiceWorkerConfig = {}): Promise<void> {
    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      console.warn('Service workers are not supported in this browser');
      return;
    }

    // Only register in production or if explicitly enabled
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const enableInDev = import.meta.env.VITE_ENABLE_SW_DEV === 'true';

    if (isLocalhost && !enableInDev) {
      console.log('Service worker disabled in development. Set VITE_ENABLE_SW_DEV=true to enable.');
      return;
    }

    try {
      // Wait for page load to avoid slowing down initial render
      if (document.readyState === 'complete') {
        await this.registerWorker(config);
      } else {
        window.addEventListener('load', () => this.registerWorker(config));
      }
    } catch (error) {
      console.error('Service worker registration failed:', error);
      config.onError?.(error as Error);
    }
  }

  /**
   * Internal method to register the worker
   */
  private async registerWorker(config: ServiceWorkerConfig): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
      });

      this.registration = registration;

      console.log('Service worker registered successfully');

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;

        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              console.log('New service worker available');
              config.onUpdate?.(registration);
            }
          });
        }
      });

      // Check for updates periodically (every hour)
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);

      config.onSuccess?.(registration);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Unregister the service worker
   */
  async unregister(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const success = await registration.unregister();

      if (success) {
        console.log('Service worker unregistered');
        this.registration = null;
      }

      return success;
    } catch (error) {
      console.error('Failed to unregister service worker:', error);
      return false;
    }
  }

  /**
   * Skip waiting and activate new service worker immediately
   */
  async skipWaiting(): Promise<void> {
    if (!this.registration || !this.registration.waiting) {
      return;
    }

    // Send message to waiting worker to skip waiting
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });

    // Reload page to use new worker
    window.location.reload();
  }

  /**
   * Cache specific URLs
   */
  async cacheUrls(urls: string[]): Promise<boolean> {
    if (!this.registration || !this.registration.active) {
      console.warn('No active service worker to cache URLs');
      return false;
    }

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();

      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.success);
      };

      this.registration!.active!.postMessage(
        {
          type: 'CACHE_URLS',
          payload: urls,
        },
        [messageChannel.port2]
      );
    });
  }

  /**
   * Check if the app is currently offline
   */
  isOffline(): boolean {
    return !navigator.onLine;
  }

  /**
   * Get the current service worker registration
   */
  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }

  /**
   * Listen for online/offline events
   */
  onConnectionChange(callback: (isOnline: boolean) => void): () => void {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Return cleanup function
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }
}

// Export singleton instance
export const serviceWorkerService = new ServiceWorkerService();

/**
 * Usage example:
 *
 * // In your main App.tsx or index.tsx:
 * import { serviceWorkerService } from './services/serviceWorker.service';
 *
 * serviceWorkerService.register({
 *   onSuccess: () => {
 *     console.log('App is ready to work offline');
 *   },
 *   onUpdate: () => {
 *     // Notify user about new version
 *     if (confirm('New version available! Reload to update?')) {
 *       serviceWorkerService.skipWaiting();
 *     }
 *   },
 *   onError: (error) => {
 *     console.error('Service worker error:', error);
 *   },
 * });
 *
 * // Monitor connection status:
 * serviceWorkerService.onConnectionChange((isOnline) => {
 *   if (isOnline) {
 *     console.log('Back online!');
 *   } else {
 *     console.log('You are offline');
 *   }
 * });
 */
