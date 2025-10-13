"use client";
import React from "react";

import Navbar from "@/components/navbar/Navbar";
import Hero from "@/components/hero/Hero";
import About from "@/components/about/About";
import Faq from "@/components/faq/Faq";
import Sponsor from "@/components/sponsor/Sponsor";
import { SponsorData } from "@/components/sponsor/SponsorData";
import Footer from "@/components/footer/Footer";
import Contact from "@/components/contact/Contact";
/* Kept for future use */
/* import Schedule from "@/components/schedule/Schedule"; */
/* import { Prizes } from "@/components/prizes/Prizes"; */
import Gallery from "@/components/gallery/Gallery";

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
