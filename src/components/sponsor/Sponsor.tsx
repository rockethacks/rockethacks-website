import React from "react";
import Image from "next/image";
import { FaAws } from "react-icons/fa";
import { DiGithubFull } from "react-icons/di";
import { terminal } from "@/app/fonts/fonts";

// defining SponsorType and SponsorProps
export type SponsorType = {
  type: "image" | "icon";
  src?: string;
  icon?: "github" | "aws";
  alt: string;
  link: string;
};

interface SponsorProps {
  sponsors: SponsorType[];
}

const Sponsor: React.FC<SponsorProps> = ({ sponsors }) => {
  return (
    <div>
      <section
        id="sponsor"
        className="sponsor bg-gradient-to-b from-[#051735] from-10% to-[#030c1b] to-80% text-white py-16 px-5 md:px-10 xl:py-10 xl:px-[300px]"
      >
        <div className="text-center">
          <h2
            className={`${terminal.className} text-4xl md:text-6xl mb-8 text-[#FFDA20]`}
          >
            SPONSORS
          </h2>
        </div>
        {/* Sponsorship CTA Section */}
        <div className="mt-12 mb-12 max-w-3xl w-full mx-auto">
          <div className="border-2 border-blue-600 rounded-lg text-center p-8 flex flex-col items-center justify-center">
            <div>
              <p className="text-base mb-6">
                Are you interested in sponsoring RocketHacks for 2026?
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/documents/sponsorship-packet.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="View sponsorship packet"
                >
                  <button
                    className="bg-blue-600 py-3 px-8 rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none hover:bg-[#FFDA20] hover:text-black transition-all duration-300 hover:shadow-[0_0_15px_#FFDA20]"
                    aria-label="Learn more about sponsorship"
                  >
                    View Sponsorship Packet
                  </button>
                </a>
                <a
                  href="mailto:rockethacks@utoledo.edu?subject=Sponsorship Inquiry - RocketHacks 2026&body=Dear RocketHacks Team,%0A%0AI hope this message finds you well. I am reaching out on behalf of [Company Name] to express our interest in sponsoring RocketHacks 2026.%0A%0AAfter reviewing your event details, we believe this aligns perfectly with our commitment to supporting innovation and empowering the next generation of tech talent. We would love to explore potential partnership opportunities.%0A%0ACould we schedule a time to discuss:%0A• Available sponsorship tiers and benefits%0A• Custom partnership opportunities%0A• How we can best support your event and participants%0A%0APlease let me know your availability for a brief call or meeting.%0A%0AThank you for your time and consideration.%0A%0ABest regards,%0A[Your Name]%0A[Your Title]%0A[Company Name]%0A[Email Address]%0A[Phone Number]"
                  aria-label="Email us about sponsorship"
                >
                  <button
                    className="bg-[#FFDA20] text-black py-3 px-8 rounded-md focus:ring-2 focus:ring-yellow-400 focus:outline-none hover:bg-yellow-500 transition-all duration-300 hover:shadow-[0_0_15px_#FFDA20]"
                    aria-label="Contact us via email"
                  >
                    Contact Us
                  </button>
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-5">
          {/* Mobile View */}
          <div className="flex flex-col items-center justify-center gap-y-2 md:hidden">
            {sponsors.map((sponsor, index) => (
              <a
                key={index}
                href={sponsor.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center"
              >
                {sponsor.type === "image" && sponsor.src ? (
                  <Image
                    src={sponsor.src}
                    alt={sponsor.alt}
                    width={180}
                    height={180}
                    className={`hover:scale-110 transition-transform duration-300 object-contain ${sponsor.src.includes("xyz") ? "w-28 h-28" : ""
                      } ${sponsor.src.includes("spoke") ? "bg-white p-3" : ""}`}
                  />
                ) : sponsor.type === "icon" ? (
                  sponsor.icon === "github" ? (
                    <DiGithubFull className="h-28 w-28 hover:scale-110 transition-transform duration-300" />
                  ) : sponsor.icon === "aws" ? (
                    <FaAws className="h-28 w-28 hover:scale-110 transition-transform duration-300" />
                  ) : null
                ) : null}
              </a>
            ))}
          </div>

          {/* Desktop View */}
          <div className="hidden md:grid grid-cols-5 justify-items-center items-center gap-8">
            {sponsors.map((sponsor, index) => (
              <a
                key={index}
                href={sponsor.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center"
              >
                {sponsor.type === "image" && sponsor.src ? (
                  <Image
                    src={sponsor.src}
                    alt={sponsor.alt}
                    width={180}
                    height={180}
                    className={`hover:scale-110 transition-transform duration-300 object-contain ${sponsor.src.includes("xyz") ? "w-28 h-28" : ""
                      } ${sponsor.src.includes("spoke") ? "bg-white p-3" : ""}`}
                  />
                ) : sponsor.type === "icon" ? (
                  sponsor.icon === "github" ? (
                    <DiGithubFull className="h-28 w-28 hover:scale-110 transition-transform duration-300" />
                  ) : sponsor.icon === "aws" ? (
                    <FaAws className="h-28 w-28 hover:scale-110 transition-transform duration-300" />
                  ) : null
                ) : null}
              </a>
            ))}
          </div>
          
        </div>
      </section>
    </div>
  );
};

export default Sponsor;
