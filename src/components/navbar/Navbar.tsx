"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { FiMenu, FiX } from "react-icons/fi";
import { terminal } from "../../app/fonts/fonts";
import UserProfileDropdown from "./UserProfileDropdown";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();
  const isHomePage = pathname === "/";

  useEffect(() => {
    if (!menuOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (
        event.target instanceof Element &&
        !event.target.closest("[data-mobile-menu]")
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOnOutsideClick);
    };
  }, [menuOpen]);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      setScrolled(isScrolled);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Get initial user
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const closeMenu = () => setMenuOpen(false);

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    // Anchor links: on home page smooth-scroll; on other pages navigate to /#section
    if (href.startsWith("#")) {
      closeMenu();
      if (isHomePage) {
        e.preventDefault();
        const targetId = href.substring(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }
      // When not on home, Link href is "/#section" so no preventDefault — let navigation happen
    }
  };

  const navLinks: Array<{ href: string; label: string; highlight?: boolean }> = [
    { href: "#about", label: "ABOUT" },
    { href: "#faq", label: "FAQ" },
    { href: "#workshops", label: "WORKSHOPS" },
    { href: "/gallery", label: "2025" },
    { href: "#sponsor", label: "SPONSORS" },
    { href: "#contact", label: "CONTACT" },
    // Temporarily hidden - uncomment to enable team page
    // { href: "/team", label: "TEAM" }
  ];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 backdrop-blur-md shadow-lg"
      style={{ backgroundColor: "#001F02" }}
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link
              href="/"
              className="block transition-transform hover:scale-105"
            >
              <Image
                src="/assets/rh_27/rh_27_folder/rh_27_logo_cropped.png"
                alt="RocketHacks 2027"
                width={120}
                height={60}
                className="h-10 sm:h-12 w-auto object-contain"
                priority
                sizes="120px"
                style={{ aspectRatio: "2/1" }}
              />
            </Link>
          </div>

          {/* Centered Desktop Navigation */}
          <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center justify-center space-x-3 lg:space-x-8 whitespace-nowrap">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href.startsWith("#") ? `/${link.href}` : link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={`
                  ${terminal.className} text-xs font-medium tracking-wider lg:text-sm
                  ${
                    link.highlight
                      ? "text-rh-yellow hover:text-rh-yellow/80 font-bold"
                      : "text-rh-white/90 hover:text-rh-yellow"
                  }
                  transition-colors duration-200
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
              className="btn-primary px-2 py-2 text-xs lg:px-4"
            >
              CODE & CREATE
            </Link>
          </div>

          {/* Keep account controls separate from the centered nav group. */}
          <div className="absolute right-0 md:right-[140px] top-1/2 -translate-y-1/2 flex items-center gap-4">
            {/* User Profile Dropdown - Always visible */}
            <div>
              <UserProfileDropdown />
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={toggleMenu}
                data-mobile-menu
                className="text-rh-white hover:text-rh-yellow transition-colors duration-200 p-2"
                aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-controls="mobile-navigation"
                aria-expanded={menuOpen}
              >
                {menuOpen ? <FiX size={28} /> : <FiMenu size={28} />}
              </button>
            </div>
          </div>

          {/* Compact mobile navigation popover */}
          {menuOpen && (
            <div
              id="mobile-navigation"
              data-mobile-menu
              className="md:hidden absolute right-0 top-[calc(100%+2.25rem)] z-[10001] w-80 max-w-[calc(100vw-2rem)] max-h-[calc(100dvh-9rem)] overflow-y-auto overscroll-contain rounded-2xl border border-white/15 bg-[#001F02]/95 p-3 shadow-2xl backdrop-blur-xl animate-fade-in"
            >
              <div className="flex flex-col">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href.startsWith("#") ? `/${link.href}` : link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className={`${terminal.className} rounded-lg px-4 py-2.5 text-left text-sm font-medium tracking-wider text-rh-white/90 transition-colors hover:bg-white/5 hover:text-rh-yellow`}
                  >
                    {link.label}
                  </Link>
                ))}

                {user && (
                  <UserProfileDropdown isMobile={true} onMenuClose={closeMenu} />
                )}

                <Link
                  href="/code-create"
                  onClick={closeMenu}
                  className="btn-primary mt-3 block w-full px-4 py-3 text-center text-sm"
                >
                  CODE & CREATE
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
