import React from 'react';
import { cn } from '@/lib/utils';

interface ModernButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  asChild?: boolean;
}

const ModernButton = React.forwardRef<HTMLButtonElement, ModernButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, asChild = false, ...props }, ref) => {
    const baseStyles = `
      inline-flex items-center justify-center rounded-xl font-medium 
      transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 
      focus-visible:ring-rh-yellow focus-visible:ring-offset-2 
      disabled:pointer-events-none disabled:opacity-50 
      relative overflow-hidden group
    `;

    const variants = {
      primary: `
        bg-gradient-to-r from-rh-yellow to-rh-orange text-rh-navy-dark 
        hover:shadow-glow hover:scale-[1.02] active:scale-[0.98]
        before:absolute before:inset-0 before:bg-gradient-to-r 
        before:from-transparent before:via-white/20 before:to-transparent 
        before:translate-x-[-100%] hover:before:translate-x-[100%] 
        before:transition-transform before:duration-700
      `,
      secondary: `
        bg-transparent border-2 border-rh-yellow text-rh-white 
        hover:bg-rh-yellow hover:text-rh-navy-dark hover:scale-[1.02] 
        active:scale-[0.98] hover:shadow-glow
      `,
      outline: `
        bg-transparent border border-rh-white/20 text-rh-white 
        hover:bg-rh-white/10 hover:border-rh-yellow/50 hover:scale-[1.02]
      `,
      ghost: `
        bg-transparent text-rh-white hover:bg-rh-white/10 
        hover:text-rh-yellow hover:scale-[1.02]
      `
    };

    const sizes = {
      sm: 'h-9 px-4 text-sm',
      md: 'h-11 px-6 text-base',
      lg: 'h-14 px-8 text-lg'
    };

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<React.HTMLAttributes<HTMLElement>>, {
        className: cn(baseStyles, variants[variant], sizes[size], (children.props as React.HTMLAttributes<HTMLElement>)?.className),
        ref,
        ...props
      } as React.HTMLAttributes<HTMLElement>);
    }

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);

ModernButton.displayName = 'ModernButton';

export { ModernButton };