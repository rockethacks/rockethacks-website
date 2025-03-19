"use client";
import React from "react";
import Image from "next/image";

// Importing terminal font
import localFont from "next/font/local";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "../ui/carousel";
const terminal = localFont({ src: "../../app/fonts/terminal-grotesque.ttf" });

type ImageType = {
  src: string;
  alt: string;
  index: number;
};

type GalleryProps = {
  images?: ImageType[];
};

const exampleImages: ImageType[] = [
  {
    src: "/assets/event/01.jpg",
    alt: "RocketHacks 2025 Github Pre-Event",
    index: 0,
  },
  {
    src: "/assets/event/02.jpg",
    alt: "Workshop Day 1",
    index: 1,
  },
  {
    src: "/assets/event/03.jpg",
    alt: "Workshop Day 1",
    index: 2,
  },
  {
    src: "/assets/event/04.jpg",
    alt: "Coding Session",
    index: 3,
  },
  {
    src: "/assets/event/05.jpg",
    alt: "Workshop Day 1",
    index: 4,
  },
  {
    src: "/assets/event/06.jpg",
    alt: "Mentoring Session",
    index: 5,
  },
  {
    src: "/assets/event/07.jpg",
    alt: "RocketHacks 2025",
    index: 6,
  },
  {
    src: "/assets/event/08.jpg",
    alt: "RocketHacks 2025",
    index: 7,
  },
  {
    src: "/assets/event/09.jpg",
    alt: "RocketHacks 2025",
    index: 8,
  },
  {
    src: "/assets/event/10.jpg",
    alt: "RocketHacks 2025",
    index: 9,
  },
  {
    src: "/assets/event/11.jpg",
    alt: "RocketHacks 2025",
    index: 10,
  },
  {
    src: "/assets/event/12.jpg",
    alt: "RocketHacks 2025",
    index: 11,
  },
  {
    src: "/assets/event/13.jpg",
    alt: "RocketHacks 2025",
    index: 12,
  },
  {
    src: "/assets/event/14.jpg",
    alt: "RocketHacks 2025",
    index: 13,
  },
  {
    src: "/assets/event/15.jpg",
    alt: "RocketHacks 2025",
    index: 14,
  },
  {
    src: "/assets/event/16.jpg",
    alt: "RocketHacks 2025",
    index: 15,
  },
  {
    src: "/assets/event/17.jpg",
    alt: "RocketHacks 2025",
    index: 16,
  },
  {
    src: "/assets/event/18.jpg",
    alt: "RocketHacks 2025",
    index: 17,
  },
  {
    src: "/assets/event/19.jpg",
    alt: "RocketHacks 2025",
    index: 18,
  },
  {
    src: "/assets/event/20.jpg",
    alt: "RocketHacks 2025",
    index: 19,
  },
  {
    src: "/assets/event/21.jpg",
    alt: "RocketHacks 2025",
    index: 20,
  },
  {
    src: "/assets/event/22.jpg",
    alt: "RocketHacks 2025",
    index: 21,
  },
  {
    src: "/assets/event/23.jpg",
    alt: "RocketHacks 2025",
    index: 22,
  },
  {
    src: "/assets/event/24.jpg",
    alt: "RocketHacks 2025",
    index: 23,
  },
  {
    src: "/assets/event/25.jpg",
    alt: "RocketHacks 2025",
    index: 24,
  },
  {
    src: "/assets/event/26.jpg",
    alt: "RocketHacks 2025",
    index: 25,
  },
  {
    src: "/assets/event/27.jpg",
    alt: "RocketHacks 2025",
    index: 26,
  }
];

const Gallery: React.FC<GalleryProps> = ({ images = exampleImages }) => {
  return (
    <section id="gallery">
      <div className="relative w-full flex flex-col items-center p-4 xl:h-[90vh] mt-10 xl:mt-20">
        <h2
          className={`${terminal.className} text-4xl md:text-6xl mb-8 text-[#FFDA20]`}
        >
          2025 GALLERY
        </h2>
        <div className="relative w-full max-w-4xl h-auto flex justify-center items-center overflow-hidden">
          <Carousel className="w-full max-w-4xl">
            <CarouselContent>
              {images.map((image) => (
                <CarouselItem key={image.index}>
                  <div className="relative flex items-center justify-center w-full">
                    <Image
                      src={image.src}
                      alt={image.alt}
                      width={800}
                      height={500}
                      priority
                      className="w-full max-w-[80vw] h-auto max-h-[80vh] xl:max-h-[90vh] object-cover rounded-lg shadow-md transition-all duration-300"
                    />
                    <div className="absolute inset-0 p-20 flex items-center justify-center text-center text-white text-lg xl:text-3xl opacity-0 hover:opacity-100 hover:bg-black/70 hover:bg-opacity-50 transition-opacity backdrop-blur-sm">
                      {image.alt}
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-4 bg-white/30 hover:bg-white/50 text-white" />
            <CarouselNext className="right-4 bg-white/30 hover:bg-white/50 text-white" />
          </Carousel>
        </div>
      </div>
    </section>
  );
};

export default Gallery;
