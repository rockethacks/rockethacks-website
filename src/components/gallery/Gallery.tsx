"use client";
import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { terminal } from "../../app/fonts/fonts";
import { GlassCard } from "../ui/glass-card";
import { FaCalendar, FaUsers, FaCode, FaTrophy } from "react-icons/fa";
import { ChevronRight, ChevronLeft, Play, Pause } from "lucide-react";

type ProjectImage = {
  src: string;
  alt: string;
  index: number;
  title: string;
  description: string;
  category: "workshop" | "rockethacks2025" | "awards" | "teamphoto" | "githubworkshop";
};

type GalleryProps = {
  images?: ProjectImage[];
};

const projectImages: ProjectImage[] = [
  {
    src: "/assets/event/01.jpg",
    alt: "Intro to GitHub Workshop",
    title: "Students Actively Engaged",
    description: "Students actively involved in the GitHub workshop learning version control",
    category: "githubworkshop",
    index: 0,
  },
  {
    src: "/assets/event/03.jpg",
    alt: "Intro to GitHub Workshop",
    title: "AI-Assisted Development",
    description: "Students developing projects using Perplexity AI (Sponsor)",
    category: "githubworkshop",
    index: 1,
  },
  {
    src: "/assets/event/04.jpg",
    alt: "Intro to GitHub Workshop",
    title: "Collaborative Development",
    description: "Students engaging in collaborative development as they prepare their MVPs",
    category: "githubworkshop",
    index: 2,
  },
  {
    src: "/assets/event/05.jpg",
    alt: "Intro to GitHub Workshop",
    title: "GitHub Basics",
    description: "Tutor teaching the class on GitHub fundamentals and best practices",
    category: "githubworkshop",
    index: 3,
  },
  {
    src: "/assets/event/06.jpg",
    alt: "Intro to GitHub Workshop",
    title: "Mentor Guidance",
    description: "Mentors from RocketHacks explaining GitHub basics to participants",
    category: "githubworkshop",
    index: 4,
  },
  {
    src: "/assets/event/07.jpg",
    alt: "Intro to GitHub Workshop",
    title: "Project Demonstrations",
    description: "Participants having a great time demoing their workshop projects",
    category: "githubworkshop",
    index: 5,
  },
  {
    src: "/assets/event/08.jpg",
    alt: "RocketHacks 2025",
    title: "Keynote Speech",
    description: "Keynote speech by Tom Bush inspiring participants at RocketHacks 2025",
    category: "rockethacks2025",
    index: 6,
  },
  {
    src: "/assets/event/09.jpg",
    alt: "RocketHacks 2025",
    title: "Finance Track Team",
    description: "Team from the Finance Track building their innovative project solution",
    category: "rockethacks2025",
    index: 7,
  },
  {
    src: "/assets/event/10.jpg",
    alt: "RocketHacks 2025",
    title: "AWS Workshop Fun",
    description: "RocketHacks participants having a great time during their AWS workshop",
    category: "workshop",
    index: 8,
  },
  {
    src: "/assets/event/11.jpg",
    alt: "RocketHacks 2025",
    title: "AWS Cloud Services",
    description: "AWS Workshop hosted by Curtis on various cloud services offered by AWS",
    category: "workshop",
    index: 9,
  },
  {
    src: "/assets/event/12.jpg",
    alt: "RocketHacks 2025",
    title: "Project Judging",
    description: "Participant demoing their project to one of our expert judges",
    category: "rockethacks2025",
    index: 10,
  },
  {
    src: "/assets/event/13.jpg",
    alt: "RocketHacks 2025",
    title: "Code & Create Component",
    description: "Our amazing high school developers in our Code and Create component",
    category: "rockethacks2025",
    index: 11,
  },
  {
    src: "/assets/event/14.jpg",
    alt: "RocketHacks 2025",
    title: "Leadership with Dean",
    description: "RocketHacks organizing team with Sammy Spann, Dean of Students",
    category: "teamphoto",
    index: 12,
  },
  {
    src: "/assets/event/15.jpg",
    alt: "RocketHacks 2025",
    title: "MLH Mentorship",
    description: "RocketHacks team getting mentored by Kevin from Major League Hacking",
    category: "rockethacks2025",
    index: 13,
  },
  {
    src: "/assets/event/16.jpg",
    alt: "RocketHacks 2025",
    title: "Figma to Code Workshop",
    description: "Figma to Code Workshop led by Kevin from Major League Hacking",
    category: "workshop",
    index: 14,
  },
  {
    src: "/assets/event/17.jpg",
    alt: "RocketHacks 2025",
    title: "Media Interview",
    description: "RocketHacks organizing leadership team getting interviewed by local news",
    category: "teamphoto",
    index: 15,
  },
  {
    src: "/assets/event/18.jpg",
    alt: "RocketHacks 2025",
    title: "MLH Awards Ceremony",
    description: "MLH Awards presentation during the closing ceremony",
    category: "awards",
    index: 16,
  },
  {
    src: "/assets/event/19.jpg",
    alt: "RocketHacks 2025",
    title: "SPOKE Sponsored Pizza",
    description: "Pizza sponsored by our great sponsor - SPOKE, fueling our hackers",
    category: "rockethacks2025",
    index: 17,
  },
  {
    src: "/assets/event/20.jpg",
    alt: "RocketHacks 2025",
    title: "MLH Category Winners",
    description: "Winners of the Major League Hacking category celebrating their victory",
    category: "awards",
    index: 18,
  },
  {
    src: "/assets/event/21.jpg",
    alt: "RocketHacks 2025",
    title: "MLH Category Champions",
    description: "Winners from MLH Category showcasing their innovative projects",
    category: "awards",
    index: 19,
  },
  {
    src: "/assets/event/22.jpg",
    alt: "RocketHacks 2025",
    title: "Closing Ceremony MLH Winners",
    description: "Winners from MLH Category during the closing ceremony celebration",
    category: "awards",
    index: 20,
  },
  {
    src: "/assets/event/23.jpg",
    alt: "RocketHacks 2025",
    title: "Overall Champions",
    description: "Overall winners of RocketHacks 2025 with their well-deserved prizes",
    category: "awards",
    index: 21,
  },
  {
    src: "/assets/event/24.jpg",
    alt: "RocketHacks 2025",
    title: "Core Organizing Teams",
    description: "RH25 organizers from Logistics, Marketing, and Finance teams",
    category: "teamphoto",
    index: 22,
  },
  {
    src: "/assets/event/25.jpg",
    alt: "RocketHacks 2025",
    title: "Complete Organizing Team",
    description: "Full organizing team photo capturing all the amazing volunteers",
    category: "teamphoto",
    index: 23,
  },
  {
    src: "/assets/event/26.jpg",
    alt: "RocketHacks 2025",
    title: "Mentorship in Action",
    description: "Mentorship team guiding participants building their projects",
    category: "rockethacks2025",
    index: 24,
  },
  {
    src: "/assets/event/27.jpg",
    alt: "RocketHacks 2025",
    title: "Senior Leadership Team",
    description: "Senior leadership team from RocketHacks overseeing the event",
    category: "teamphoto",
    index: 25,
  }
];

