"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { FiMenu, FiX } from "react-icons/fi";
import { terminal } from "../../app/fonts/fonts";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (menuOpen) {
      document.body.classList.add("no-scroll");
    } else {
      document.body.classList.remove("no-scroll");
    }
  }, [menuOpen]);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  
  const closeMenu = () => setMenuOpen(false);

  const navLinks = [
    { href: "#about", label: "ABOUT" },
    { href: "#gallery", label: "2025" },
    { href: "#sponsor", label: "SPONSORS" },
    { href: "#contact", label: "CONTACT" },
    { href: "#faq", label: "FAQ" },
    // Temporarily hidden - uncomment to enable team page
    // { href: "/team", label: "TEAM" }
  ];

  return (
    <nav className={`
      fixed top-0 left-0 right-0 z-50 transition-all duration-300
      ${scrolled 
        ? 'glass-strong backdrop-blur-md shadow-lg' 
        : 'bg-transparent'
      }
    `}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
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
          </div>

          {/* Centered Desktop Navigation */}
          <div className="hidden md:flex items-center justify-center flex-1 space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className={`
                  ${terminal.className} text-sm font-medium tracking-wider
                  text-rh-white/90 hover:text-rh-yellow transition-colors duration-200
                  relative group
                `}
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-rh-yellow transition-all duration-200 group-hover:w-full"></span>
              </Link>
            ))}
            
            {/* Special CTA Button */}
            <Link
              href="/code-create"
              onClick={closeMenu}
              className="btn-primary px-4 py-2 text-xs"
            >
              CODE & CREATE
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden ml-auto">
            <button
              onClick={toggleMenu}
              className="text-rh-white hover:text-rh-yellow transition-colors duration-200 p-2 relative z-[101]"
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              <FiMenu size={28} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Full-Screen Navigation Menu */}
      {menuOpen && (
        <div 
          className="md:hidden fixed inset-0 z-[9999] animate-fade-in"
          style={{
            backgroundColor: 'rgba(10, 0, 55, 0.98)', // Direct color value
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)'
          }}
        >
          {/* Close button area - ensure it's visible */}
          <div className="absolute top-4 right-4 z-[10001]">
            <button
              onClick={closeMenu}
              className="text-white hover:text-yellow-400 transition-colors duration-200 p-3 bg-white/10 rounded-full"
              aria-label="Close menu"
            >
              <FiX size={28} strokeWidth={2.5} />
            </button>
          </div>

          {/* Menu content - properly spaced */}
          <div className="flex flex-col h-full pt-20 pb-8 px-6 overflow-y-auto">
            {/* Logo at top */}
            <div className="flex justify-center mb-10">
              <Image
                src="/assets/rh_26/rh_26_folder/rh_26_bundle_png/rh_26_logo_color_transparent.png"
                alt="RocketHacks 2026"
                width={150}
                height={75}
                className="h-14 w-auto"
                priority
              />
            </div>
            
            {/* Navigation links - vertically stacked */}
            <nav className="flex flex-col items-stretch space-y-1 flex-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  className={`
                    ${terminal.className}
                    text-xl font-medium tracking-wider
                    text-white hover:text-yellow-400
                    transition-all duration-200
                    py-4 px-6 text-center
                    border-b border-white/10
                    hover:bg-white/5
                    active:bg-white/10
                  `}
                >
                  {link.label}
                </Link>
              ))}
              
              {/* CTA Button */}
              <Link
                href="/code-create"
                onClick={closeMenu}
                className="btn-primary px-6 py-4 text-base mt-8 mx-auto w-11/12 max-w-sm text-center block"
              >
                CODE & CREATE
              </Link>
            </nav>
            
            {/* Footer at bottom */}
            <div className="text-center mt-6 pt-6 border-t border-white/10">
              <p className="text-white/60 text-xs">
                © 2026 RocketHacks - University of Toledo
              </p>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}