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
  // Organize sponsors by tier
  const mainSponsors = sponsors.filter(s => 
    ['College-of-engineering', 'eecs', 'spoke', 'Nysus', 'actual-tech'].some(name => s.src?.includes(name)) ||
    s.icon === 'github'
  );
  
  const intermediateSponsors = sponsors.filter(s => 
    ['mercy', 'firstsolar', 'cdw', 'codeecho'].some(name => s.src?.includes(name)) ||
    s.icon === 'aws'
  );
  
  const mainInKindSponsors = sponsors.filter(s => 
    ['Perplexity', 'Mistral', 'vercel', 'warp', 'sprint', 'Hugging'].some(name => s.src?.includes(name))
  );
  
  const lessImportantSponsors = sponsors.filter(s => 
    ['xyz', 'photoroom', 'orielly', 'standout'].some(name => s.src?.includes(name))
  );

  // Duplicate sponsors for seamless infinite scroll
  const duplicateArray = (arr: SponsorType[]) => [...arr, ...arr, ...arr];

  return (
    <div>
      <section
        id="sponsor"
        className="relative text-white pt-4 sm:pt-6 md:pt-8 pb-16 sm:pb-20 md:pb-24 px-4 sm:px-5 md:px-10 overflow-hidden"
      >
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/assets/rh_26/rh_26_folder/rh_bg_2.png"
            alt="Sponsor Background"
            fill
            className="object-cover object-center"
            quality={85}
            sizes="100vw"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-rh-navy-light/85 via-rh-navy-dark/75 to-rh-background/85"></div>
        </div>
        
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25px 25px, rgba(255, 196, 90, 0.3) 2px, transparent 0)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto">
          {/* Past Sponsors Carousel Section */}
          <div id="past-sponsors" className="animate-fade-scale">
            <div className="text-center mb-8 md:mb-12">
              <h3 className={`${terminal.className} heading-lg gradient-text mb-6 uppercase tracking-wider`}>
                Past Sponsors
              </h3>
              <div className="w-24 h-1 bg-gradient-to-r from-rh-yellow to-rh-orange mx-auto mb-6 rounded-full"></div>
              
              {/* Sponsorship CTA - Minimalistic Text Block */}
              <div className="px-4">
                <p className="text-rh-white/80 text-sm md:text-base max-w-2xl mx-auto">
                  Interested in partnering with us?{" "}
                  <Link
                    href="/documents/sponsorship-packet.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-rh-yellow hover:text-rh-orange transition-colors duration-300 underline decoration-rh-yellow/50 hover:decoration-rh-orange underline-offset-4 font-medium"
                  >
                    View our sponsorship opportunities
                  </Link>
                  {" "}or{" "}
                  <Link
                    href="mailto:rockethacks@utoledo.edu?subject=Sponsorship Inquiry - RocketHacks 2026"
                    className="text-rh-yellow hover:text-rh-orange transition-colors duration-300 underline decoration-rh-yellow/50 hover:decoration-rh-orange underline-offset-4 font-medium"
                  >
                    contact us
                  </Link>
                  {" "}to learn more.
                </p>
              </div>
            </div>
            
            <div className="space-y-6 md:space-y-8 overflow-hidden px-4 md:px-0">
              {/* Row 1: Main Sponsors - Left to Right */}
              <div className="group relative">
                <div className="flex gap-4 md:gap-10 animate-scroll-left group-hover:pause-animation">
                  {duplicateArray(mainSponsors).map((sponsor, index) => (
                    <Link
                      key={`main-${index}`}
                      href={sponsor.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0"
                    >
                      <div className="glass-card p-4 md:p-8 h-24 md:h-40 w-40 md:w-64 flex items-center justify-center hover:border-rh-yellow/50 transition-all duration-300 hover:scale-105 rounded-xl bg-rh-navy-light/30">
                        {sponsor.type === "image" && sponsor.src ? (
                          <Image
                            src={sponsor.src}
                            alt={sponsor.alt}
                            width={220}
                            height={110}
                            className="object-contain max-w-full max-h-full w-auto h-auto transition-all duration-300 hover:brightness-110"
                          />
                        ) : sponsor.type === "icon" && sponsor.icon === "github" ? (
                          <DiGithubFull className="h-12 w-12 md:h-20 md:w-20 text-rh-white transition-all duration-300 hover:scale-110" />
                        ) : null}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Row 2: Intermediate Sponsors - Right to Left */}
              <div className="group relative">
                <div className="flex gap-4 md:gap-8 animate-scroll-right group-hover:pause-animation">
                  {duplicateArray(intermediateSponsors).map((sponsor, index) => (
                    <Link
                      key={`intermediate-${index}`}
                      href={sponsor.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0"
                    >
                      <div className="glass-card p-3 md:p-5 h-20 md:h-28 w-32 md:w-40 flex items-center justify-center hover:border-rh-yellow/50 transition-all duration-300 hover:scale-105 rounded-xl bg-rh-navy-light/30">
                        {sponsor.type === "image" && sponsor.src ? (
                          <Image
                            src={sponsor.src}
                            alt={sponsor.alt}
                            width={140}
                            height={70}
                            className="object-contain max-w-full max-h-full w-auto h-auto transition-all duration-300 hover:brightness-110"
                          />
                        ) : sponsor.type === "icon" && sponsor.icon === "aws" ? (
                          <FaAws className="h-10 w-10 md:h-14 md:w-14 text-rh-white transition-all duration-300 hover:scale-110" />
                        ) : null}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Row 3: Main In-Kind Sponsors - Left to Right */}
              <div className="group relative">
                <div className="flex gap-4 md:gap-8 animate-scroll-left group-hover:pause-animation">
                  {duplicateArray(mainInKindSponsors).map((sponsor, index) => (
                    <Link
                      key={`inkind-${index}`}
                      href={sponsor.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0"
                    >
                      <div className="glass-card p-3 md:p-5 h-20 md:h-28 w-32 md:w-40 flex items-center justify-center hover:border-rh-yellow/50 transition-all duration-300 hover:scale-105 rounded-xl bg-rh-navy-light/30">
                        <Image
                          src={sponsor.src!}
                          alt={sponsor.alt}
                          width={140}
                          height={70}
                          className="object-contain max-w-full max-h-full w-auto h-auto transition-all duration-300 hover:brightness-110"
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Row 4: Less Important Sponsors - Right to Left */}
              <div className="group relative">
                <div className="flex gap-3 md:gap-6 animate-scroll-right group-hover:pause-animation">
                  {duplicateArray(lessImportantSponsors).map((sponsor, index) => (
                    <Link
                      key={`less-${index}`}
                      href={sponsor.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0"
                    >
                      <div className="glass-card p-3 md:p-4 h-18 md:h-24 w-28 md:w-32 flex items-center justify-center hover:border-rh-yellow/50 transition-all duration-300 hover:scale-105 rounded-xl bg-rh-navy-light/30">
                        <Image
                          src={sponsor.src!}
                          alt={sponsor.alt}
                          width={110}
                          height={55}
                          className="object-contain max-w-full max-h-full w-auto h-auto transition-all duration-300 hover:brightness-110"
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <style jsx>{`
            @keyframes scroll-left {
              0% {
                transform: translateX(0);
              }
              100% {
                transform: translateX(-33.333%);
              }
            }

            @keyframes scroll-right {
              0% {
                transform: translateX(-33.333%);
              }
              100% {
                transform: translateX(0);
              }
            }

            .animate-scroll-left {
              animation: scroll-left 40s linear infinite;
              will-change: transform;
            }

            .animate-scroll-right {
              animation: scroll-right 40s linear infinite;
              will-change: transform;
            }

            .pause-animation {
              animation-play-state: paused !important;
            }

            /* GPU acceleration for smooth animations */
            .animate-scroll-left,
            .animate-scroll-right {
              transform: translateZ(0);
              backface-visibility: hidden;
              perspective: 1000px;
            }
          `}</style>

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
                  We&apos;re actively working with amazing companies and organizations 
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
