import { useState, useEffect } from 'react';

export type ConnectionQuality = 'excellent' | 'good' | 'poor' | 'offline';

interface ConnectionInfo {
  quality: ConnectionQuality;
  isOnline: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

interface NetworkInformation extends EventTarget {
  downlink?: number;
  effectiveType?: string;
  rtt?: number;
  saveData?: boolean;
  addEventListener(type: 'change', listener: () => void): void;
  removeEventListener(type: 'change', listener: () => void): void;
}

declare global {
  interface Navigator {
    connection?: NetworkInformation;
    mozConnection?: NetworkInformation;
    webkitConnection?: NetworkInformation;
  }
}

/**
 * Hook to monitor connection quality and provide real-time feedback
 * Uses Network Information API when available, falls back to ping tests
 */
export function useConnectionQuality(): ConnectionInfo {
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo>({
    quality: 'good',
    isOnline: navigator.onLine,
  });

  useEffect(() => {
    // Get network connection object (with vendor prefixes)
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    const updateConnectionInfo = () => {
      const isOnline = navigator.onLine;

      if (!isOnline) {
        setConnectionInfo({
          quality: 'offline',
          isOnline: false,
        });
        return;
      }

      // If Network Information API is available
      if (connection) {
        const { downlink, effectiveType, rtt, saveData } = connection;

        // Determine quality based on effective type and metrics
        let quality: ConnectionQuality = 'good';

        if (effectiveType === '4g' && (rtt || 0) < 100) {
          quality = 'excellent';
        } else if (effectiveType === '4g' || (effectiveType === '3g' && (rtt || 0) < 200)) {
          quality = 'good';
        } else if (effectiveType === '3g' || effectiveType === '2g' || (rtt || 0) > 500) {
          quality = 'poor';
        }

        // Override to poor if downlink is very slow
        if (downlink !== undefined && downlink < 0.5) {
          quality = 'poor';
        }

        setConnectionInfo({
          quality,
          isOnline,
          effectiveType,
          downlink,
          rtt,
          saveData,
        });
      } else {
        // Fallback: Perform ping test
        performPingTest();
      }
    };

    // Ping test fallback for browsers without Network Information API
    const performPingTest = async () => {
      try {
        const startTime = Date.now();
        const response = await fetch('/api/health', {
          method: 'HEAD',
          cache: 'no-cache',
        });
        const latency = Date.now() - startTime;

        let quality: ConnectionQuality = 'good';

        if (latency < 100 && response.ok) {
          quality = 'excellent';
        } else if (latency < 300) {
          quality = 'good';
        } else if (latency < 1000) {
          quality = 'poor';
        }

        setConnectionInfo({
          quality,
          isOnline: true,
          rtt: latency,
        });
      } catch (error) {
        // If ping fails, we're likely offline or have very poor connection
        setConnectionInfo({
          quality: 'poor',
          isOnline: navigator.onLine,
        });
      }
    };

    // Initial update
    updateConnectionInfo();

    // Listen for online/offline events
    const handleOnline = () => updateConnectionInfo();
    const handleOffline = () => {
      setConnectionInfo({
        quality: 'offline',
        isOnline: false,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for connection changes (Network Information API)
    const handleConnectionChange = () => updateConnectionInfo();

    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    // Periodic ping test for browsers without Network Information API
    const pingInterval = !connection ? setInterval(performPingTest, 30000) : null;

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }

      if (pingInterval) {
        clearInterval(pingInterval);
      }
    };
  }, []);

  return connectionInfo;
}

/**
 * Get quality description for user display
 */
export function getQualityDescription(quality: ConnectionQuality): string {
  switch (quality) {
    case 'excellent':
      return 'Excellent connection';
    case 'good':
      return 'Good connection';
    case 'poor':
      return 'Poor connection';
    case 'offline':
      return 'You are offline';
    default:
      return 'Unknown';
  }
}

/**
 * Get quality color for UI indicators
 */
export function getQualityColor(quality: ConnectionQuality): string {
  switch (quality) {
    case 'excellent':
      return 'text-green-600 bg-green-100';
    case 'good':
      return 'text-blue-600 bg-blue-100';
    case 'poor':
      return 'text-yellow-600 bg-yellow-100';
    case 'offline':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}
