import React from 'react';
import type { User } from '../types';

interface AvatarProps {
  user: User | { nickname: string; avatar?: string } | null | undefined;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-2xl',
  xl: 'w-20 h-20 text-3xl',
};

export const Avatar: React.FC<AvatarProps> = ({ 
  user, 
  size = 'md',
  className = '' 
}) => {
  if (!user) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-coral-500 to-turquoise-400 flex items-center justify-center text-white font-bold flex-shrink-0 ${className}`}>
        G
      </div>
    );
  }

  const nickname = user.nickname || 'G';
  const initial = nickname.charAt(0).toUpperCase();
  const avatarUrl = user.avatar;

  if (avatarUrl) {
    return (
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden flex-shrink-0 ${className} relative`}>
        <img
          src={avatarUrl}
          alt={nickname}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback all'iniziale se l'immagine non carica
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-coral-500 to-turquoise-400 flex items-center justify-center text-white font-bold">${initial}</div>`;
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-coral-500 to-turquoise-400 flex items-center justify-center text-white font-bold flex-shrink-0 ${className}`}>
      {initial}
    </div>
  );
};

