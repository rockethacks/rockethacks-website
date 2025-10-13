"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { terminal } from "../fonts/fonts";
import { ChevronLeft, ChevronRight, ExternalLink, Home } from "lucide-react";
import { FaLinkedin } from "react-icons/fa";

const teamSections = [
  {
    section: "Director",
    members: [
      { name: "Caleb", img: "/team photos/caleb.jpeg", link: "https://www.linkedin.com/in/calebmonteiro/" },
    ],
  },
  {
    section: "Co-Director",
    members: [
      { name: "Aadinath", img: "/team photos/aadi.jpg", link: "https://www.linkedin.com/in/aadinath-sanjeev-686205201/" },
      { name: "Kavish", img: "/team photos/kavish.jpg", link: "https://www.linkedin.com/in/kshetty3/" },
    ],
  },
  {
    section: "Sponsorship Lead",
    members: [
      { name: "Nikhil", img: "/team photos/nikhil.jpg", link: "https://www.linkedin.com/in/nikhil-ankam/" },
    ],
  },
  {
    section: "Sponsorship Team",
    members: [
      { name: "Maheen", img: "/team photos/maheen.jpg", link: "https://www.linkedin.com/in/maheenasim?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app" },
      { name: "Kartik", img: "/team photos/karthik.jpg", link: "https://www.linkedin.com/in/kartik-nair-b290b72b6/" },
    ],
  },
  {
    section: "Tech-Dev Lead",
    members: [
      { name: "Vedant", img: "/team photos/vedant.png", link: "https://www.linkedin.com/in/vedantgosavi/" },
    ],
  },
  {
    section: "Tech-Dev",
    members: [
      { name: "Aditya", img: "/team photos/aditya-tech dev.jpg", link: "https://www.linkedin.com/in/aditya-mhambrey/" },
      { name: "Shivom", img: "/team photos/shivom.jpg", link: "https://www.linkedin.com/in/shivom-vr/" },
      { name: "Pranav", img: "/team photos/pranav.jpg", link: "https://www.linkedin.com/in/justprnv/" },
      { name: "Charlie", img: "/team photos/charlie.png", link: "https://www.linkedin.com/in/charles-voss-7172232bb/" },
    ],
  },
  {
    section: "Safety Team",
    members: [
      { name: "Shaan", img: "/team photos/shaan.png", link: "https://www.linkedin.com/in/shaankagadagar/" },
      { name: "Nandan", img: "/team photos/nandan.jpg", link: "https://www.linkedin.com/in/nandanreddy15/" },
    ],
  },
  {
    section: "Judging Lead",
    members: [
      { name: "Adithya", img: "/team photos/aditya2.jpg", link: "https://www.linkedin.com/in/adithya-sudhakar-680681334/" },
    ],
  },
  {
    section: "Judging Team",
    members: [
      { name: "Finni", img: "/team photos/finni.jpg", link: "https://www.linkedin.com/in/finni-sam-saju-40a876296/" },
    ],
  },
  {
    section: "Marketing Lead",
    members: [
      { name: "Runil", img: "/team photos/runil.jpg", link: "https://www.linkedin.com/in/runildaptardar/" },
    ],
  },
  {
    section: "Marketing Co-Lead",
    members: [
      { name: "Ayan", img: "/team photos/ayan.jpg", link: "https://www.linkedin.com/in/mirza-ayan-baig-0159162a9/" },
    ],
  },
  {
    section: "Marketing",
    members: [
      { name: "Ann", img: "/team photos/ann.jpg", link: "https://www.linkedin.com/in/ann-treasa-sojan-4380b72b6/" },
      { name: "Bhumika", img: "/team photos/bhumika.jpg", link: "https://www.linkedin.com/in/bhumika-agarwal27" },
      { name: "Shubham", img: "/team photos/shubham.jpg", link: "https://www.linkedin.com/in/shubham-verma-cse" },
    ],
  },
  {
    section: "High-School Planning",
    members: [
      { name: "Insiyah", img: "/team photos/insiyah.jpg", link: "https://www.linkedin.com/in/irajkot1106/" },
    ],
  },
];

// const teamMembers = teamSections.flatMap((section) =>
//   section.members.map((member) => ({
//     ...member,
//     position: section.section,
//   }))
// );

// Glass Card Component
const GlassCard = ({ 
  children, 
  className = "",
  variant = "default" 
}: { 
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "strong";
}) => {
  const baseClasses = "rounded-xl border backdrop-blur-md";
  const variantClasses = {
    default: "bg-white/10 border-white/20",
    strong: "bg-white/20 border-white/30"
  };
  
  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
};

