import React from 'react';
import { getInitials } from '../../utils/formatters';

interface AvatarProps {
  name: string;
  avatarUrl?: string;
  colorTag?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const COLOR_PALETTES = [
  'from-blue-500 to-indigo-600',
  'from-purple-500 to-pink-500',
  'from-emerald-400 to-teal-600',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-red-600',
  'from-cyan-400 to-blue-600',
];

export const Avatar: React.FC<AvatarProps> = ({
  name,
  avatarUrl,
  colorTag,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base font-semibold',
    xl: 'w-16 h-16 text-xl font-bold',
  }[size];

  // Pick deterministic gradient based on name hash if no colorTag
  const charCodeSum = (name || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const gradientClass = COLOR_PALETTES[charCodeSum % COLOR_PALETTES.length];

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizeClasses} rounded-full object-cover shadow-sm ring-1 ring-black/5 dark:ring-white/10 ${className}`}
      />
    );
  }

  return (
    <div
      style={colorTag ? { backgroundColor: colorTag } : undefined}
      className={`${sizeClasses} ${
        !colorTag ? `bg-gradient-to-tr ${gradientClass}` : ''
      } rounded-full flex items-center justify-center text-white font-medium shadow-sm ring-1 ring-black/5 dark:ring-white/10 flex-shrink-0 ${className}`}
    >
      {getInitials(name)}
    </div>
  );
};
