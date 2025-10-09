import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'strong' | 'subtle';
  gradient?: boolean;
  children: React.ReactNode;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = 'default', gradient = false, children, ...props }, ref) => {
    const baseStyles = `
      backdrop-blur-md border rounded-2xl transition-all duration-300 
      hover:scale-[1.02] hover:shadow-glass-lg group overflow-hidden
    `;

    const variants = {
      default: `
        bg-white/10 border-white/20 shadow-glass
        hover:bg-white/15 hover:border-rh-yellow/30
      `,
      strong: `
        bg-white/15 border-white/30 shadow-glass-lg
        hover:bg-white/20 hover:border-rh-yellow/40
      `,
      subtle: `
        bg-white/5 border-white/10 shadow-glass
        hover:bg-white/10 hover:border-rh-yellow/20
      `
    };

    const gradientOverlay = gradient ? (
      <div className="absolute inset-0 bg-gradient-to-br from-rh-yellow/5 via-transparent to-rh-purple-light/5 pointer-events-none" />
    ) : null;

    return (
      <div
        className={cn(baseStyles, variants[variant], className)}
        ref={ref}
        {...props}
      >
        {gradientOverlay}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';

export { GlassCard };