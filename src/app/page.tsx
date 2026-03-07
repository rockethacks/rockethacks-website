"use client";
import React, { useEffect } from "react";
import dynamic from "next/dynamic";

import Navbar from "@/components/navbar/Navbar";
import Hero from "@/components/hero/Hero";
import About from "@/components/about/About";
import Tracks from "@/components/tracks/Tracks";
import Schedule from "@/components/schedule/Schedule";
import { SponsorData } from "@/components/sponsor/SponsorData";
/* Kept for future use */
/* import { Prizes } from "@/components/prizes/Prizes"; */

// Lazy load heavy components that are below the fold
const Sponsor = dynamic(() => import("@/components/sponsor/Sponsor"), {
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-rh-yellow"></div>
    </div>
  ),
});

const Contact = dynamic(() => import("@/components/contact/Contact"));
const Faq = dynamic(() => import("@/components/faq/Faq"));
const Footer = dynamic(() => import("@/components/footer/Footer"));

export default function Home() {
  // Scroll to section when landing on home with hash (e.g. from Gallery nav)
  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
    if (!hash) return;
    const scrollToSection = () => {
      const el = document.getElementById(hash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    const t = setTimeout(scrollToSection, 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar />
      <main className="relative">
        <Hero />
        <About />
        <Tracks />
        <Schedule />
        <Sponsor sponsors={SponsorData} />
        {/* Temporarily hidden - uncomment to enable prizes section */}
        {/* <Prizes /> */}
        <Contact />
        <Faq />
      </main>
      <Footer />
    </div>
  );
}