export default function TeamPage() {
  const [currentSection, setCurrentSection] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-play carousel
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentSection((prev) => (prev + 1) % teamSections.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const nextSection = () => {
    setCurrentSection((prev) => (prev + 1) % teamSections.length);
    setIsAutoPlaying(false);
  };

  const prevSection = () => {
    setCurrentSection((prev) => (prev - 1 + teamSections.length) % teamSections.length);
    setIsAutoPlaying(false);
  };

  const goToSection = (index: number) => {
    setCurrentSection(index);
    setIsAutoPlaying(false);
  };

  return (
    <main className="relative bg-gradient-to-b from-rh-background via-rh-navy-dark to-rh-navy-light text-white min-h-screen">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25px 25px, rgba(255, 196, 90, 0.3) 2px, transparent 0)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Header */}
      <div className="relative pt-20 pb-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className={`${terminal.className} heading-xl gradient-text mb-6 uppercase tracking-wider`}>
            Meet the Team
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-rh-yellow to-rh-orange mx-auto mb-8 rounded-full"></div>
          <p className="text-lg leading-relaxed text-rh-white/90 max-w-3xl mx-auto">
            The passionate innovators behind RocketHacks 2026. Our diverse team of students 
            works tirelessly to create an unforgettable hackathon experience.
          </p>
        </div>
      </div>

      {/* Team Carousel */}
      <div className="relative max-w-7xl mx-auto px-6 pb-20">
        <GlassCard variant="strong" className="p-8">
          {/* Section Navigation */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {teamSections.map((section, index) => (
              <button
                key={index}
                onClick={() => goToSection(index)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${currentSection === index 
                    ? 'bg-rh-yellow text-rh-navy-dark' 
                    : 'bg-rh-white/10 text-rh-white hover:bg-rh-white/20'
                  }
                `}
              >
                {section.section}
              </button>
            ))}
          </div>

          {/* Current Section Display */}
          <div className="relative">
            {/* Navigation Arrows */}
            <button
              onClick={prevSection}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 p-3 rounded-full bg-rh-yellow/90 hover:bg-rh-yellow text-rh-navy-dark shadow-lg transition-all duration-200"
              aria-label="Previous section"
            >
              <ChevronLeft size={20} />
            </button>
            
            <button
              onClick={nextSection}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 p-3 rounded-full bg-rh-yellow/90 hover:bg-rh-yellow text-rh-navy-dark shadow-lg transition-all duration-200"
              aria-label="Next section"
            >
              <ChevronRight size={20} />
            </button>

            {/* Section Content */}
            <div className="text-center mb-8">
              <h2 className={`${terminal.className} text-3xl text-rh-yellow mb-4`}>
                {teamSections[currentSection].section}
              </h2>
              <div className="w-16 h-0.5 bg-rh-orange mx-auto"></div>
            </div>

            {/* Team Members Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 justify-items-center">
              {teamSections[currentSection].members.map((member, index) => (
                <div
                  key={index}
                  className="group animate-fade-scale"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <GlassCard className="p-6 text-center hover:scale-105 transition-all duration-500">
                    {/* Profile Image */}
                    <div className="relative w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden">
                      <Image
                        src={member.img}
                        alt={member.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        sizes="128px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-rh-navy-dark/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>

                    {/* Member Info */}
                    <h3 className="text-xl font-semibold text-rh-yellow mb-2">
                      {member.name}
                    </h3>
                    <p className="text-rh-white/80 text-sm mb-4">
                      {teamSections[currentSection].section}
                    </p>

                    {/* LinkedIn Link */}
                    <Link
                      href={member.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 text-rh-yellow hover:text-rh-orange transition-colors duration-200 group/link"
                    >
                      <FaLinkedin size={18} />
                      <span className="text-sm">Connect</span>
                      <ExternalLink size={14} className="group-hover/link:translate-x-1 transition-transform duration-200" />
                    </Link>
                  </GlassCard>
                </div>
              ))}
            </div>

            {/* Auto-play Control */}
            <div className="flex justify-center items-center mt-8 space-x-4">
              <button
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${isAutoPlaying 
                    ? 'bg-rh-orange text-white' 
                    : 'bg-rh-white/10 text-rh-white hover:bg-rh-white/20'
                  }
                `}
              >
                {isAutoPlaying ? 'Pause Auto-play' : 'Resume Auto-play'}
              </button>
              
              {/* Progress Indicators */}
              <div className="flex space-x-2">
                {teamSections.map((_, index) => (
                  <div
                    key={index}
                    className={`
                      w-2 h-2 rounded-full transition-all duration-200
                      ${currentSection === index ? 'bg-rh-yellow' : 'bg-rh-white/30'}
                    `}
                  />
                ))}
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Back to Home Button */}
      <div className="relative pb-20">
        <div className="flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-rh-yellow to-rh-orange text-rh-navy-dark font-semibold rounded-full hover:scale-105 transition-all duration-200 shadow-lg"
          >
            <Home size={20} />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
