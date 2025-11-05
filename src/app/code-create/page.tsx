"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { terminal } from "../fonts/fonts";
import { FaCode, FaUsers, FaTrophy, FaUniversity, FaHandshake } from "react-icons/fa";
import { PiTerminalWindow } from "react-icons/pi";
import { GiBrain } from "react-icons/gi";

export default function CodeCreatePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rh-background via-rh-navy-dark to-rh-navy-light text-white">
      {/* Navigation Bar - Simple version */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="block transition-transform hover:scale-105">
              <Image
                src="/assets/rh_26/rh_26_folder/rh_26_bundle_png/rh_26_logo_color_transparent.png"
                alt="RocketHacks 2026"
                width={120}
                height={60}
                className="h-10 sm:h-12 w-auto object-contain"
                priority
                sizes="120px"
                style={{ aspectRatio: '2/1' }}
              />
            </Link>
            <Link
              href="/"
              className="btn-primary px-4 py-2 text-sm"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative text-center min-h-screen flex items-center justify-center pt-20">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25px 25px, rgba(255, 196, 90, 0.3) 2px, transparent 0)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Main Heading */}
          <div className="text-center mb-16 animate-slide-up">
            <h1 className={`${terminal.className} text-[clamp(2rem,5vw,4rem)] gradient-text uppercase tracking-wider font-bold mb-6 px-4`}>
              Code & Create 2025
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-rh-yellow to-rh-orange mx-auto mb-8 rounded-full"></div>
            <p className="text-base sm:text-lg leading-relaxed text-rh-white/90 max-w-4xl mx-auto px-4">
              An inspiring day where high school students discovered the power of programming, 
              explored the University of Toledo&apos;s College of Engineering, and built their first interactive projects.
            </p>
          </div>

          {/* Featured Image */}
          <div className="mb-16 animate-fade-scale px-4">
            <div className="glass rounded-3xl p-4 sm:p-6 max-w-4xl mx-auto">
              <div className="relative aspect-[16/9] overflow-hidden rounded-xl">
                <Image
                  src="/assets/event/13.jpg"
                  alt="Code & Create 2025 - High school students in action"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                  priority
                  quality={85}
                />
              </div>
              <p className="text-center text-rh-white/70 text-xs sm:text-sm mt-4">
                High school developers showcasing their creativity during Code & Create 2025
              </p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center px-4">
            <div className="glass-strong rounded-3xl p-6 sm:p-8 max-w-2xl mx-auto">
              <h3 className={`${terminal.className} text-xl sm:text-2xl text-rh-yellow mb-4`}>
                Ready to Join Next Year?
              </h3>
              <p className="text-sm sm:text-base text-rh-white/90 mb-6">
                Code & Create 2026 is coming soon! Fill out our interest form to be notified when registration opens.
              </p>
              <a
                href="https://docs.google.com/forms/d/17Mm4UXiSANYwftmRhaUssHJhZSQli6Qt3hgtIRFKThE/edit"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary px-6 sm:px-8 py-3 inline-block text-sm sm:text-base"
              >
                Fill Interest Form
              </a>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-32 left-10 w-4 h-4 bg-rh-yellow rounded-full animate-float opacity-60"></div>
        <div className="absolute top-52 right-20 w-6 h-6 bg-rh-orange rounded-full animate-float opacity-40" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-32 left-20 w-3 h-3 bg-rh-purple-light rounded-full animate-float opacity-70" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 right-10 w-5 h-5 bg-rh-pink rounded-full animate-float opacity-50" style={{ animationDelay: '0.5s' }}></div>
      </section>

      {/* Main Agenda Section */}
      <section className="relative py-20 px-5 md:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className={`${terminal.className} heading-lg gradient-text mb-6 uppercase tracking-wider`}>
              Event Highlights
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-rh-yellow to-rh-orange mx-auto mb-8 rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 animate-fade-scale">
            {/* Keynote Session */}
            <div className="glass rounded-2xl p-6 hover:scale-105 transition-all duration-500 hover:shadow-xl">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-rh-yellow to-rh-orange flex items-center justify-center">
                <GiBrain size={32} className="text-rh-navy-dark" />
              </div>
              <h3 className={`${terminal.className} text-xl mb-4 text-rh-yellow text-center`}>
                KEYNOTE SESSION
              </h3>
              <p className="text-rh-white/80 text-sm leading-relaxed">
                Tom Bush, CEO of ActualReality, inspired students to embrace creativity and innovation. 
                He focused on real-world tech applications and encouraged thinking like creators, not just consumers.
              </p>
            </div>

            {/* Campus Tour */}
            <div className="glass rounded-2xl p-5 sm:p-6 hover:scale-105 transition-all duration-500 hover:shadow-xl">
              <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-rh-pink to-rh-purple-dark flex items-center justify-center">
                <FaUniversity size={28} className="text-white sm:w-8 sm:h-8" />
              </div>
              <h3 className={`${terminal.className} text-lg sm:text-xl mb-3 sm:mb-4 text-rh-pink text-center`}>
                CAMPUS TOUR
              </h3>
              <p className="text-rh-white/80 text-xs sm:text-sm leading-relaxed">
                Guided exploration of the College of Engineering, featuring research labs, student organizations, 
                and demonstrations by the Rocketry Club and Formula SAE Team.
              </p>
            </div>

            {/* Programming Workshop */}
            <div className="glass rounded-2xl p-5 sm:p-6 hover:scale-105 transition-all duration-500 hover:shadow-xl">
              <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-rh-purple-light to-rh-navy-light flex items-center justify-center">
                <FaCode size={28} className="text-white sm:w-8 sm:h-8" />
              </div>
              <h3 className={`${terminal.className} text-lg sm:text-xl mb-3 sm:mb-4 text-rh-purple-light text-center`}>
                CODING WORKSHOP
              </h3>
              <p className="text-rh-white/80 text-xs sm:text-sm leading-relaxed">
                Partnering with KoolKatScience, students learned programming through Scratch, 
                covering logic, loops, and interactivity in a creative, beginner-friendly way.
              </p>
            </div>

            {/* Project Development */}
            <div className="glass rounded-2xl p-5 sm:p-6 hover:scale-105 transition-all duration-500 hover:shadow-xl">
              <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                <PiTerminalWindow size={28} className="text-white sm:w-8 sm:h-8" />
              </div>
              <h3 className={`${terminal.className} text-lg sm:text-xl mb-3 sm:mb-4 text-green-400 text-center`}>
                PROJECT BUILD
              </h3>
              <p className="text-rh-white/80 text-xs sm:text-sm leading-relaxed">
                Students brainstormed and built interactive projects using Scratch. 
                The RocketHacks Tech Team provided one-on-one mentorship for debugging and refinement.
              </p>
            </div>

            {/* Mentorship */}
            <div className="glass rounded-2xl p-5 sm:p-6 hover:scale-105 transition-all duration-500 hover:shadow-xl">
              <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center">
                <FaHandshake size={28} className="text-white sm:w-8 sm:h-8" />
              </div>
              <h3 className={`${terminal.className} text-lg sm:text-xl mb-3 sm:mb-4 text-blue-400 text-center`}>
                MENTORSHIP
              </h3>
              <p className="text-rh-white/80 text-xs sm:text-sm leading-relaxed">
                University mentors provided guidance and support throughout the development process, 
                helping participants debug, refine, and polish their creative ideas.
              </p>
            </div>

            {/* Awards Ceremony */}
            <div className="glass rounded-2xl p-5 sm:p-6 hover:scale-105 transition-all duration-500 hover:shadow-xl">
              <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-400 to-yellow-600 flex items-center justify-center">
                <FaTrophy size={28} className="text-white sm:w-8 sm:h-8" />
              </div>
              <h3 className={`${terminal.className} text-lg sm:text-xl mb-3 sm:mb-4 text-orange-400 text-center`}>
                AWARDS CEREMONY
              </h3>
              <p className="text-rh-white/80 text-xs sm:text-sm leading-relaxed">
                Students presented final projects to judges. Dr. Sammy Spann congratulated participants, 
                with Nehemia winning for a multi-level interactive game with over 40 stages!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative py-20 px-5 md:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Column - Benefits */}
            <div className="animate-slide-up">
              <h2 className={`${terminal.className} heading-lg gradient-text mb-6 uppercase tracking-wider`}>
                Why Join Code & Create?
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-rh-yellow to-rh-orange mb-8 rounded-full"></div>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 rounded-full bg-rh-yellow flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-rh-navy-dark font-bold text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className={`${terminal.className} text-lg text-rh-yellow mb-2`}>Beginner-Friendly</h4>
                    <p className="text-rh-white/80">Perfect for students of all backgrounds - no prior experience needed!</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 rounded-full bg-rh-orange flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-bold text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className={`${terminal.className} text-lg text-rh-orange mb-2`}>Learn by Doing</h4>
                    <p className="text-rh-white/80">Create your own game or interactive project with immediate results.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 rounded-full bg-rh-pink flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-bold text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className={`${terminal.className} text-lg text-rh-pink mb-2`}>College Exposure</h4>
                    <p className="text-rh-white/80">Experience university life, meet students and professors, explore labs.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 rounded-full bg-rh-purple-light flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-bold text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className={`${terminal.className} text-lg text-rh-purple-light mb-2`}>Build Confidence</h4>
                    <p className="text-rh-white/80">Develop practical skills in programming, creativity, and problem-solving.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Registration CTA */}
            <div className="animate-fade-scale">
              <div className="glass-strong rounded-3xl p-6 sm:p-8 text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-rh-yellow to-rh-orange flex items-center justify-center">
                  <FaUsers size={32} className="text-rh-navy-dark sm:w-10 sm:h-10" />
                </div>
                <h3 className={`${terminal.className} text-xl sm:text-2xl text-rh-yellow mb-4`}>
                  Join Us Next Year!
                </h3>
                <p className="text-sm sm:text-base text-rh-white/90 mb-6 leading-relaxed">
                  Code & Create 2026 is in development! Fill out our interest form to be the first to know when registration opens 
                  for another amazing day of learning, building, and celebrating creativity.
                </p>
                <div className="space-y-3 sm:space-y-4">
                  <a
                    href="https://docs.google.com/forms/d/17Mm4UXiSANYwftmRhaUssHJhZSQli6Qt3hgtIRFKThE/edit"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary w-full px-4 sm:px-6 py-2 sm:py-3 inline-block text-center text-sm sm:text-base"
                  >
                    Fill Interest Form
                  </a>
                  <Link
                    href="/"
                    className="btn-secondary w-full px-4 sm:px-6 py-2 sm:py-3 block text-sm sm:text-base"
                  >
                    Learn About RocketHacks
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Learning Outcomes */}
      <section className="relative py-20 px-5 md:px-10 bg-gradient-to-b from-rh-navy-light to-rh-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className={`${terminal.className} heading-lg gradient-text mb-6 uppercase tracking-wider`}>
              What Students Gained
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-rh-yellow to-rh-orange mx-auto mb-8 rounded-full"></div>
            <p className="text-lg text-rh-white/80 max-w-3xl mx-auto">
              More than just coding - students walked away with confidence, skills, and inspiration for their future.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 animate-fade-scale">
            <div className="glass rounded-2xl p-5 sm:p-6 text-center">
              <h4 className={`${terminal.className} text-base sm:text-lg text-rh-yellow mb-3`}>Hands-On Experience</h4>
              <p className="text-rh-white/80 text-xs sm:text-sm">Solid introduction to programming and logical thinking through project-based learning.</p>
            </div>

            <div className="glass rounded-2xl p-5 sm:p-6 text-center">
              <h4 className={`${terminal.className} text-base sm:text-lg text-rh-orange mb-3`}>Creative Problem Solving</h4>
              <p className="text-rh-white/80 text-xs sm:text-sm">Learned to turn imaginative ideas into functional digital projects.</p>
            </div>

            <div className="glass rounded-2xl p-5 sm:p-6 text-center">
              <h4 className={`${terminal.className} text-base sm:text-lg text-rh-pink mb-3`}>Innovation Mindset</h4>
              <p className="text-rh-white/80 text-xs sm:text-sm">Understanding how technology enables innovation and exploration.</p>
            </div>

            <div className="glass rounded-2xl p-5 sm:p-6 text-center">
              <h4 className={`${terminal.className} text-base sm:text-lg text-rh-purple-light mb-3`}>Mentorship & Collaboration</h4>
              <p className="text-rh-white/80 text-xs sm:text-sm">Direct guidance from university mentors throughout the process.</p>
            </div>

            <div className="glass rounded-2xl p-5 sm:p-6 text-center">
              <h4 className={`${terminal.className} text-base sm:text-lg text-green-400 mb-3`}>College Preparation</h4>
              <p className="text-rh-white/80 text-xs sm:text-sm">Exposure to student organizations, labs, and research opportunities.</p>
            </div>

            <div className="glass rounded-2xl p-5 sm:p-6 text-center">
              <h4 className={`${terminal.className} text-base sm:text-lg text-blue-400 mb-3`}>Presentation Skills</h4>
              <p className="text-rh-white/80 text-xs sm:text-sm">Practice articulating technical ideas to judges and peers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-5 md:px-10 border-t border-rh-white/10">
        <div className="max-w-7xl mx-auto text-center">
          <Link href="/" className="inline-block mb-6">
            <Image
              src="/assets/rh_26/rh_26_folder/rh_26_bundle_png/rh_26_logo_color_transparent.png"
              alt="RocketHacks 2026"
              width={120}
              height={60}
              className="h-12 w-auto"
            />
          </Link>
          <p className="text-rh-white/60">
            © 2025 RocketHacks - University of Toledo College of Engineering
          </p>
        </div>
      </footer>
    </div>
  );
}