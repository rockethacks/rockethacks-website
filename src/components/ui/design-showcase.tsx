import React from 'react';
import { ModernButton } from './modern-button';
import { GlassCard } from './glass-card';
import { AnimatedIcon } from './animated-icon';
import { LoadingSpinner } from './loading';
import { terminal } from '../../app/fonts/fonts';
import { 
  FaRocket, 
  FaCode, 
  FaUsers, 
  FaTrophy, 
  FaLightbulb,
  FaHeart 
} from 'react-icons/fa';

export const DesignShowcase: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rh-background to-rh-navy-dark p-8">
      <div className="max-w-6xl mx-auto space-y-16">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className={`${terminal.className} heading-xl gradient-text`}>
            RH26 Design System
          </h1>
          <p className="text-rh-white/80 text-lg max-w-2xl mx-auto">
            A showcase of the modern design components and visual elements 
            created for RocketHacks 2026.
          </p>
        </div>

        {/* Color Palette */}
        <section className="space-y-6">
          <h2 className={`${terminal.className} heading-md text-rh-yellow`}>
            Color Palette
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="w-full h-16 bg-rh-yellow rounded-xl"></div>
              <p className="text-sm text-rh-white/70">#ffc65a</p>
              <p className="text-xs text-rh-white/50">Primary Yellow</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-16 bg-rh-orange rounded-xl"></div>
              <p className="text-sm text-rh-white/70">#f483f5</p>
              <p className="text-xs text-rh-white/50">Accent Orange</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-16 bg-rh-purple-light rounded-xl"></div>
              <p className="text-sm text-rh-white/70">#7f819e</p>
              <p className="text-xs text-rh-white/50">Purple Light</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-16 bg-rh-pink rounded-xl"></div>
              <p className="text-sm text-rh-white/70">#c32c9a</p>
              <p className="text-xs text-rh-white/50">Accent Pink</p>
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section className="space-y-6">
          <h2 className={`${terminal.className} heading-md text-rh-yellow`}>
            Button Variants
          </h2>
          <div className="flex flex-wrap gap-4">
            <ModernButton variant="primary" size="lg">
              Primary Large
            </ModernButton>
            <ModernButton variant="secondary" size="md">
              Secondary Medium
            </ModernButton>
            <ModernButton variant="outline" size="sm">
              Outline Small
            </ModernButton>
            <ModernButton variant="ghost">
              Ghost Button
            </ModernButton>
          </div>
        </section>

        {/* Glass Cards */}
        <section className="space-y-6">
          <h2 className={`${terminal.className} heading-md text-rh-yellow`}>
            Glass Cards
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard variant="default" className="p-6 text-center">
              <AnimatedIcon 
                icon={<FaRocket size={24} />}
                size="lg"
                color="yellow"
                animation="float"
                className="mx-auto mb-4"
              />
              <h3 className={`${terminal.className} text-xl text-rh-yellow mb-2`}>
                Default Card
              </h3>
              <p className="text-rh-white/80 text-sm">
                Standard glassmorphism effect with subtle transparency.
              </p>
            </GlassCard>

            <GlassCard variant="strong" gradient className="p-6 text-center">
              <AnimatedIcon 
                icon={<FaCode size={24} />}
                size="lg"
                color="purple"
                animation="pulse"
                className="mx-auto mb-4"
              />
              <h3 className={`${terminal.className} text-xl text-rh-purple-light mb-2`}>
                Strong Card
              </h3>
              <p className="text-rh-white/80 text-sm">
                Enhanced glass effect with gradient overlay.
              </p>
            </GlassCard>

            <GlassCard variant="subtle" className="p-6 text-center">
              <AnimatedIcon 
                icon={<FaUsers size={24} />}
                size="lg"
                color="green"
                animation="bounce"
                className="mx-auto mb-4"
              />
              <h3 className={`${terminal.className} text-xl text-green-400 mb-2`}>
                Subtle Card
              </h3>
              <p className="text-rh-white/80 text-sm">
                Minimal glass effect for subtle emphasis.
              </p>
            </GlassCard>
          </div>
        </section>

        {/* Animated Icons */}
        <section className="space-y-6">
          <h2 className={`${terminal.className} heading-md text-rh-yellow`}>
            Animated Icons
          </h2>
          <div className="flex flex-wrap justify-center gap-8">
            <div className="text-center space-y-2">
              <AnimatedIcon 
                icon={<FaTrophy size={32} />}
                size="xl"
                color="yellow"
                animation="float"
              />
              <p className="text-xs text-rh-white/70">Float</p>
            </div>
            <div className="text-center space-y-2">
              <AnimatedIcon 
                icon={<FaLightbulb size={32} />}
                size="xl"
                color="orange"
                animation="pulse"
              />
              <p className="text-xs text-rh-white/70">Pulse</p>
            </div>
            <div className="text-center space-y-2">
              <AnimatedIcon 
                icon={<FaHeart size={32} />}
                size="xl"
                color="pink"
                animation="bounce"
              />
              <p className="text-xs text-rh-white/70">Bounce</p>
            </div>
            <div className="text-center space-y-2">
              <AnimatedIcon 
                icon={<FaRocket size={32} />}
                size="xl"
                color="purple"
                animation="glow"
              />
              <p className="text-xs text-rh-white/70">Glow</p>
            </div>
          </div>
        </section>

        {/* Loading States */}
        <section className="space-y-6">
          <h2 className={`${terminal.className} heading-md text-rh-yellow`}>
            Loading States
          </h2>
          <div className="flex justify-center space-x-8">
            <div className="text-center space-y-2">
              <LoadingSpinner size="sm" color="yellow" />
              <p className="text-xs text-rh-white/70">Small</p>
            </div>
            <div className="text-center space-y-2">
              <LoadingSpinner size="md" color="white" />
              <p className="text-xs text-rh-white/70">Medium</p>
            </div>
            <div className="text-center space-y-2">
              <LoadingSpinner size="lg" color="purple" />
              <p className="text-xs text-rh-white/70">Large</p>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section className="space-y-6">
          <h2 className={`${terminal.className} heading-md text-rh-yellow`}>
            Typography Scale
          </h2>
          <div className="space-y-4">
            <h1 className={`${terminal.className} heading-xl text-rh-white`}>
              Heading XL - Terminal Grotesque
            </h1>
            <h2 className={`${terminal.className} heading-lg text-rh-white`}>
              Heading Large - Terminal Grotesque
            </h2>
            <h3 className={`${terminal.className} heading-md text-rh-white`}>
              Heading Medium - Terminal Grotesque
            </h3>
            <h4 className={`${terminal.className} heading-sm text-rh-white`}>
              Heading Small - Terminal Grotesque
            </h4>
            <p className="text-lg text-rh-white/90">
              Body Large - Plus Jakarta Sans with good readability and line height.
            </p>
            <p className="text-base text-rh-white/80">
              Body Regular - The standard text size for most content areas.
            </p>
            <p className="text-sm text-rh-white/70">
              Body Small - Used for captions, metadata, and secondary information.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
};