"use client";
import React, { useEffect, useState } from "react";

import Navbar from "@/components/navbar/Navbar";
import Hero from "@/components/hero/Hero";
import About from "@/components/about/About";
import Faq from "@/components/faq/Faq";
import Sponsor from "@/components/sponsor/Sponsor";
import { SponsorData } from "@/components/sponsor/SponsorData";
import Footer from "@/components/footer/Footer";
import Contact from "@/components/contact/Contact";
import { Prizes } from "@/components/prizes/Prizes";
/* Kept for future use */
/* import Schedule from "@/components/schedule/Schedule"; */
import Gallery from "@/components/gallery/Gallery";

export default function Home() {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("hasSeenAlert")) {
      setShowModal(true);
      localStorage.setItem("hasSeenAlert", "true");
    }
  }, []);

  return (
    <div>
      {/* {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gradient-to-b from-[#030C1B] from-10% to-50% to-[#081D41] border-2 border-[#FFDA20] p-6 rounded-lg shadow-lg text-center max-w-md">
            <h2 className="text-2xl font-bold text-[#FFDA20]">Register Now!</h2>
            <p className="text-white mt-2">
              Please use the Google Form provided on the homepage to register.
            </p>
            <button
              className="mt-4 bg-[#FFDA20] text-black px-4 py-2 rounded hover:bg-yellow-500 transition"
              onClick={() => setShowModal(false)}
            >
              Got it!
            </button>
          </div>
        </div>
      )} */}

      <Navbar />
      <Hero />
      <About />
      <Sponsor sponsors={SponsorData} />
      <Prizes />
      <Gallery />
      <Contact />
      <Faq />
      <Footer />
    </div>
  );
}
