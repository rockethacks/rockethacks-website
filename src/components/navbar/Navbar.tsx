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

  const navLinks = [
    { href: "#about", label: "ABOUT" },
    { href: "#gallery", label: "2025" },
    { href: "#sponsor", label: "SPONSORS" },
    { href: "#contact", label: "CONTACT" },
    { href: "#faq", label: "FAQ" },
    { href: "/team", label: "TEAM" }
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
              href="https://forms.gle/RV3DVwCddkDvU5eK8"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary px-4 py-2 text-xs"
            >
              CODE & CREATE
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-rh-white hover:text-rh-yellow transition-colors duration-200 p-2"
              aria-label="Toggle menu"
            >
              {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Full-Screen Navigation Menu */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-rh-navy-dark/95 backdrop-blur-lg">
          <div className="flex flex-col items-center justify-center h-full space-y-8 text-center px-6">
            <div className="mb-8">
              <Image
                src="/assets/rh_26/rh_26_folder/rh_26_bundle_png/rh_26_logo_color_transparent.png"
                alt="RocketHacks 2026"
                width={150}
                height={75}
                className="h-16 w-auto"
              />
            </div>
            
            {navLinks.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={toggleMenu}
                className={`
                  ${terminal.className} text-2xl font-medium tracking-wider
                  text-rh-white hover:text-rh-yellow transition-all duration-300
                  transform hover:scale-110 animate-slide-up
                `}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {link.label}
              </Link>
            ))}
            
            <Link
              href="https://forms.gle/RV3DVwCddkDvU5eK8"
              target="_blank"
              rel="noopener noreferrer"
              onClick={toggleMenu}
              className="btn-primary px-8 py-3 text-lg mt-4 animate-fade-scale"
              style={{ animationDelay: '0.6s' }}
            >
              CODE & CREATE
            </Link>
            
            <div className="absolute bottom-8 left-0 right-0 text-center">
              <p className="text-rh-white/60 text-sm">
                © 2026 RocketHacks - University of Toledo
              </p>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}