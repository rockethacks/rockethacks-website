import React from 'react';
import { cn } from '@/lib/utils';

interface AnimatedIconProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'yellow' | 'orange' | 'purple' | 'pink' | 'blue' | 'green';
  animation?: 'float' | 'pulse' | 'glow' | 'bounce' | 'none';
  gradient?: boolean;
}

const AnimatedIcon = React.forwardRef<HTMLDivElement, AnimatedIconProps>(
  ({ 
    className, 
    icon, 
    size = 'md', 
    color = 'yellow', 
    animation = 'float',
    gradient = true,
    ...props 
  }, ref) => {
    const sizes = {
      sm: 'w-12 h-12',
      md: 'w-16 h-16',
      lg: 'w-20 h-20',
      xl: 'w-24 h-24'
    };

    const colors = {
      yellow: gradient 
        ? 'bg-gradient-to-br from-rh-yellow to-rh-orange text-rh-navy-dark'
        : 'bg-rh-yellow text-rh-navy-dark',
      orange: gradient
        ? 'bg-gradient-to-br from-rh-orange to-rh-pink text-white'
        : 'bg-rh-orange text-white',
      purple: gradient
        ? 'bg-gradient-to-br from-rh-purple-light to-rh-purple-dark text-white'
        : 'bg-rh-purple-light text-white',
      pink: gradient
        ? 'bg-gradient-to-br from-rh-pink to-rh-purple-dark text-white'
        : 'bg-rh-pink text-white',
      blue: gradient
        ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white'
        : 'bg-blue-500 text-white',
      green: gradient
        ? 'bg-gradient-to-br from-green-400 to-green-600 text-white'
        : 'bg-green-500 text-white'
    };

    const animations = {
      float: 'animate-float',
      pulse: 'animate-pulse',
      glow: 'animate-glow',
      bounce: 'animate-bounce',
      none: ''
    };

    return (
      <div
        className={cn(
          'rounded-full flex items-center justify-center transition-all duration-300',
          'hover:scale-110 hover:shadow-glow group-hover:animate-pulse',
          sizes[size],
          colors[color],
          animations[animation],
          className
        )}
        ref={ref}
        {...props}
      >
        {icon}
      </div>
    );
  }
);

AnimatedIcon.displayName = 'AnimatedIcon';

export { AnimatedIcon };