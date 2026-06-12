"use client";
import React from "react";
import Navbar from "@/components/navbar/Navbar";
import Gallery from "@/components/gallery/Gallery";
import Footer from "@/components/footer/Footer";

export default function GalleryPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-rh-background">
      <Navbar />
      <main className="relative pt-20">
        <Gallery />
      </main>
      <Footer />
    </div>
  );
}
