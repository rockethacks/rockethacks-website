import React from "react";
import Image from "next/image";
import Link from "next/link";
import { terminal } from "../../app/fonts/fonts";

export default function Hero() {
  return (
    <div>
      <section
        id="home"
        className="home text-white relative text-center min-h-screen min-h-[100dvh] overflow-hidden flex items-center justify-center"
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

        {/* Content */}
        <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Centered Content */}
          <div className="text-center space-y-6 animate-slide-up">
            {/* Main Heading */}
            <div className="space-y-2 mt-4">
              <h1 className={`${terminal.className} heading-xl gradient-text uppercase tracking-wider font-bold animate-slide-up animate-duration-slow`}>
                RocketHacks 2026
              </h1>
              
              <h2 className={`${terminal.className} heading-md text-rh-white font-light uppercase tracking-wide animate-slide-up animate-delay-300 animate-duration-slow`}>
                The Biggest Hackathon in the Midwest
              </h2>
            </div>

            {/* Coming Soon Message */}
            <div className="max-w-2xl mx-auto animate-fade-scale animate-delay-600 animate-duration-slow">
              <h3 className={`${terminal.className} heading-sm text-rh-yellow mb-3 animate-heartbeat`}>
                Coming Spring 2026
              </h3>
              <p className="text-body-lg text-rh-white/95 leading-relaxed">
                Join us for an incredible 24-hour journey of innovation, collaboration, and problem-solving.
              </p>
            </div>

            {/* Call to Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center animate-fade-scale animate-delay-800 animate-duration-slow">
              <Link
                href="#about"
                className="btn-primary px-8 py-4 text-body font-semibold inline-flex items-center justify-center min-h-[48px] sm:min-h-[52px] hover:animate-wiggle"
              >
                Learn More
              </Link>
              <Link
                href="/documents/sponsorship-packet.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary px-8 py-4 text-body font-semibold inline-flex items-center justify-center min-h-[48px] sm:min-h-[52px] hover:animate-bounce-subtle"
              >
                Sponsor Us
              </Link>
            </div>

            {/* Location */}
            <div className="mb-16 animate-fade-scale animate-delay-1000 animate-duration-slow">
              <Link
                href="https://maps.app.goo.gl/xC2YjujFcZfS65PF8"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-3 text-body-lg text-rh-white/85 hover:text-rh-yellow transition-all duration-300 group glass-subtle px-4 py-2 rounded-xl hover:animate-bounce-subtle"
                aria-label="View location on Google Maps"
              >
                <svg 
                  className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 group-hover:animate-wiggle transition-transform" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <span className="underline decoration-rh-yellow/50 group-hover:decoration-rh-yellow transition-all duration-300">
                  University of Toledo, Toledo, OH
                </span>
              </Link>
            </div>

            {/* Scroll Indicator */}
            <div className="flex justify-center animate-fade-scale animate-delay-1200 animate-duration-slow">
              <div className="w-6 h-10 border-2 border-rh-white/50 rounded-full flex justify-center animate-bounce-subtle glass-subtle">
                <div className="w-1 h-3 bg-rh-yellow rounded-full mt-2 animate-heartbeat"></div>
              </div>
            </div>
          </div>

          {/* Floating Elements */}
          <div className="absolute top-20 left-10 w-4 h-4 bg-rh-yellow rounded-full animate-float opacity-60 animate-delay-200"></div>
          <div className="absolute top-40 right-20 w-6 h-6 bg-rh-orange rounded-full animate-float opacity-40 animate-delay-400"></div>
          <div className="absolute bottom-32 left-20 w-3 h-3 bg-rh-purple-light rounded-full animate-float opacity-70 animate-delay-600"></div>
          <div className="absolute bottom-20 right-10 w-5 h-5 bg-rh-pink rounded-full animate-float opacity-50 animate-delay-800"></div>
          
          {/* Additional floating elements for more visual interest */}
          <div className="absolute top-60 left-1/4 w-2 h-2 bg-rh-yellow rounded-full animate-float opacity-40 animate-delay-1000"></div>
          <div className="absolute top-80 right-1/3 w-3 h-3 bg-rh-orange rounded-full animate-float opacity-50 animate-delay-1200"></div>
          <div className="absolute bottom-40 left-1/3 w-2 h-2 bg-rh-purple-light rounded-full animate-float opacity-60 animate-delay-1400"></div>
        </div>
      </section>
    </div>
  );
}
