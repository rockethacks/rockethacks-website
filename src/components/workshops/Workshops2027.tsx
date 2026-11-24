"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Maximize2,
  MapPin,
  Sparkles,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { terminal } from "@/app/fonts/fonts";

const linkedinPostUrl =
  "https://www.linkedin.com/posts/rockethacks_stand-out-in-the-job-market-learn-to-create-activity-7528632407747444736-wJmk";

const figmaPhotos = [
  {
    src: "/assets/workshops/figma/figma%201.jpeg",
    alt: "A participant works on a laptop during the workshop.",
  },
  {
    src: "/assets/workshops/figma/figma%202.jpeg",
    alt: "Attendees watch a projected Figma demonstration.",
  },
  {
    src: "/assets/workshops/figma/figma%203.jpeg",
    alt: "Participants gather for a group photo at the end of the workshop.",
  },
  {
    src: "/assets/workshops/figma/figma%204.jpeg",
    alt: "A participant works on a Figma design with a laptop and phone.",
  },
  {
    src: "/assets/workshops/figma/figma%205.jpeg",
    alt: "Attendees work on their designs during the workshop.",
  },
  {
    src: "/assets/workshops/figma/figma%206.jpeg",
    alt: "A participant shows a workshop book beside the refreshments.",
  },
  {
    src: "/assets/workshops/figma/figma%207.jpeg",
    alt: "A presenter demonstrates Figma to the workshop attendees.",
  },
  {
    src: "/assets/workshops/figma/figma%208.jpeg",
    alt: "Attendees follow along with a Figma project on their laptops.",
  },
  {
    src: "/assets/workshops/figma/figma%209.jpeg",
    alt: "A mentor helps a participant with their design.",
  },
  {
    src: "/assets/workshops/figma/figma%2010.jpeg",
    alt: "Participants practice designing with Figma.",
  },
];

