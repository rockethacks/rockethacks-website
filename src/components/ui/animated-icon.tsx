import React from 'react';
import { cn } from '@/lib/utils';

interface AnimatedIconProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'yellow' | 'orange' | 'purple' | 'pink' | 'blue' | 'green' | 'white';
  animation?: 'float' | 'pulse' | 'glow' | 'bounce' | 'spin' | 'morph' | 'none';
  gradient?: boolean;
  delay?: number;
  duration?: number;
  interactive?: boolean;
}

const AnimatedIcon = React.forwardRef<HTMLDivElement, AnimatedIconProps>(
  ({ 
    className, 
    icon, 
    size = 'md', 
    color = 'yellow', 
    animation = 'float',
    gradient = true,
    delay = 0,
    duration = 3,
    interactive = true,
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
        : 'bg-green-500 text-white',
      white: gradient
        ? 'bg-gradient-to-br from-white to-gray-200 text-rh-navy-dark'
        : 'bg-white text-rh-navy-dark'
    };

    const animations = {
      float: 'animate-float',
      pulse: 'animate-pulse-glow',
      glow: 'animate-glow',
      bounce: 'animate-bounce',
      spin: 'animate-spin',
      morph: 'animate-morphing-gradient',
      none: ''
    };

    const style = {
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`
    };

    return (
      <div
        className={cn(
          'rounded-full flex items-center justify-center transition-all duration-300',
          interactive && 'hover:scale-110 hover:shadow-glow group-hover:animate-pulse',
          sizes[size],
          colors[color],
          animations[animation],
          className
        )}
        style={style}
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

// Enhanced icon with hover effects
interface HoverIconProps extends AnimatedIconProps {
  hoverAnimation?: 'scale' | 'rotate' | 'glow' | 'bounce' | 'morph';
  hoverColor?: 'yellow' | 'orange' | 'purple' | 'pink' | 'blue' | 'green' | 'white';
}

export const HoverIcon: React.FC<HoverIconProps> = ({
  hoverAnimation = 'scale',
  hoverColor,
  ...props
}) => {
  const hoverClasses = {
    scale: 'hover:scale-110',
    rotate: 'hover:rotate-12',
    glow: 'hover:animate-glow',
    bounce: 'hover:animate-bounce',
    morph: 'hover:animate-morphing-gradient'
  };

  const hoverColorClasses = {
    yellow: 'hover:from-rh-yellow hover:to-rh-orange',
    orange: 'hover:from-rh-orange hover:to-rh-pink',
    purple: 'hover:from-rh-purple-light hover:to-rh-purple-dark',
    pink: 'hover:from-rh-pink hover:to-rh-purple-dark',
    blue: 'hover:from-blue-400 hover:to-blue-600',
    green: 'hover:from-green-400 hover:to-green-600',
    white: 'hover:from-white hover:to-gray-200'
  };

  const effectiveHoverColor = hoverColor || props.color || 'yellow';

  return (
    <AnimatedIcon
      {...props}
      className={cn(
        'cursor-pointer transition-all duration-300',
        hoverClasses[hoverAnimation],
        hoverColorClasses[effectiveHoverColor],
        props.className
      )}
    />
  );
};

// Icon with staggered animation
interface StaggeredIconProps extends AnimatedIconProps {
  index: number;
  total: number;
}

export const StaggeredIcon: React.FC<StaggeredIconProps> = ({
  index,
  total,
  ...props
}) => {
  const delay = (index / total) * 2; // Stagger over 2 seconds
  
  return (
    <AnimatedIcon
      {...props}
      delay={delay}
      animation="float"
      className={cn(
        'opacity-0 animate-fade-scale',
        props.className
      )}
    />
  );
};