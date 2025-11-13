import React from "react";
import { BsTwitterX, BsInstagram, BsLinkedin, BsGithub, BsYoutube } from "react-icons/bs";
import { FaTiktok } from "react-icons/fa";
import { SiDevpost } from "react-icons/si";
import { HiMail, HiLocationMarker } from "react-icons/hi";
import Image from "next/image";
import Link from "next/link";
import { terminal } from "../../app/fonts/fonts";

export default function Footer() {
  const socialLinks = [
    {
      href: "https://rockethacks.devpost.com/?_gl=1*zs3ybp*_gcl_au*MjA1MjQ4MjgxNC4xNzM2ODEwMTE1*_ga*ODY0Mjg3NTg0LjE3Mjc3MTE4NjM.*_ga_0YHJK3Y10M*MTc0MDMyNzM0OC4yMi4wLjE3NDAzMjczNDguMC4wLjA.",
      ariaLabel: "Find out more on Devpost",
      icon: SiDevpost,
      name: "Devpost"
    },
    {
      href: "https://x.com/UTRocketHacks",
      ariaLabel: "Follow us on X (Twitter)",
      icon: BsTwitterX,
      name: "X"
    },
    {
      href: "https://www.instagram.com/rockethacks.ut",
      ariaLabel: "Follow us on Instagram",
      icon: BsInstagram,
      name: "Instagram"
    },
    {
      href: "https://www.linkedin.com/company/rocket-hacks",
      ariaLabel: "Follow us on LinkedIn",
      icon: BsLinkedin,
      name: "LinkedIn"
    },
    {
      href: "https://github.com/rockethacks",
      ariaLabel: "Follow us on GitHub",
      icon: BsGithub,
      name: "GitHub"
    },
    {
      href: "https://www.tiktok.com/@ut.rockethacks",
      ariaLabel: "Follow us on TikTok",
      icon: FaTiktok,
      name: "TikTok"
    },
    {
      href: "https://www.youtube.com/@RocketHacks25",
      ariaLabel: "Subscribe to our YouTube channel",
      icon: BsYoutube,
      name: "YouTube"
    }
  ];

  const quickLinks = [
    { href: "#about", label: "About" },
    { href: "#sponsor", label: "Sponsors" },
    { href: "#contact", label: "Contact" },
    { href: "#faq", label: "FAQ" },
    { href: "/team", label: "Team" }
  ];

  return (
    <footer className="relative bg-gradient-to-b from-rh-navy-light to-rh-navy-dark text-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25px 25px, rgba(255, 196, 90, 0.3) 2px, transparent 0)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <Image
                src="/assets/rh_26/rh_26_folder/rh_26_bundle_png/rh_26_logo_color_transparent.png"
                alt="RocketHacks 2026"
                width={200}
                height={100}
                className="h-16 w-auto"
              />
            </div>
            <p className="text-rh-white/80 leading-relaxed mb-6 max-w-md">
              RocketHacks is the premier 24-hour hackathon in the Midwest, hosted by the 
              University of Toledo. Join us in 2026 as we hack the horizon together.
            </p>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-rh-white/70">
                <HiLocationMarker className="text-rh-yellow" size={20} />
                <span>University of Toledo, Toledo, OH</span>
              </div>
              <div className="flex items-center space-x-3 text-rh-white/70">
                <HiMail className="text-rh-yellow" size={20} />
                <Link 
                  href="mailto:rockethacks@rockets.utoledo.edu"
                  className="hover:text-rh-yellow transition-colors"
                >
                  rockethacks@rockets.utoledo.edu
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className={`${terminal.className} text-lg font-semibold text-rh-yellow mb-6 uppercase tracking-wider`}>
              Quick Links
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-rh-white/70 hover:text-rh-yellow transition-colors duration-200 block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className={`${terminal.className} text-lg font-semibold text-rh-yellow mb-6 uppercase tracking-wider`}>
              Follow Us
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {socialLinks.map((social) => (
                <Link
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.ariaLabel}
                  className="flex items-center space-x-2 p-2 rounded-lg bg-rh-white/5 hover:bg-rh-yellow/10 
                           text-rh-white/70 hover:text-rh-yellow transition-all duration-200 group"
                >
                  <social.icon size={18} className="group-hover:scale-110 transition-transform" />
                  <span className="text-sm">{social.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-rh-white/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-rh-white/60 text-sm">
              © 2026 RocketHacks. All rights reserved. Made with ❤️ by the RocketHacks team.
            </div>
            <div className="flex items-center space-x-6 text-sm text-rh-white/60">
              <Link href="/privacy" className="hover:text-rh-yellow transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-rh-yellow transition-colors">
                Terms of Service
              </Link>
              <Link 
                href="https://mlh.io/code-of-conduct" 
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-rh-yellow transition-colors"
              >
                MLH Code of Conduct
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-10 right-10 w-2 h-2 bg-rh-yellow rounded-full animate-pulse opacity-60"></div>
      <div className="absolute bottom-20 left-10 w-3 h-3 bg-rh-orange rounded-full animate-bounce opacity-40"></div>
      <div className="absolute top-1/2 right-20 w-1 h-1 bg-rh-purple-light rounded-full animate-ping opacity-70"></div>
    </footer>
  );
}