function FigmaGallery() {
  const [activePhoto, setActivePhoto] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const photo = figmaPhotos[activePhoto];

  const changePhoto = (direction: number) => {
    setActivePhoto(
      (current) =>
        (current + direction + figmaPhotos.length) % figmaPhotos.length,
    );
  };

  useEffect(() => {
    if (isExpanded) return;

    const intervalId = window.setInterval(() => {
      setActivePhoto((current) => (current + 1) % figmaPhotos.length);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [activePhoto, isExpanded]);

  useEffect(() => {
    if (!isExpanded) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsExpanded(false);
      if (event.key === "ArrowLeft") changePhoto(-1);
      if (event.key === "ArrowRight") changePhoto(1);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isExpanded]);

  return (
    <>
      <div className="flex flex-col items-center justify-center bg-black/20 p-4 sm:p-6">
        <div
          className="relative aspect-[4/3] w-full max-w-[640px] overflow-hidden rounded-xl border border-white/10 bg-black/40"
        >
          <div
            className="flex h-full w-full transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${activePhoto * 100}%)` }}
          >
            {figmaPhotos.map((item, index) => (
              <div key={item.src} className="relative h-full w-full flex-none">
                <button
                  type="button"
                  onClick={() => setIsExpanded(true)}
                  aria-label={`Expand photo ${index + 1}: ${item.alt}`}
                  className="group absolute inset-0 h-full w-full cursor-zoom-in"
                >
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 45vw"
                    quality={90}
                    className="object-contain transition-transform duration-500 ease-out group-hover:scale-[1.035]"
                  />
                  <span className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full bg-black/65 px-3 py-2 text-xs font-semibold text-white opacity-0 backdrop-blur transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                    <Maximize2 className="h-4 w-4" />
                    Expand photo
                  </span>
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => changePhoto(-1)}
            aria-label="Show previous Intro to Figma photo"
            className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/65 text-white backdrop-blur transition hover:scale-105 hover:bg-black/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rh-yellow"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={() => changePhoto(1)}
            aria-label="Show next Intro to Figma photo"
            className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/65 text-white backdrop-blur transition hover:scale-105 hover:bg-black/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rh-yellow"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        <div
          role="group"
          aria-label="Choose a workshop photo"
          className="mt-4 flex w-full max-w-[640px] gap-2 overflow-x-auto px-1 pb-2"
        >
          {figmaPhotos.map((item, index) => (
            <button
              key={item.src}
              type="button"
              onClick={() => setActivePhoto(index)}
              aria-label={`Show photo ${index + 1}: ${item.alt}`}
              aria-pressed={activePhoto === index}
              className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition duration-200 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rh-yellow ${
                activePhoto === index
                  ? "border-rh-yellow"
                  : "border-white/20 opacity-70 hover:opacity-100"
              }`}
            >
              <Image
                src={item.src}
                alt=""
                fill
                sizes="56px"
                quality={75}
                className="object-cover"
              />
            </button>
          ))}
        </div>

        <p className="mt-1 text-center text-xs text-rh-white/65">
          {activePhoto + 1} / {figmaPhotos.length}
          <span className="mx-2" aria-hidden="true">
            ·
          </span>
          Click a photo to expand
        </p>
      </div>

      {isExpanded && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Intro to Figma photo gallery"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm"
          onClick={() => setIsExpanded(false)}
        >
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            aria-label="Close expanded photo"
            className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/65 text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rh-yellow"
          >
            <X className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              changePhoto(-1);
            }}
            aria-label="Show previous expanded photo"
            className="absolute left-3 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/65 text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rh-yellow sm:left-6"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div
            className="relative max-w-full overflow-hidden"
            style={{
              width: "min(92vw, 112vh, 1200px)",
              aspectRatio: "4 / 3",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="92vw"
              quality={95}
              className="object-contain"
            />
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              changePhoto(1);
            }}
            aria-label="Show next expanded photo"
            className="absolute right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/65 text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rh-yellow sm:right-6"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <p className="absolute bottom-4 rounded-full bg-black/65 px-4 py-2 text-sm text-white">
            {activePhoto + 1} / {figmaPhotos.length}
          </p>
        </div>
      )}
    </>
  );
}

export default function Workshops2027() {
  return (
    <div className="space-y-6">
      <article className="overflow-hidden rounded-3xl border border-white/15 bg-rh-white/5 shadow-2xl backdrop-blur-md">
        <div className="grid lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
          <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-green-400/30 bg-green-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-green-300">
                Past workshop
              </span>
              <span className="rounded-full bg-rh-white/10 px-3 py-1 text-xs font-semibold text-rh-white/75">
                Open to all majors
              </span>
            </div>

            <h3
              className={`${terminal.className} mb-4 text-3xl font-bold leading-tight text-white sm:text-4xl`}
            >
              Build Your Portfolio Website
            </h3>
            <p className="mb-7 max-w-2xl text-base leading-relaxed text-rh-white/80 sm:text-lg">
              Stand out in the job market by creating and deploying a
              professional portfolio with AI-powered prompt engineering in VS
              Code. No coding experience required.
            </p>

            <dl className="mb-8 grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-rh-yellow" />
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-rh-white/55">
                    Date
                  </dt>
                  <dd className="text-sm font-medium text-white">
                    November 23, 2026
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-rh-yellow" />
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-rh-white/55">
                    Time
                  </dt>
                  <dd className="text-sm font-medium text-white">
                    5:00–7:00 PM
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-rh-yellow" />
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-rh-white/55">
                    Location
                  </dt>
                  <dd className="text-sm font-medium text-white">
                    NI 1027, College of Engineering
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <UtensilsCrossed className="mt-0.5 h-5 w-5 shrink-0 text-rh-yellow" />
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-rh-white/55">
                    Food
                  </dt>
                  <dd className="text-sm font-medium text-white">Free food</dd>
                </div>
              </div>
            </dl>

            <div className="mb-7 flex items-center gap-3 rounded-xl border border-rh-yellow/20 bg-rh-yellow/5 p-4">
              <BookOpen className="h-5 w-5 shrink-0 text-rh-yellow" />
              <p className="text-sm text-rh-white/85">
                Free book for the first 15 attendees.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <a
                href={linkedinPostUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-2 py-3 text-sm font-semibold text-rh-white/75 transition hover:text-rh-yellow"
              >
                View LinkedIn post
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="relative min-h-[420px] bg-black/20 sm:min-h-[560px]">
            <Image
              src="/assets/workshops/build-your-portfolio.png"
              alt="Build Your Portfolio Website workshop poster"
              fill
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-contain p-4 sm:p-6"
              priority={false}
            />
            <div className="absolute bottom-5 left-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/65 px-3 py-2 text-xs font-semibold text-white backdrop-blur">
              <Sparkles className="h-4 w-4 text-rh-yellow" />
              AI-powered · No coding required
            </div>
          </div>
        </div>
      </article>

      <article className="overflow-hidden rounded-3xl border border-white/15 bg-rh-white/5 shadow-2xl backdrop-blur-md">
        <div className="grid lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
          <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-green-400/30 bg-green-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-green-300">
                Past workshop
              </span>
              <span className="rounded-full bg-rh-white/10 px-3 py-1 text-xs font-semibold text-rh-white/75">
                Beginner-friendly
              </span>
            </div>
            <h3
              className={`${terminal.className} mb-4 text-3xl font-bold leading-tight text-white sm:text-4xl`}
            >
              Intro to Figma
            </h3>
            <p className="max-w-2xl text-base leading-relaxed text-rh-white/80 sm:text-lg">
              From first clicks to first creations, participants learned the
              basics of Figma and brought their own ideas to life. Curiosity
              and creativity filled the room—and pizza kept the ideas flowing.
            </p>
          </div>

          <FigmaGallery />
        </div>
      </article>
    </div>
  );
}
