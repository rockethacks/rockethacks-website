"use client";
import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
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

// Memoized FilterButton component
const FilterButton = memo(({ 
  category, 
  isActive, 
  count, 
  onClick 
}: { 
  category: { name: string; icon: React.ComponentType<{ size?: number }> }; 
  isActive: boolean; 
  count: number; 
  onClick: () => void;
}) => {
  const IconComponent = category.icon;
  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
        ${isActive 
          ? 'bg-rh-yellow text-rh-navy-dark' 
          : 'bg-rh-white/10 text-rh-white hover:bg-rh-white/20'
        }
      `}
    >
      <IconComponent size={16} />
      <span>{category.name}</span>
      <span className="text-xs opacity-70">({count})</span>
    </button>
  );
});
FilterButton.displayName = 'FilterButton';

const Gallery: React.FC<GalleryProps> = ({ images = projectImages }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filter, setFilter] = useState<string>("all");
  const [isAutoPlaying, setIsAutoPlaying] = useState(false); // Disabled by default for performance

  const categories = useMemo(() => ({
    all: { name: "All Moments", icon: FaCalendar },
    rockethacks2025: { name: "RocketHacks 2025", icon: FaTrophy },
    githubworkshop: { name: "GitHub Workshop", icon: FaCode },
    workshop: { name: "Workshops", icon: FaUsers },
    teamphoto: { name: "Team Photos", icon: FaUsers },
    awards: { name: "Awards", icon: FaTrophy }
  }), []);

  // Memoized filtered images
  const filteredImages = useMemo(() => 
    filter === "all" ? images : images.filter(img => img.category === filter),
    [filter, images]
  );

  // Memoized category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: images.length };
    images.forEach(img => {
      counts[img.category] = (counts[img.category] || 0) + 1;
    });
    return counts;
  }, [images]);

  // Reset currentIndex when filter changes
  useEffect(() => {
    if (filteredImages.length > 0 && (currentIndex >= filteredImages.length || currentIndex < 0)) {
      setCurrentIndex(0);
    }
  }, [filter, filteredImages.length, currentIndex]);

  // Auto-play functionality (optional, disabled by default)
  useEffect(() => {
    if (!isAutoPlaying || filteredImages.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % filteredImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, filteredImages.length]);

  // Navigation callbacks
  const nextImage = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % filteredImages.length);
  }, [filteredImages.length]);

  const prevImage = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + filteredImages.length) % filteredImages.length);
  }, [filteredImages.length]);

  const goToImage = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const toggleAutoPlay = useCallback(() => {
    setIsAutoPlaying(prev => !prev);
  }, []);

  const handleFilterChange = useCallback((newFilter: string) => {
    setFilter(newFilter);
    setCurrentIndex(0);
  }, []);

  if (filteredImages.length === 0) return null;

  const currentImage = filteredImages[currentIndex];

  return (
    <section 
      id="gallery" 
      className="relative bg-gradient-to-b from-rh-navy-dark to-rh-background text-white py-16 px-5 md:px-10"
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
        <div className="text-center mb-12">
          <h2 className={`${terminal.className} heading-lg gradient-text mb-6 uppercase tracking-wider`}>
            Gallery
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-rh-yellow to-rh-orange mx-auto mb-8 rounded-full"></div>
          <p className="text-lg leading-relaxed text-rh-white/90 max-w-3xl mx-auto">
            Relive the incredible moments from RocketHacks 2025.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {Object.entries(categories).map(([key, category]) => (
            <FilterButton
              key={key}
              category={category}
              isActive={filter === key}
              count={categoryCounts[key] || 0}
              onClick={() => handleFilterChange(key)}
            />
          ))}
        </div>

        {/* Main Carousel */}
        <GlassCard variant="strong" className="p-6 sm:p-8">
          <div className="relative">
            {/* Main Image Display */}
            <div className="relative aspect-[16/9] lg:aspect-[21/9] overflow-hidden rounded-xl mb-6 bg-rh-navy-light/30">
              <Image
                key={currentImage.index} // Force remount on change for smooth transitions
                src={currentImage.src}
                alt={currentImage.alt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                priority={currentIndex === 0 && filter === "all"}
                quality={75} // Reduced from 85 for faster loading
                placeholder="blur"
                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAwIiBoZWlnaHQ9IjQ3NSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2ZXJzaW9uPSIxLjEiLz4="
              />

              {/* Navigation Arrows */}
              <button
                onClick={prevImage}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 p-2 sm:p-3 rounded-full bg-black/70 hover:bg-black/90 text-white transition-colors duration-200 backdrop-blur-sm"
                aria-label="Previous image"
              >
                <ChevronLeft size={24} />
              </button>

              <button
                onClick={nextImage}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 p-2 sm:p-3 rounded-full bg-black/70 hover:bg-black/90 text-white transition-colors duration-200 backdrop-blur-sm"
                aria-label="Next image"
              >
                <ChevronRight size={24} />
              </button>

              {/* Image Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 sm:p-6">
                <h3 className={`${terminal.className} text-lg sm:text-xl text-white mb-1 sm:mb-2`}>
                  {currentImage.title}
                </h3>
                <p className="text-white/90 text-xs sm:text-sm">
                  {currentImage.description}
                </p>
              </div>
            </div>

            {/* Simplified Dot Navigation (no thumbnails for performance) */}
            <div className="flex justify-center gap-2 mb-6 flex-wrap">
              {filteredImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToImage(index)}
                  className={`
                    w-2 h-2 rounded-full transition-all duration-200
                    ${currentIndex === index 
                      ? 'bg-rh-yellow w-8' 
                      : 'bg-rh-white/30 hover:bg-rh-white/50'
                    }
                  `}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={toggleAutoPlay}
                  className={`
                    inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${isAutoPlaying 
                      ? 'bg-rh-orange text-white' 
                      : 'bg-rh-white/10 text-rh-white hover:bg-rh-white/20'
                    }
                  `}
                >
                  {isAutoPlaying ? <Pause size={16} /> : <Play size={16} />}
                  <span className="hidden sm:inline">{isAutoPlaying ? 'Pause' : 'Play'}</span>
                </button>
                
                <span className="text-rh-white/70 text-sm">
                  {currentIndex + 1} / {filteredImages.length}
                </span>
              </div>

              {/* Arrow Navigation for Mobile */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={prevImage}
                  className="p-2 rounded-lg bg-rh-white/10 text-rh-white hover:bg-rh-white/20 transition-all duration-200"
                  aria-label="Previous"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={nextImage}
                  className="p-2 rounded-lg bg-rh-white/10 text-rh-white hover:bg-rh-white/20 transition-all duration-200"
                  aria-label="Next"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </section>
  );
};

export default Gallery;
