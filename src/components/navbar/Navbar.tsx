"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FiMenu, FiX } from "react-icons/fi";
import RocketHacks from "../../../public/assets/name-logo.svg";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (menuOpen) {
      document.body.classList.add("no-scroll");
    } else {
      document.body.classList.remove("no-scroll");
    }
  });

  const toggleMenu = () => setMenuOpen(!menuOpen);
//test re deployment
  return (
    <nav className="bg-[#030c1b] text-white text-base sticky top-0 z-20 shadow-md">
      {/* Logo and Hamburger Menu */}
      <div className="container flex justify-around sm:justify-between sm:mx-auto md:justify-center md:space-x-20 items-center h-[3.8rem]">
        {/* Logo */}
        <div className="font-bold">
          <Link href="/" prefetch={true}>
            <RocketHacks className="h-16 w-auto" />
          </Link>
        </div>

        {/* Hamburger Menu for Mobile */}
        <div className="inline-block md:hidden z-30">
          <button
            onClick={toggleMenu}
            className="text-white focus:outline-none" // Added right margin
            aria-label="Toggle menu"
          >
            {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        {/* Desktop Navigation Links */}
        <div className="space-x-10 hidden md:block lg:mr-20 font-medium">
          <Link href="#about" style={{ scrollBehavior: "smooth" }} prefetch={true}>
            ABOUT US
          </Link>
          <Link href="#gallery" prefetch={true}>2025</Link>
          <Link href="#sponsor" prefetch={true}>SPONSORS</Link>
          {/* <Link href="#gallery">GALLERY</Link> */}
          <Link href="#contact" prefetch={true}>CONTACT</Link>
          <Link href="#faq" prefetch={true}>FAQ</Link>
          <Link
            href="https://forms.gle/RV3DVwCddkDvU5eK8"
            target="_blank"
            onClick={toggleMenu}
            prefetch={true}
          >
            {" "}
            CODE & CREATE{" "}
          </Link>
          <Link href="/team" prefetch={true}>MEET THE TEAM</Link>
        </div>
      </div>

      {/* Mobile Full-Screen Navigation Menu */}
      {menuOpen && (
        <div className="bg-[#030c1b]/[99%] text-white inline-block xl:hidden fixed overflow-hidden inset-0  max-h-screen">
          <div className="flex flex-col space-y-10 items-center justify-center h-full text-3xl">
            {/* <Link
              href="/assets/Code&CreateFlyer.pdf"
              target="_blank"
              onClick={toggleMenu}
            > */}
            <Link href="#about" onClick={toggleMenu} prefetch={true}>
              About Us
            </Link>
            <Link
              href="https://forms.gle/RV3DVwCddkDvU5eK8"
              target="_blank"
              onClick={toggleMenu}
              prefetch={true}
            >
              Code & Create
            </Link>
            <Link href="#sponsor" onClick={toggleMenu} prefetch={true}>
              Sponsors
            </Link>
            <Link href="#gallery" onClick={toggleMenu} prefetch={true}>
              2025
            </Link>
            <Link href="#contact" onClick={toggleMenu} prefetch={true}>
              Contact Us
            </Link>
            <Link href="#faq" onClick={toggleMenu} prefetch={true}>
              FAQ
            </Link>
            <Link href="/team" onClick={toggleMenu} prefetch={true}>
              Meet The Team
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}