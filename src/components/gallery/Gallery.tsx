"use client";
import React, { useState, useEffect } from "react";
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
  category: "workshop" | "coding" | "presentation" | "networking" | "awards";
  timestamp: string;
};

type GalleryProps = {
  images?: ProjectImage[];
};

const projectImages: ProjectImage[] = [
  {
    src: "/assets/event/01.jpg",
    alt: "RocketHacks 2025 Github Pre-Event",
    title: "Opening Ceremony",
    description: "Kicking off RocketHacks 2025 with energy and excitement",
    category: "presentation",
    timestamp: "Day 1 - 9:00 AM",
    index: 0,
  },
  {
    src: "/assets/event/02.jpg",
    alt: "Workshop Day 1",
    title: "Technical Workshop",
    description: "Learning new technologies and frameworks",
    category: "workshop",
    timestamp: "Day 1 - 10:30 AM",
    index: 1,
  },
  {
    src: "/assets/event/03.jpg",
    alt: "Workshop Day 1",
    title: "Team Formation",
    description: "Finding the perfect teammates for the hackathon",
    category: "networking",
    timestamp: "Day 1 - 11:30 AM",
    index: 2,
  },
  {
    src: "/assets/event/04.jpg",
    alt: "Coding Session",
    title: "Intense Coding",
    description: "Teams working hard on their innovative solutions",
    category: "coding",
    timestamp: "Day 1 - 2:00 PM",
    index: 3,
  },
  {
    src: "/assets/event/05.jpg",
    alt: "Awards Ceremony",
    title: "Prize Distribution",
    description: "Celebrating the most innovative projects",
    category: "awards",
    timestamp: "Day 2 - 4:00 PM",
    index: 4,
  }
];

const Gallery: React.FC<GalleryProps> = ({ images = projectImages }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filter, setFilter] = useState<string>("all");
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const categories = {
    all: { name: "All Moments", icon: FaCalendar },
    workshop: { name: "Workshops", icon: FaUsers },
    coding: { name: "Coding", icon: FaCode },
    presentation: { name: "Presentations", icon: FaTrophy },
    networking: { name: "Networking", icon: FaUsers },
    awards: { name: "Awards", icon: FaTrophy }
  };

  const filteredImages = filter === "all" ? images : images.filter(img => img.category === filter);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || filteredImages.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % filteredImages.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, filteredImages.length]);



  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % filteredImages.length);
    setIsAutoPlaying(false);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + filteredImages.length) % filteredImages.length);
    setIsAutoPlaying(false);
  };

  const goToImage = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

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
          <div className="relative">
            {/* Main Image Display */}
            <div className="relative aspect-[16/9] lg:aspect-[21/9] overflow-hidden rounded-xl mb-6">
              <Image
                src={filteredImages[currentIndex].src}
                alt={filteredImages[currentIndex].alt}
                fill
                className="object-cover transition-transform duration-500 hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
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
                  {filteredImages[currentIndex].title}
                </h3>
                <p className="text-white/80 text-sm mb-2">
                  {filteredImages[currentIndex].description}
                </p>
                <span className="text-rh-yellow text-xs">
                  {filteredImages[currentIndex].timestamp}
                </span>
              </div>


            </div>

            {/* Thumbnail Navigation */}
            <div className="flex justify-center gap-2 mb-6 overflow-x-auto pb-2">
              {filteredImages.map((image, index) => (
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
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </button>
              ))}
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
        </GlassCard>
      </div>


    </section>
  );
};

export default Gallery;