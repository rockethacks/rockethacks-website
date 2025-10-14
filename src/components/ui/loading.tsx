import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton';
  className?: string;
  text?: string;
}

const Loading: React.FC<LoadingProps> = ({ 
  size = 'md', 
  variant = 'spinner', 
  className,
  text 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const renderSpinner = () => (
    <div className={cn(
      "border-2 border-rh-white/20 border-t-rh-yellow rounded-full animate-spin",
      sizeClasses[size]
    )} />
  );

  const renderDots = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            "bg-rh-yellow rounded-full animate-pulse",
            size === 'sm' ? 'w-1 h-1' : size === 'md' ? 'w-2 h-2' : size === 'lg' ? 'w-3 h-3' : 'w-4 h-4'
          )}
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );

  const renderPulse = () => (
    <div className={cn(
      "bg-rh-yellow rounded-full animate-pulse-glow",
      sizeClasses[size]
    )} />
  );

  const renderSkeleton = () => (
    <div className="space-y-2">
      <div className="h-4 bg-rh-white/10 rounded animate-pulse" />
      <div className="h-4 bg-rh-white/10 rounded animate-pulse w-3/4" />
      <div className="h-4 bg-rh-white/10 rounded animate-pulse w-1/2" />
    </div>
  );

  const renderVariant = () => {
    switch (variant) {
      case 'dots':
        return renderDots();
      case 'pulse':
        return renderPulse();
      case 'skeleton':
        return renderSkeleton();
      default:
        return renderSpinner();
    }
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-center space-y-2",
      className
    )}>
      {renderVariant()}
      {text && (
        <p className={cn(
          "text-rh-white/70 animate-pulse",
          textSizeClasses[size]
        )}>
          {text}
        </p>
      )}
    </div>
  );
};

export { Loading };

// Loading overlay component
interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  text?: string;
  variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton';
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  children,
  text,
  variant = 'spinner'
}) => {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-rh-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <Loading variant={variant} text={text} />
        </div>
      )}
    </div>
  );
};

// Page loading component
export const PageLoading: React.FC<{ text?: string }> = ({ text = "Loading..." }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-rh-background">
      <div className="text-center space-y-4">
        <Loading size="xl" variant="spinner" />
        <p className="text-rh-white/70 text-lg animate-pulse">{text}</p>
      </div>
    </div>
  );
};