import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'strong' | 'subtle' | 'gradient';
  gradient?: boolean;
  children: React.ReactNode;
  interactive?: boolean;
  loading?: boolean;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ 
    className, 
    variant = 'default', 
    gradient = false, 
    children, 
    interactive = true,
    loading = false,
    ...props 
  }, ref) => {
    const baseStyles = `
      backdrop-blur-md border rounded-2xl transition-all duration-300 
      overflow-hidden group relative
      ${interactive ? 'hover:scale-[1.02] hover:shadow-glass-lg cursor-pointer' : ''}
    `;

    const variants = {
      default: `
        bg-white/8 border-white/15 shadow-glass
        hover:bg-white/12 hover:border-rh-yellow/30
        ${interactive ? 'hover:translate-y-[-2px]' : ''}
      `,
      strong: `
        bg-white/12 border-white/25 shadow-glass-lg
        hover:bg-white/18 hover:border-rh-yellow/40
        ${interactive ? 'hover:translate-y-[-3px]' : ''}
      `,
      subtle: `
        bg-white/4 border-white/8 shadow-glass
        hover:bg-white/8 hover:border-rh-yellow/20
        ${interactive ? 'hover:translate-y-[-1px]' : ''}
      `,
      gradient: `
        bg-gradient-to-br from-white/10 via-white/5 to-white/10 
        border-white/20 shadow-glass-lg
        hover:bg-gradient-to-br hover:from-white/15 hover:via-white/8 hover:to-white/15 
        hover:border-rh-yellow/35
        ${interactive ? 'hover:translate-y-[-2px]' : ''}
      `
    };

    const gradientOverlay = gradient ? (
      <div className="absolute inset-0 bg-gradient-to-br from-rh-yellow/5 via-transparent to-rh-purple-light/5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    ) : null;

    const loadingOverlay = loading ? (
      <div className="absolute inset-0 bg-white/5 backdrop-blur-sm flex items-center justify-center z-10">
        <div className="w-8 h-8 border-2 border-rh-yellow border-t-transparent rounded-full animate-spin" />
      </div>
    ) : null;

    return (
      <div
        className={cn(baseStyles, variants[variant], className)}
        ref={ref}
        role={interactive ? "button" : undefined}
        tabIndex={interactive ? 0 : undefined}
        aria-disabled={loading}
        {...props}
      >
        {gradientOverlay}
        {loadingOverlay}
        <div className={cn("relative z-10", loading && "opacity-50")}>
          {children}
        </div>
        
        {/* Subtle top highlight */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rh-yellow/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';

export { GlassCard };