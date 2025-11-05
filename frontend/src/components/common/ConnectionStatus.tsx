import React, { useState } from 'react';
import { useConnectionQuality, getQualityDescription, getQualityColor } from '../../hooks/useConnectionQuality';

interface ConnectionStatusProps {
  showDetails?: boolean;
  position?: 'top' | 'bottom';
  alwaysVisible?: boolean;
}

/**
 * ConnectionStatus Component
 * Displays real-time connection quality feedback to users
 * Can be placed at top or bottom of the app
 */
export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  showDetails = false,
  position = 'top',
  alwaysVisible = false,
}) => {
  const connectionInfo = useConnectionQuality();
  const [isExpanded, setIsExpanded] = useState(false);

  // Only show banner if connection is not excellent (unless alwaysVisible is true)
  const shouldShow = alwaysVisible || connectionInfo.quality !== 'excellent';

  if (!shouldShow) {
    return null;
  }

  const qualityColor = getQualityColor(connectionInfo.quality);
  const description = getQualityDescription(connectionInfo.quality);

  // Get connection icon
  const getIcon = () => {
    switch (connectionInfo.quality) {
      case 'excellent':
        return '📶';
      case 'good':
        return '📶';
      case 'poor':
        return '📶';
      case 'offline':
        return '📵';
      default:
        return '📶';
    }
  };

  // Format effective type for display
  const formatEffectiveType = (type?: string): string => {
    if (!type) return 'Unknown';
    return type.toUpperCase();
  };

  return (
    <div
      className={`fixed left-0 right-0 z-50 ${
        position === 'top' ? 'top-0' : 'bottom-0'
      }`}
    >
      <div
        className={`${qualityColor} px-4 py-2 shadow-md cursor-pointer transition-all`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{getIcon()}</span>
            <span className="font-medium text-sm">{description}</span>

            {/* Connection type badge */}
            {connectionInfo.effectiveType && (
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-white bg-opacity-30">
                {formatEffectiveType(connectionInfo.effectiveType)}
              </span>
            )}

            {/* Offline indicator */}
            {connectionInfo.quality === 'offline' && (
              <span className="text-xs opacity-75">
                Some features may be unavailable
              </span>
            )}
          </div>

          {/* Expand/Collapse button */}
          {showDetails && (
            <button className="text-xs opacity-75 hover:opacity-100">
              {isExpanded ? '▲ Hide details' : '▼ Show details'}
            </button>
          )}
        </div>

        {/* Expanded details */}
        {isExpanded && showDetails && (
          <div className="mt-2 pt-2 border-t border-current border-opacity-20">
            <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              {connectionInfo.rtt !== undefined && (
                <div>
                  <div className="opacity-75">Latency</div>
                  <div className="font-semibold">{connectionInfo.rtt}ms</div>
                </div>
              )}

              {connectionInfo.downlink !== undefined && (
                <div>
                  <div className="opacity-75">Downlink</div>
                  <div className="font-semibold">
                    {connectionInfo.downlink.toFixed(1)} Mbps
                  </div>
                </div>
              )}

              {connectionInfo.effectiveType && (
                <div>
                  <div className="opacity-75">Network Type</div>
                  <div className="font-semibold">
                    {formatEffectiveType(connectionInfo.effectiveType)}
                  </div>
                </div>
              )}

              {connectionInfo.saveData !== undefined && (
                <div>
                  <div className="opacity-75">Data Saver</div>
                  <div className="font-semibold">
                    {connectionInfo.saveData ? 'Enabled' : 'Disabled'}
                  </div>
                </div>
              )}
            </div>

            {/* Recommendations based on quality */}
            <div className="mt-2 text-xs opacity-75">
              {connectionInfo.quality === 'poor' && (
                <p>
                  💡 Tip: Image uploads and large messages may take longer to send
                </p>
              )}
              {connectionInfo.quality === 'offline' && (
                <p>
                  💡 Tip: Your messages will be sent when you reconnect
                </p>
              )}
              {connectionInfo.saveData && (
                <p>
                  💡 Tip: Data Saver is enabled - images may load at lower quality
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Compact connection indicator for use in headers or footers
 */
export const ConnectionIndicator: React.FC = () => {
  const connectionInfo = useConnectionQuality();

  const getIndicatorColor = () => {
    switch (connectionInfo.quality) {
      case 'excellent':
        return 'bg-green-500';
      case 'good':
        return 'bg-blue-500';
      case 'poor':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div
      className="flex items-center gap-2 group cursor-help"
      title={getQualityDescription(connectionInfo.quality)}
    >
      <div className="relative">
        {/* Animated pulse for poor/offline */}
        {(connectionInfo.quality === 'poor' || connectionInfo.quality === 'offline') && (
          <span className={`absolute inline-flex h-3 w-3 rounded-full ${getIndicatorColor()} opacity-75 animate-ping`}></span>
        )}
        <span className={`relative inline-flex h-3 w-3 rounded-full ${getIndicatorColor()}`}></span>
      </div>

      {/* Tooltip on hover */}
      <div className="hidden group-hover:block absolute bottom-full mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded shadow-lg whitespace-nowrap">
        {getQualityDescription(connectionInfo.quality)}
        {connectionInfo.rtt && (
          <div className="text-xs opacity-75 mt-1">
            Latency: {connectionInfo.rtt}ms
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Usage examples:
 *
 * // Full status banner (typically at top of app)
 * <ConnectionStatus showDetails position="top" />
 *
 * // Compact indicator (in header or footer)
 * <ConnectionIndicator />
 *
 * // Always visible status (for debugging)
 * <ConnectionStatus showDetails alwaysVisible />
 */
