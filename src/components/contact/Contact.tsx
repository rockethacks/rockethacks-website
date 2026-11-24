import React from "react";
import Link from "next/link";
import Image from "next/image";
import { terminal } from "../../app/fonts/fonts";
import { GlassCard } from "../ui/glass-card";
import { ModernButton } from "../ui/modern-button";
import { AnimatedIcon } from "../ui/animated-icon";
import { MdEmail } from "react-icons/md";
import { FaDiscord, FaQuestionCircle } from "react-icons/fa";

export default function Contact() {
  return (
    <section
      id="contact"
      className="relative text-white py-20 px-5 md:px-10 xl:py-28 overflow-hidden"
    >
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-rh-background/85 via-rh-navy-dark/75 to-rh-navy-light/85"></div>
      
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25px 25px, rgba(255, 196, 90, 0.3) 2px, transparent 0)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Section Header */}
        <div className="mb-12 animate-slide-up">
          <h2 className={`${terminal.className} heading-lg gradient-text mb-6 uppercase tracking-wider`}>
            Have Any Questions?
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-rh-yellow to-rh-orange mx-auto mb-8 rounded-full"></div>
          <p className="text-lg leading-relaxed text-rh-white/90 max-w-2xl mx-auto">
            We&apos;re here to help! Reach out to us through any of these channels 
            and we&apos;ll get back to you as soon as possible.
          </p>
        </div>

        {/* Contact Methods */}
        <div className="animate-fade-scale">
          <GlassCard variant="strong" gradient className="p-8">
            <div className="flex flex-col items-center space-y-8">
              <AnimatedIcon 
                icon={<FaQuestionCircle size={40} />}
                size="xl"
                color="yellow"
                animation="float"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
                {/* Email Button */}
                <ModernButton
                  asChild
                  variant="primary"
                  size="lg"
                  className="h-[76px] w-full px-5 py-3 group"
                >
                  <Link href="mailto:rockethacks@utoledo.edu">
                    <span className="grid w-full max-w-[250px] grid-cols-[28px_minmax(0,1fr)] items-center gap-3 text-left">
                      <MdEmail
                        className="h-6 w-6 shrink-0 transition-transform group-hover:scale-110"
                        aria-hidden="true"
                      />
                      <span className="min-w-0">
                        <span className="block font-semibold leading-tight">
                          Email Us
                        </span>
                        <span className="mt-1 block break-all text-xs leading-tight opacity-90">
                          rockethacks@utoledo.edu
                        </span>
                      </span>
                    </span>
                  </Link>
                </ModernButton>

                {/* Discord Button */}
                <ModernButton
                  asChild
                  variant="secondary"
                  size="lg"
                  className="h-[76px] w-full px-5 py-3 group"
                >
                  <Link
                    href="https://discord.gg/nFKYdrqQ3g"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="grid w-full max-w-[250px] grid-cols-[28px_minmax(0,1fr)] items-center gap-3 text-left">
                      <FaDiscord
                        className="h-6 w-6 shrink-0 transition-transform group-hover:scale-110"
                        aria-hidden="true"
                      />
                      <span className="min-w-0">
                        <span className="block font-semibold leading-tight">
                          Join Discord
                        </span>
                        <span className="mt-1 block text-xs leading-tight opacity-90">
                          Community Chat
                        </span>
                      </span>
                    </span>
                  </Link>
                </ModernButton>
              </div>

              {/* Additional Contact Info */}
              <div className="pt-6 border-t border-rh-white/10 w-full">
                <div className="mx-auto grid max-w-xl grid-cols-1 gap-6 text-center sm:grid-cols-2">
                  <div>
                    <div className="text-rh-yellow font-semibold mb-1">Response Time</div>
                    <div className="text-sm text-rh-white/70">Within 24 hours</div>
                  </div>
                  <div>
                    <div className="text-rh-yellow font-semibold mb-1">Best For</div>
                    <div className="text-sm text-rh-white/70">General inquiries</div>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </section>
  );
}
