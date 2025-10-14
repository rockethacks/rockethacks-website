import React from 'react';
import { cn } from '@/lib/utils';

interface ModernButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  asChild?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const ModernButton = React.forwardRef<HTMLButtonElement, ModernButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    children, 
    asChild = false, 
    loading = false,
    icon,
    iconPosition = 'left',
    disabled,
    ...props 
  }, ref) => {
    const baseStyles = `
      inline-flex items-center justify-center rounded-xl font-semibold 
      transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 
      focus-visible:ring-rh-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-rh-background
      disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed
      relative overflow-hidden group select-none
      active:scale-[0.98] hover:scale-[1.02]
    `;

    const variants = {
      primary: `
        bg-gradient-to-r from-rh-yellow to-rh-orange text-rh-navy-dark 
        hover:shadow-[0_12px_30px_rgba(255,196,90,0.5)] hover:shadow-glow
        before:absolute before:inset-0 before:bg-gradient-to-r 
        before:from-transparent before:via-white/20 before:to-transparent 
        before:translate-x-[-100%] hover:before:translate-x-[100%] 
        before:transition-transform before:duration-700
        shadow-[0_4px_15px_rgba(255,196,90,0.3)] shadow-glow
      `,
      secondary: `
        bg-transparent border-2 border-rh-yellow text-rh-white 
        hover:bg-gradient-to-r hover:from-rh-yellow hover:to-rh-orange 
        hover:text-rh-navy-dark hover:border-rh-orange hover:shadow-glow
        backdrop-blur-md
        before:absolute before:inset-0 before:w-0 before:h-full
        before:bg-gradient-to-r before:from-rh-yellow before:to-rh-orange
        before:transition-all before:duration-300 before:z-[-1]
        hover:before:w-full
      `,
      outline: `
        bg-transparent border border-rh-white/20 text-rh-white 
        hover:bg-rh-white/10 hover:border-rh-yellow/50 hover:text-rh-yellow
        backdrop-blur-sm
      `,
      ghost: `
        bg-transparent text-rh-white hover:bg-rh-white/10 
        hover:text-rh-yellow hover:shadow-glow
      `,
      gradient: `
        bg-gradient-to-r from-rh-purple-light via-rh-pink to-rh-orange 
        text-white hover:shadow-[0_12px_30px_rgba(195,44,154,0.5)]
        before:absolute before:inset-0 before:bg-gradient-to-r 
        before:from-transparent before:via-white/20 before:to-transparent 
        before:translate-x-[-100%] hover:before:translate-x-[100%] 
        before:transition-transform before:duration-700
        shadow-[0_4px_15px_rgba(195,44,154,0.3)]
      `
    };

    const sizes = {
      sm: 'h-9 px-4 text-sm gap-2',
      md: 'h-11 px-6 text-base gap-2',
      lg: 'h-14 px-8 text-lg gap-3',
      xl: 'h-16 px-10 text-xl gap-4'
    };

    const isDisabled = disabled || loading;

    const buttonContent = (
      <>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <div className={cn("flex items-center gap-2", loading && "opacity-0")}>
          {icon && iconPosition === 'left' && (
            <span className="flex-shrink-0">{icon}</span>
          )}
          <span>{children}</span>
          {icon && iconPosition === 'right' && (
            <span className="flex-shrink-0">{icon}</span>
          )}
        </div>
      </>
    );

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<React.HTMLAttributes<HTMLElement>>, {
        className: cn(baseStyles, variants[variant], sizes[size], (children.props as React.HTMLAttributes<HTMLElement>)?.className),
        ref,
        disabled: isDisabled,
        'aria-disabled': isDisabled,
        ...props
      } as React.HTMLAttributes<HTMLElement>);
    }

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={loading}
        {...props}
      >
        {buttonContent}
      </button>
    );
  }
);

ModernButton.displayName = 'ModernButton';

export { ModernButton };