const Gallery: React.FC<GalleryProps> = ({ images = projectImages }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filter, setFilter] = useState<string>("all");
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const categories = useMemo(() => ({
    all: { name: "All Moments", icon: FaCalendar },
    rockethacks2025: { name: "RocketHacks 2025", icon: FaTrophy },
    githubworkshop: { name: "GitHub Workshop", icon: FaCode },
    workshop: { name: "Workshops", icon: FaUsers },
    teamphoto: { name: "Team Photos", icon: FaUsers },
    awards: { name: "Awards", icon: FaTrophy }
  }), []);

  const filteredImages = useMemo(() => 
    filter === "all" ? images : images.filter(img => img.category === filter),
    [filter, images]
  );

  // Reset currentIndex when filter changes or when filteredImages becomes empty
  useEffect(() => {
    if (filteredImages.length === 0) {
      setCurrentIndex(0);
    } else if (currentIndex >= filteredImages.length || currentIndex < 0) {
      setCurrentIndex(0);
    }
  }, [filter, filteredImages.length, currentIndex]);

  // Additional safety check for currentIndex
  useEffect(() => {
    if (filteredImages.length > 0 && (currentIndex >= filteredImages.length || currentIndex < 0)) {
      setCurrentIndex(0);
    }
  }, [filteredImages, currentIndex]);

  // Auto-play functionality with performance optimization
  useEffect(() => {
    if (!isAutoPlaying || filteredImages.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % filteredImages.length);
    }, 5000); // Increased to 5 seconds to reduce re-renders

    return () => clearInterval(interval);
  }, [isAutoPlaying, filteredImages.length]);



  const nextImage = React.useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % filteredImages.length);
    setIsAutoPlaying(false);
  }, [filteredImages.length]);

  const prevImage = React.useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + filteredImages.length) % filteredImages.length);
    setIsAutoPlaying(false);
  }, [filteredImages.length]);

  const goToImage = React.useCallback((index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  }, []);

  if (filteredImages.length === 0) return null;

  return (
    <section id="gallery" className="relative bg-gradient-to-b from-rh-navy-dark to-rh-background text-white py-16 px-5 md:px-10">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25px 25px, rgba(255, 196, 90, 0.3) 2px, transparent 0)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12 animate-slide-up">
          <h2 className={`${terminal.className} heading-lg gradient-text mb-6 uppercase tracking-wider`}>
            Gallery
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-rh-yellow to-rh-orange mx-auto mb-8 rounded-full"></div>
          <p className="text-lg leading-relaxed text-rh-white/90 max-w-3xl mx-auto">
            Relive the incredible moments from RocketHacks 2025. Each image tells a story 
            of innovation, collaboration, and breakthrough discoveries.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {Object.entries(categories).map(([key, category]) => {
            const IconComponent = category.icon;
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`
                  inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${filter === key 
                    ? 'bg-rh-yellow text-rh-navy-dark' 
                    : 'bg-rh-white/10 text-rh-white hover:bg-rh-white/20'
                  }
                `}
              >
                <IconComponent size={16} />
                <span>{category.name}</span>
                <span className="text-xs opacity-70">
                  ({key === "all" ? images.length : images.filter(img => img.category === key).length})
                </span>
              </button>
            );
          })}
        </div>

        {/* Main Carousel */}
        <GlassCard variant="strong" className="p-6 sm:p-8">
          {filteredImages.length > 0 && filteredImages[currentIndex] ? (
            <div className="relative">
              {/* Main Image Display */}
              <div className="relative aspect-[16/9] lg:aspect-[21/9] overflow-hidden rounded-xl mb-6">
                <Image
                  src={filteredImages[currentIndex].src}
                  alt={filteredImages[currentIndex].alt}
                  fill
                  className="object-cover transition-transform duration-500 hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                  priority={currentIndex === 0}
                  loading={currentIndex === 0 ? "eager" : "lazy"}
                  quality={85}
                />
              
              {/* Navigation Arrows */}
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all duration-200"
                aria-label="Previous image"
              >
                <ChevronLeft size={24} />
              </button>
              
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all duration-200"
                aria-label="Next image"
              >
                <ChevronRight size={24} />
              </button>

              {/* Image Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <h3 className={`${terminal.className} text-xl text-white mb-2`}>
                  {filteredImages[currentIndex]?.title || 'Loading...'}
                </h3>
                <p className="text-white/80 text-sm">
                  {filteredImages[currentIndex]?.description || 'Loading image description...'}
                </p>
              </div>


            </div>

            {/* Thumbnail Navigation */}
            <div className="flex justify-center gap-2 mb-6 overflow-x-auto pb-2 scroll-smooth">
              {filteredImages.map((image, index) => {
                // Only load thumbnails that are close to the current index for better performance
                const shouldLoad = Math.abs(index - currentIndex) <= 5;
                return (
                  <button
                    key={image.index}
                    onClick={() => goToImage(index)}
                    className={`
                      relative flex-shrink-0 w-20 h-12 rounded-lg overflow-hidden transition-all duration-200
                      ${currentIndex === index 
                        ? 'ring-2 ring-rh-yellow scale-110' 
                        : 'opacity-60 hover:opacity-100'
                      }
                    `}
                  >
                    {shouldLoad ? (
                      <Image
                        src={image.src}
                        alt={image.alt}
                        fill
                        className="object-cover"
                        sizes="80px"
                        loading="lazy"
                        quality={60}
                      />
                    ) : (
                      <div className="w-full h-full bg-rh-navy-light/30" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                  className={`
                    inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${isAutoPlaying 
                      ? 'bg-rh-orange text-white' 
                      : 'bg-rh-white/10 text-rh-white hover:bg-rh-white/20'
                    }
                  `}
                >
                  {isAutoPlaying ? <Pause size={16} /> : <Play size={16} />}
                  <span>{isAutoPlaying ? 'Pause' : 'Play'}</span>
                </button>
                
                <span className="text-rh-white/70 text-sm">
                  {currentIndex + 1} of {filteredImages.length}
                </span>
              </div>

              <div className="flex space-x-2">
                {filteredImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToImage(index)}
                    className={`
                      w-2 h-2 rounded-full transition-all duration-200
                      ${currentIndex === index ? 'bg-rh-yellow' : 'bg-rh-white/30 hover:bg-rh-white/50'}
                    `}
                  />
                ))}
              </div>
            </div>
          </div>
          ) : (
            <div className="text-center py-16">
              <h3 className={`${terminal.className} text-xl text-rh-white/60 mb-4`}>
                No images found for this category
              </h3>
              <p className="text-rh-white/40">
                Please select a different category or check back later.
              </p>
            </div>
          )}
        </GlassCard>
      </div>


    </section>
  );
};

export default Gallery;