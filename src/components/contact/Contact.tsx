import React from "react";
import localFont from "next/font/local";
import { MdEmail } from "react-icons/md";
import { FaDiscord } from "react-icons/fa";

const terminal = localFont({ src: "../../app/fonts/terminal-grotesque.ttf" });

export default function Contact() {
  return (
    <div className="flex items-center justify-center h-80 bg-gradient-to-b from-[#030c1b]/50 from-28% to-[#081d41]/60 to-90% text-white">
      <section
        id="contact"
        className="text-center py-16 px-5 md:px-10 xl:py-20 xl:px-[300px]"
      >
        <h2
          className={`${terminal.className} text-4xl md:text-6xl mb-8 text-[#FFDA20]`}
        >
          HAVE ANY QUESTIONS?
        </h2>
        <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
          <a href="mailto:rockethacks@utoledo.edu">
            <button className="bg-[#2563EB] px-6 py-2 rounded-lg text-base flex items-center justify-center hover:bg-[#FFDA20] hover:text-white transition-all duration-300 hover:shadow-[0_0_15px_#FFDA20] focus:ring-2 focus:ring-blue-400 focus:outline-none">
              <MdEmail className="h-5 w-auto mr-2" /> rockethacks@utoledo.edu
            </button>
          </a>
          <a href="https://discord.gg/nFKYdrqQ3g">
            <button className="bg-[#2563EB] px-6 py-2 rounded-lg text-base flex items-center justify-center hover:bg-[#FFDA20] hover:text-white transition-all duration-300 hover:shadow-[0_0_15px_#FFDA20] focus:ring-2 focus:ring-blue-400 focus:outline-none">
                <FaDiscord className="h-5 w-auto mr-2" /> discord
              </button>
          </a>
        </div>
      </section>
    </div>
  );
}
