"use client";
import React, { useEffect } from "react";
import dynamic from "next/dynamic";

import Navbar from "@/components/navbar/Navbar";
import Hero from "@/components/hero/Hero";
import About from "@/components/about/About";
import { SponsorData } from "@/components/sponsor/SponsorData";

const Sponsor = dynamic(() => import("@/components/sponsor/Sponsor"), {
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-rh-yellow"></div>
    </div>
  ),
});

const Contact = dynamic(() => import("@/components/contact/Contact"));
const Footer = dynamic(() => import("@/components/footer/Footer"));

export default function Home2026() {
  useEffect(() => {
    const hash =
      typeof window !== "undefined" ? window.location.hash.slice(1) : "";
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
        <Sponsor sponsors={SponsorData} />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
