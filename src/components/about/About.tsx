import React from "react";
import { FaUsers } from "react-icons/fa6";
import { terminal } from "../../app/fonts/fonts";
import Link from "next/link";

export default function About() {
  return (
    <div>
      <section
        id="about"
        aria-label="About RocketHacks"
        className="relative text-white py-20 px-5 md:px-10 xl:py-28 overflow-hidden"
      >
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-rh-background/85 via-rh-navy-dark/75 to-rh-navy-light/85"></div>

        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 25px 25px, rgba(255, 196, 90, 0.3) 2px, transparent 0)`,
              backgroundSize: "50px 50px",
            }}
          ></div>
        </div>

        <div className="relative max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16 animate-slide-up">
            <h2
              className={`${terminal.className} heading-lg gradient-text mb-6 uppercase tracking-wider`}
            >
              About RocketHacks
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-rh-yellow to-rh-orange mx-auto mb-8 rounded-full"></div>
            <p className="text-lg leading-relaxed text-rh-white/90 max-w-4xl mx-auto">
              RocketHacks is a 24-hour hackathon hosted by the University of
              Toledo dedicated to fostering innovation and problem-solving among
              students from the Midwest and beyond. This event brings together
              talented students—from budding programmers to visionary
              designers—to build real solutions to real-world challenges. With
              an emphasis on collaboration, creativity, and technical skills,
              RocketHacks will empower students to turn their ideas into
              impactful projects.
            </p>
          </div>

          {/* Temporarily hidden sections - uncomment to enable */}
          {/*
          {/* Tracks Section */}
          {/*
          <div className="text-center mb-12">
            <h2 className={`${terminal.className} heading-lg gradient-text mb-6 uppercase tracking-wider`}>
              Competition Tracks
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-rh-yellow to-rh-orange mx-auto mb-8 rounded-full"></div>
            <p className="text-lg text-rh-white/80 max-w-3xl mx-auto">
              Choose your path and build solutions that matter. Each track focuses on real-world challenges 
              where technology can make a meaningful impact.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-scale" role="list">
            {/* Green Innovation Track */}
          {/*
            <div className="card group text-center p-6 hover:scale-105 transition-all duration-500" role="listitem">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center group-hover:animate-pulse">
                <FaLeaf size={32} className="text-white" />
              </div>
              <h3 className={`${terminal.className} text-xl mb-3 text-green-400 group-hover:text-green-300 transition-colors`}>
                GREEN INNOVATION
              </h3>
              <p className="text-sm text-rh-white/80 leading-relaxed">
                Build solutions that support sustainability and a cleaner future for our planet.
              </p>
            </div>

            {/* MedTech Track */}
          {/*
            <div className="card group text-center p-6 hover:scale-105 transition-all duration-500" role="listitem">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-400 to-pink-600 flex items-center justify-center group-hover:animate-pulse">
                <FaHeartbeat size={32} className="text-white" />
              </div>
              <h3 className={`${terminal.className} text-xl mb-3 text-red-400 group-hover:text-red-300 transition-colors`}>
                MEDTECH
              </h3>
              <p className="text-sm text-rh-white/80 leading-relaxed">
                Create technologies that improve health, wellness, and accessibility for everyone.
              </p>
            </div>

            {/* Next Gen AI Track */}
          {/*
            <div className="card group text-center p-6 hover:scale-105 transition-all duration-500" role="listitem">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-400 to-blue-600 flex items-center justify-center group-hover:animate-pulse">
                <GiBrain size={32} className="text-white" />
              </div>
              <h3 className={`${terminal.className} text-xl mb-3 text-purple-400 group-hover:text-purple-300 transition-colors`}>
                NEXT GEN AI
              </h3>
              <p className="text-sm text-rh-white/80 leading-relaxed">
                Explore the future of artificial intelligence and its real-world impact on society.
              </p>
            </div>

            {/* Hardware Track */}
          {/*
            <div className="card group text-center p-6 hover:scale-105 transition-all duration-500" role="listitem">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-400 to-yellow-600 flex items-center justify-center group-hover:animate-pulse">
                <FaMicrochip size={32} className="text-white" />
              </div>
              <h3 className={`${terminal.className} text-xl mb-3 text-orange-400 group-hover:text-orange-300 transition-colors`}>
                HARDWARE
              </h3>
              <p className="text-sm text-rh-white/80 leading-relaxed">
                Design and prototype smart devices that bring innovative ideas into reality.
              </p>
            </div>
          </div>

          {/* Call to Action */}
          {/*
          <div className="text-center mt-16">
            <div className="glass-strong rounded-3xl p-8 max-w-2xl mx-auto">
              <h3 className={`${terminal.className} text-2xl text-rh-yellow mb-4`}>
                Ready to Make an Impact?
              </h3>
              <p className="text-rh-white/90 mb-6">
                Join hundreds of students from across the Midwest as we hack for a better tomorrow.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="#contact"
                  className="btn-primary px-6 py-3"
                >
                  Stay Updated
                </Link>
                <Link
                  href="/documents/sponsorship-packet.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary px-6 py-3"
                >
                  Become a Sponsor
                </Link>
              </div>
            </div>
          </div>
          */}
        </div>
      </section>
    </div>
  );
}
