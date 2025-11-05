import React from 'react';

export interface AvatarProps {
  name: string;
  avatarUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'away';
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-2xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

export const Avatar: React.FC<AvatarProps> = ({
  name,
  avatarUrl,
  size = 'md',
  status,
  className = '',
}) => {
  const getInitials = (name: string): string => {
    const trimmed = name.trim();
    if (!trimmed) return '?';

    const words = trimmed.split(/\s+/);
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  const sizeClass = sizeClasses[size];
  const avatarSizeClass = `avatar-${size}`;
  const initials = getInitials(name);

  return (
    <div className={`relative flex-shrink-0 ${className}`}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className={`${sizeClass} rounded-full object-cover shadow-sm`}
        />
      ) : (
        <div className={avatarSizeClass}>
          <span>{initials}</span>
        </div>
      )}

      {/* Status indicator - Telegram style */}
      {status && (
        <span
          className={`absolute bottom-0 right-0 ${
            size === 'xs' || size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'
          } status-${status}`}
        />
      )}
    </div>
  );
};
