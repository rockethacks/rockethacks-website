import React from "react";
import { terminal } from "@/app/fonts/fonts";
import Image from "next/image";
import { FaTrophy, FaMedal, FaAward, FaCrown } from "react-icons/fa";
import { GlassCard } from "../ui/glass-card";
import { AnimatedIcon } from "../ui/animated-icon";

interface PrizeCategory {
  title: string;
  description: string;
  prizes: {
    place: string;
    amount: string;
    icon: React.ReactNode;
    color: 'yellow' | 'orange' | 'purple' | 'pink';
  }[];
}

export const Prizes = () => {
  const prizeCategories: PrizeCategory[] = [
    {
      title: "Overall Winners",
      description: "Top projects across all tracks",
      prizes: [
        {
          place: "1st Place",
          amount: "Coming Soon",
          icon: <FaCrown size={24} />,
          color: 'yellow'
        },
        {
          place: "2nd Place", 
          amount: "Coming Soon",
          icon: <FaTrophy size={24} />,
          color: 'orange'
        },
        {
          place: "3rd Place",
          amount: "Coming Soon", 
          icon: <FaMedal size={24} />,
          color: 'purple'
        }
      ]
    },
    {
      title: "Track Winners",
      description: "Best project in each competition track",
      prizes: [
        {
          place: "Green Innovation",
          amount: "Coming Soon",
          icon: <FaAward size={24} />,
          color: 'yellow'
        },
        {
          place: "MedTech",
          amount: "Coming Soon",
          icon: <FaAward size={24} />,
          color: 'orange'
        },
        {
          place: "Next Gen AI",
          amount: "Coming Soon",
          icon: <FaAward size={24} />,
          color: 'purple'
        },
        {
          place: "Hardware",
          amount: "Coming Soon",
          icon: <FaAward size={24} />,
          color: 'pink'
        }
      ]
    },

  ];

  return (
    <div>
      <section
        id="prizes"
        className="relative bg-gradient-to-b from-rh-background via-rh-navy-dark to-rh-navy-light text-white py-12 px-5 md:px-10"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25px 25px, rgba(255, 196, 90, 0.3) 2px, transparent 0)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16 animate-slide-up">
            <h2 className={`${terminal.className} heading-lg gradient-text mb-6 uppercase tracking-wider`}>
              Prizes & Awards
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-rh-yellow to-rh-orange mx-auto mb-8 rounded-full"></div>
            <p className="text-lg leading-relaxed text-rh-white/90 max-w-3xl mx-auto">
              Compete for amazing prizes and recognition. We&apos;re preparing incredible rewards 
              for our most innovative teams and outstanding individual contributions.
            </p>
          </div>

          {/* Legacy Prizes Image */}
          <div className="mb-16 animate-fade-scale">
            <GlassCard variant="strong" className="max-w-4xl mx-auto p-8 text-center">
              <h3 className={`${terminal.className} text-2xl text-rh-yellow mb-6`}>
                RocketHacks 2025 Prize Pool
              </h3>
              <div className="relative overflow-hidden rounded-xl">
                <Image 
                  src="/assets/Prizes.gif" 
                  width={1915} 
                  height={1800} 
                  alt="RocketHacks 2025 Prizes" 
                  className="w-full h-auto max-w-full object-contain"
                  priority
                />
              </div>
              <p className="text-rh-white/70 text-sm mt-4">
                Last year&apos;s incredible prize pool - 2026 will be even bigger!
              </p>
            </GlassCard>
          </div>

          {/* 2026 Prize Categories */}
          <div className="space-y-12">
            <div className="text-center mb-12">
              <h3 className={`${terminal.className} text-3xl text-rh-yellow mb-4`}>
                RocketHacks 2026 Prize Categories
              </h3>
              <p className="text-rh-white/80 max-w-2xl mx-auto">
                We&apos;re working with our sponsors to create an even more exciting prize structure. 
                Stay tuned for official announcements!
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {prizeCategories.map((category, categoryIndex) => (
                <div key={categoryIndex} className="animate-fade-scale" style={{ animationDelay: `${categoryIndex * 0.2}s` }}>
                  <GlassCard variant="default" gradient className="h-full p-6">
                    <div className="text-center mb-4">
                      <h4 className={`${terminal.className} text-lg text-rh-yellow mb-2`}>
                        {category.title}
                      </h4>
                      <p className="text-sm text-rh-white/70">
                        {category.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {category.prizes.map((prize, prizeIndex) => (
                        <div key={prizeIndex} className="flex items-center justify-between p-3 rounded-lg bg-rh-white/5 hover:bg-rh-white/10 transition-colors">
                          <div className="flex items-center space-x-2">
                            <AnimatedIcon
                              icon={prize.icon}
                              size="sm"
                              color={prize.color}
                              animation="glow"
                            />
                            <span className="font-medium text-rh-white text-sm">
                              {prize.place}
                            </span>
                          </div>
                          <span className="text-rh-yellow font-bold text-xs">
                            {prize.amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                </div>
              ))}
            </div>
          </div>


        </div>
      </section>
    </div>
  );
};
