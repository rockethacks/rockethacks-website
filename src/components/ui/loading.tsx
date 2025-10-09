import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'yellow' | 'white' | 'purple';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = 'yellow',
  className 
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const colors = {
    yellow: 'border-rh-yellow',
    white: 'border-white',
    purple: 'border-rh-purple-light'
  };

  return (
    <div className={cn(
      'animate-spin rounded-full border-2 border-t-transparent',
      sizes[size],
      colors[color],
      className
    )} />
  );
};

interface LoadingPageProps {
  message?: string;
}

export const LoadingPage: React.FC<LoadingPageProps> = ({ 
  message = 'Loading...' 
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rh-background to-rh-navy-dark flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="relative">
          {/* Outer spinning ring */}
          <div className="w-16 h-16 border-4 border-rh-yellow/20 border-t-rh-yellow rounded-full animate-spin mx-auto"></div>
          {/* Inner pulsing dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-rh-yellow rounded-full animate-pulse"></div>
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-terminal text-rh-yellow">RocketHacks</h2>
          <p className="text-rh-white/70">{message}</p>
        </div>
      </div>
    </div>
  );
};