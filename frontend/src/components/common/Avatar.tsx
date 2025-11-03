import React from 'react';

export interface AvatarProps {
  name: string;
  avatarUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'away';
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

const statusColors = {
  online: 'bg-green-500',
  offline: 'bg-gray-400',
  away: 'bg-yellow-500',
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
  const initials = getInitials(name);

  return (
    <div className={`relative flex-shrink-0 ${className}`}>
      {avatarUrl ? (
        <img src={avatarUrl} alt={name} className={`${sizeClass} rounded-full object-cover`} />
      ) : (
        <div
          className={`${sizeClass} rounded-full bg-gray-300 flex items-center justify-center font-medium text-gray-700`}
        >
          <span>{initials}</span>
        </div>
      )}

      {status && (
        <span
          className={`absolute bottom-0 right-0 ${
            size === 'xs' || size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'
          } ${statusColors[status]} rounded-full border-2 border-white`}
        />
      )}
    </div>
  );
};
