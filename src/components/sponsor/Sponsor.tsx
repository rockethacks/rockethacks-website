import React from "react";
import Image from "next/image";
import Link from "next/link";
import { FaAws, FaHandshake, FaRocket } from "react-icons/fa";
import { DiGithubFull } from "react-icons/di";
import { HiMail } from "react-icons/hi";
import { terminal } from "@/app/fonts/fonts";
import { GlassCard } from "../ui/glass-card";
import { ModernButton } from "../ui/modern-button";
import { AnimatedIcon } from "../ui/animated-icon";

// defining SponsorType and SponsorProps
export type SponsorType = {
  type: "image" | "icon";
  src?: string;
  icon?: "github" | "aws";
  alt: string;
  link: string;
  tier?: "platinum" | "gold" | "silver" | "bronze" | "partner";
};

interface SponsorProps {
  sponsors: SponsorType[];
}

const Sponsor: React.FC<SponsorProps> = ({ sponsors }) => {
  // Group sponsors by tier for better organization
  const sponsorsByTier = sponsors.reduce((acc, sponsor) => {
    const tier = sponsor.tier || 'partner';
    if (!acc[tier]) {
      acc[tier] = [];
    }
    acc[tier].push(sponsor);
    return acc;
  }, {} as Record<string, SponsorType[]>);

  const tierConfig = {
    platinum: { name: 'Platinum Partners', size: 'large', cols: 'grid-cols-1 md:grid-cols-2' },
    gold: { name: 'Gold Sponsors', size: 'medium', cols: 'grid-cols-2 md:grid-cols-3' },
    silver: { name: 'Silver Sponsors', size: 'medium', cols: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' },
    bronze: { name: 'Bronze Sponsors', size: 'small', cols: 'grid-cols-3 md:grid-cols-4 lg:grid-cols-6' },
    partner: { name: 'Community Partners', size: 'small', cols: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5' }
  };

  return (
    <div>
      <section
        id="sponsor"
        className="relative bg-gradient-to-b from-rh-navy-light via-rh-navy-dark to-rh-background text-white py-20 px-5 md:px-10 xl:py-28"
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
              Our Sponsors
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-rh-yellow to-rh-orange mx-auto mb-8 rounded-full"></div>
            <p className="text-lg leading-relaxed text-rh-white/90 max-w-3xl mx-auto">
              We're grateful to our incredible sponsors who make RocketHacks possible. 
              Together, we're empowering the next generation of innovators.
            </p>
          </div>

          {/* Sponsorship CTA Section */}
          <div className="mb-16 animate-fade-scale">
            <GlassCard variant="strong" gradient className="max-w-4xl mx-auto p-8 text-center">
              <div className="flex flex-col items-center space-y-6">
                <AnimatedIcon 
                  icon={<FaHandshake size={40} />}
                  size="xl"
                  color="yellow"
                  animation="float"
                />
                <div>
                  <h3 className={`${terminal.className} text-2xl text-rh-yellow mb-4`}>
                    Partner With RocketHacks 2026
                  </h3>
                  <p className="text-rh-white/90 mb-6 max-w-2xl">
                    Join us in fostering innovation and supporting the next generation of tech leaders. 
                    Discover how your organization can make a meaningful impact.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
                  <Link
                    href="/documents/sponsorship-packet.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ModernButton variant="primary" size="lg" className="w-full sm:w-auto">
                      <FaRocket className="mr-2" size={18} />
                      View Sponsorship Packet
                    </ModernButton>
                  </Link>
                  
                  <Link
                    href="mailto:rockethacks@utoledo.edu?subject=Sponsorship Inquiry - RocketHacks 2026&body=Dear RocketHacks Team,%0A%0AI hope this message finds you well. I am reaching out on behalf of [Company Name] to express our interest in sponsoring RocketHacks 2026.%0A%0AAfter reviewing your event details, we believe this aligns perfectly with our commitment to supporting innovation and empowering the next generation of tech talent. We would love to explore potential partnership opportunities.%0A%0ACould we schedule a time to discuss:%0A• Available sponsorship tiers and benefits%0A• Custom partnership opportunities%0A• How we can best support your event and participants%0A%0APlease let me know your availability for a brief call or meeting.%0A%0AThank you for your time and consideration.%0A%0ABest regards,%0A[Your Name]%0A[Your Title]%0A[Company Name]%0A[Email Address]%0A[Phone Number]"
                  >
                    <ModernButton variant="secondary" size="lg" className="w-full sm:w-auto">
                      <HiMail className="mr-2" size={18} />
                      Contact Us
                    </ModernButton>
                  </Link>
                </div>
              </div>
            </GlassCard>
          </div>
          {/* Sponsors Grid */}
          <div className="space-y-12">
            {Object.entries(tierConfig).map(([tier, config]) => {
              const tierSponsors = sponsorsByTier[tier];
              if (!tierSponsors || tierSponsors.length === 0) return null;

              return (
                <div key={tier} className="animate-fade-scale">
                  <h3 className={`${terminal.className} 
                    ${tier === 'partner' ? 'text-3xl md:text-4xl' : 'text-xl'} 
                    text-rh-yellow text-center mb-8 uppercase tracking-wider font-bold
                    ${tier === 'partner' ? 'mb-12' : 'mb-8'}
                  `}>
                    {config.name}
                  </h3>
                  
                  <div className={`grid ${config.cols} gap-6 md:gap-8 justify-items-center items-center`}>
                    {tierSponsors.map((sponsor, index) => (
                      <Link
                        key={index}
                        href={sponsor.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block"
                      >
                        <GlassCard className="p-6 hover:border-rh-yellow/50 transition-all duration-300 group-hover:scale-105">
                          <div className="flex items-center justify-center h-full">
                            {sponsor.type === "image" && sponsor.src ? (
                              <Image
                                src={sponsor.src}
                                alt={sponsor.alt}
                                width={config.size === 'large' ? 200 : config.size === 'medium' ? 150 : 120}
                                height={config.size === 'large' ? 200 : config.size === 'medium' ? 150 : 120}
                                className={`
                                  object-contain transition-all duration-300 group-hover:brightness-110
                                  ${config.size === 'large' ? 'max-w-[200px] max-h-[100px]' : 
                                    config.size === 'medium' ? 'max-w-[150px] max-h-[75px]' : 
                                    'max-w-[120px] max-h-[60px]'}
                                  ${sponsor.src?.includes("spoke") ? "bg-white p-2 rounded" : ""}
                                `}
                              />
                            ) : sponsor.type === "icon" ? (
                              <div className="flex items-center justify-center">
                                {sponsor.icon === "github" ? (
                                  <DiGithubFull 
                                    className={`transition-all duration-300 group-hover:scale-110 text-rh-white group-hover:text-rh-yellow
                                      ${config.size === 'large' ? 'h-24 w-24' : 
                                        config.size === 'medium' ? 'h-20 w-20' : 
                                        'h-16 w-16'}`} 
                                  />
                                ) : sponsor.icon === "aws" ? (
                                  <FaAws 
                                    className={`transition-all duration-300 group-hover:scale-110 text-rh-white group-hover:text-rh-yellow
                                      ${config.size === 'large' ? 'h-24 w-24' : 
                                        config.size === 'medium' ? 'h-20 w-20' : 
                                        'h-16 w-16'}`} 
                                  />
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        </GlassCard>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* If no sponsors, show fallback */}
          {sponsors.length === 0 && (
            <div className="text-center py-16">
              <GlassCard className="max-w-2xl mx-auto p-12">
                <AnimatedIcon 
                  icon={<FaRocket size={48} />}
                  size="xl"
                  color="yellow"
                  animation="float"
                  className="mx-auto mb-6"
                />
                <h3 className={`${terminal.className} text-2xl text-rh-yellow mb-4`}>
                  Sponsors Coming Soon
                </h3>
                <p className="text-rh-white/80 mb-6">
                  We're actively working with amazing companies and organizations 
                  to make RocketHacks 2026 extraordinary.
                </p>
                <Link
                  href="/documents/sponsorship-packet.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ModernButton variant="primary">
                    Become Our First Sponsor
                  </ModernButton>
                </Link>
              </GlassCard>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Sponsor;
