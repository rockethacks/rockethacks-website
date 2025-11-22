"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { terminal } from "../../app/fonts/fonts";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function Hero() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return (
    <div className="pt-24 sm:pt-20">
      {/* Spacer for fixed navbar - increased for smaller screens */}
      <section
        id="home"
        className="home text-white relative text-center overflow-hidden flex items-center justify-center"
        style={{
          minHeight: 'calc(100dvh - 80px)', // Dynamic viewport minus navbar
          paddingTop: 'max(3rem, 8vh)', // Increased from 2rem/5vh to 3rem/8vh
          paddingBottom: 'max(2rem, 5vh)'
        }}
      >
        {/* Background Image with improved overlay */}
        <div className="absolute inset-0">
          <Image
            src="/assets/rh_26/rh_26_folder/rh_26_bg.png"
            alt="RocketHacks 2026 Background"
            fill
            className="object-cover object-center"
            priority
            quality={75}
            sizes="100vw"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
          />
          {/* Gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60"></div>
        </div>

        {/* Content - Viewport-aware spacing */}
        <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Centered Content */}
          <div className="text-center space-y-[clamp(1rem,3vh,2rem)] animate-slide-up">
            {/* Main Heading - Aggressive scaling prevention */}
            <div className="space-y-2">
              <h1 
                className={`${terminal.className} gradient-text uppercase tracking-wider font-bold`}
                style={{
                  fontSize: 'clamp(2rem, 6vw, 5rem)', // Reduced max from 6rem to 5rem
                  lineHeight: '1',
                  marginBottom: '0.5rem'
                }}
              >
                RocketHacks 2026
              </h1>
              
              <h2 
                className={`${terminal.className} text-rh-white font-light uppercase tracking-wide`}
                style={{
                  fontSize: 'clamp(0.875rem, 2.5vw, 1.75rem)', // Reduced from 2rem to 1.75rem
                  lineHeight: '1.2',
                  marginTop: '0.5rem'
                }}
              >
                The Biggest Hackathon in the Midwest
              </h2>
            </div>

            {/* Event Details - Compact on small screens */}
            <div
              className="glass rounded-2xl max-w-2xl mx-auto"
              style={{
                padding: 'clamp(1.25rem, 3vw, 2.5rem)'
              }}
            >
              <h3
                className={`${terminal.className} text-rh-yellow font-bold`}
                style={{
                  fontSize: 'clamp(1.25rem, 4vw, 2.5rem)',
                  marginBottom: 'clamp(0.75rem, 1.5vh, 1.25rem)'
                }}
              >
                Register NOW for RocketHacks!
              </h3>
              <div
                className="text-rh-white/90 leading-relaxed space-y-2"
                style={{
                  fontSize: 'clamp(1rem, 2.5vw, 1.5rem)'
                }}
              >
                <p className="font-semibold text-rh-yellow/90">
                  March 14th & 15th, 2026
                </p>
                <p className="text-rh-white/80" style={{ fontSize: 'clamp(0.875rem, 2.5vw, 1.25rem)' }}>
                  University of Toledo<br />College of Engineering
                </p>
              </div>
            </div>

            {/* Call to Action Button - Responsive sizing */}
            <div className="flex items-center justify-center">
              <Link
                href={user ? "/dashboard" : "/login"}
                className="btn-primary font-semibold inline-flex items-center justify-center w-full sm:w-auto"
                style={{
                  padding: 'clamp(0.75rem, 2vh, 1rem) clamp(1.5rem, 4vw, 2.5rem)',
                  fontSize: 'clamp(0.875rem, 2vw, 1.125rem)',
                  minHeight: '44px'
                }}
              >
                {loading ? "Loading..." : user ? "Go to Dashboard" : "Apply Now"}
              </Link>
            </div>

            {/* Location - Compact */}
            <div style={{ marginTop: 'clamp(1rem, 2vh, 2rem)' }}>
              <Link
                href="https://www.google.com/maps/place/University+of+Toledo+College+of+Engineering/@41.6562443,-83.6111421,17.04z/data=!4m10!1m2!2m1!1suniversity+of+toledo+engineering!3m6!1s0x883c78b11a8e7c21:0x94cf93f50c1b110f!8m2!3d41.6557317!4d-83.6063728!15sCiB1bml2ZXJzaXR5IG9mIHRvbGVkbyBlbmdpbmVlcmluZ1oiIiB1bml2ZXJzaXR5IG9mIHRvbGVkbyBlbmdpbmVlcmluZ5IBFXVuaXZlcnNpdHlfZGVwYXJ0bWVudJoBJENoZERTVWhOTUc5blMwVkpRMEZuU1VSYWMwNUhkREpuUlJBQqoBVAoJL20vMDJrbG55EAEyHxABIhuAkM289MsT1UCrbBdJG1-sfW28zZ-RFzOAfsAyJBACIiB1bml2ZXJzaXR5IG9mIHRvbGVkbyBlbmdpbmVlcmluZ-ABAPoBBAgAED4!16s%2Fg%2F11c555sm9s?entry=ttu&g_ep=EgoyMDI1MTExMS4wIKXMDSoASAFQAw%3D%3D"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-rh-white/80 hover:text-rh-yellow transition-colors duration-300 group"
                style={{
                  gap: 'clamp(0.5rem, 1vw, 0.75rem)',
                  fontSize: 'clamp(0.875rem, 2.5vw, 1.25rem)'
                }}
                aria-label="View location on Google Maps"
              >
                <svg
                  className="group-hover:scale-110 transition-transform flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  style={{
                    width: 'clamp(1.25rem, 3vw, 2rem)',
                    height: 'clamp(1.25rem, 3vw, 2rem)'
                  }}
                >
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <span className="underline decoration-rh-yellow/50 group-hover:decoration-rh-yellow">
                  University of Toledo, Toledo, OH
                </span>
              </Link>
            </div>

            {/* Scroll Indicator - Hidden on very small screens */}
            <div className="hidden sm:flex justify-center" style={{ marginTop: 'clamp(1rem, 2vh, 1.5rem)' }}>
              <div className="w-6 h-10 border-2 border-rh-white/50 rounded-full flex justify-center animate-bounce">
                <div className="w-1 h-3 bg-rh-yellow rounded-full mt-2 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Floating Elements - Viewport aware positioning */}
          <div className="absolute left-[5%] w-4 h-4 bg-rh-yellow rounded-full animate-float opacity-60" style={{ top: 'max(120px, 12vh)' }}></div>
          <div className="absolute right-[10%] w-6 h-6 bg-rh-orange rounded-full animate-float opacity-40" style={{ top: 'max(160px, 18vh)', animationDelay: '1s' }}></div>
          <div className="absolute left-[10%] w-3 h-3 bg-rh-purple-light rounded-full animate-float opacity-70 hidden md:block" style={{ bottom: 'max(120px, 12vh)', animationDelay: '2s' }}></div>
          <div className="absolute right-[5%] w-5 h-5 bg-rh-pink rounded-full animate-float opacity-50 hidden md:block" style={{ bottom: 'max(80px, 8vh)', animationDelay: '0.5s' }}></div>
        </div>
      </section>
    </div>
  );
}
