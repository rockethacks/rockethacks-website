"use client";
import React from "react";
import dynamic from "next/dynamic";

import Navbar from "@/components/navbar/Navbar";
import Hero from "@/components/hero/Hero";
import About from "@/components/about/About";
import { SponsorData } from "@/components/sponsor/SponsorData";
/* Kept for future use */
/* import Schedule from "@/components/schedule/Schedule"; */
/* import { Prizes } from "@/components/prizes/Prizes"; */

// Lazy load heavy components that are below the fold
const Sponsor = dynamic(() => import("@/components/sponsor/Sponsor"), {
  loading: () => <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-rh-yellow"></div></div>
});

const Gallery = dynamic(() => import("@/components/gallery/Gallery"), {
  loading: () => <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-rh-yellow"></div></div>
});

const Contact = dynamic(() => import("@/components/contact/Contact"));
const Faq = dynamic(() => import("@/components/faq/Faq"));
const Footer = dynamic(() => import("@/components/footer/Footer"));

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar />
      <main className="relative">
        <Hero />
        <About />
        <Sponsor sponsors={SponsorData} />
        {/* Temporarily hidden - uncomment to enable prizes section */}
        {/* <Prizes /> */}
        <Gallery />
        <Contact />
        <Faq />
      </main>
      <Footer />
    </div>
  );
}
