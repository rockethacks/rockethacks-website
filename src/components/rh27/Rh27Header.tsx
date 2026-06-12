"use client";

import Image from "next/image";
import Link from "next/link";
import { socialLinks } from "@/lib/socialLinks";

export default function Rh27Header() {
  return (
    <header className="absolute top-0 left-0 right-0 z-[70] px-5 sm:px-8 lg:px-10">
      {/* Icon + social row */}
      <div className="flex items-center justify-between h-14 sm:h-16">
        {/* Left: arrow logo — white */}
        <Link
          href="/"
          aria-label="RocketHacks home"
          className="shrink-0 opacity-90 hover:opacity-100 transition-opacity"
        >
          <Image
            src="/assets/rh_26/rh_26_folder/rh_26_bundle_png/rh_26_arrow_transparent.png"
            alt="RocketHacks"
            width={40}
            height={40}
            className="h-8 w-8 sm:h-9 sm:w-9 object-contain brightness-0 invert"
            priority
          />
        </Link>

        {/* Right: social icons + year link */}
        <div className="flex items-center gap-3 sm:gap-4">
          <nav className="flex items-center gap-3 sm:gap-4" aria-label="Social media">
            {socialLinks.map((social) => (
              <Link
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.ariaLabel}
                className="text-white/80 hover:text-white transition-colors"
              >
                <social.icon className="w-[15px] h-[15px] sm:w-[17px] sm:h-[17px]" />
              </Link>
            ))}
          </nav>

          {/* Thin vertical divider */}
          <span className="w-px h-4 bg-white/30 hidden sm:block" aria-hidden />

          <Link
            href="/2026/"
            className="text-white text-sm sm:text-[15px] font-medium tracking-wide hover:opacity-75 transition-opacity"
          >
            2026
          </Link>
        </div>
      </div>

      {/* Full-width horizontal rule */}
      <div className="h-px bg-white/20 w-full" aria-hidden />
    </header>
  );
}
