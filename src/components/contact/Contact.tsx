import React from "react";
import Link from "next/link";
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
      className="relative bg-gradient-to-b from-rh-background via-rh-navy-dark to-rh-navy-light text-white py-20 px-5 md:px-10 xl:py-28"
    >
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
                <Link href="mailto:rockethacks@utoledo.edu">
                  <ModernButton 
                    variant="primary" 
                    size="lg" 
                    className="w-full group"
                  >
                    <div className="flex items-center justify-center space-x-3">
                      <MdEmail className="group-hover:scale-110 transition-transform" size={20} />
                      <div className="text-left">
                        <div className="font-semibold">Email Us</div>
                        <div className="text-sm opacity-90">rockethacks@utoledo.edu</div>
                      </div>
                    </div>
                  </ModernButton>
                </Link>

                {/* Discord Button */}
                <Link 
                  href="https://discord.gg/nFKYdrqQ3g"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ModernButton 
                    variant="secondary" 
                    size="lg" 
                    className="w-full group"
                  >
                    <div className="flex items-center justify-center space-x-3">
                      <FaDiscord className="group-hover:scale-110 transition-transform" size={20} />
                      <div className="text-left">
                        <div className="font-semibold">Join Discord</div>
                        <div className="text-sm opacity-90">Community Chat</div>
                      </div>
                    </div>
                  </ModernButton>
                </Link>
              </div>

              {/* Additional Contact Info */}
              <div className="pt-6 border-t border-rh-white/10 w-full">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="text-rh-yellow font-semibold mb-1">Response Time</div>
                    <div className="text-sm text-rh-white/70">Within 24 hours</div>
                  </div>
                  <div>
                    <div className="text-rh-yellow font-semibold mb-1">Best For</div>
                    <div className="text-sm text-rh-white/70">General inquiries</div>
                  </div>
                  <div>
                    <div className="text-rh-yellow font-semibold mb-1">Office Hours</div>
                    <div className="text-sm text-rh-white/70">Mon-Fri, 9AM-5PM EST</div>
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
