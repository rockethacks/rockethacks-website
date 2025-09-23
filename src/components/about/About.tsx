import React from "react";
import { PiTerminalWindow } from "react-icons/pi";
import { IoDiamond } from "react-icons/io5";
// import { AiOutlineDiscord } from "react-icons/ai";
import { FaHandshake } from "react-icons/fa6";
import { GiBrain } from "react-icons/gi";
import { FaHeartbeat, FaChartLine, FaLeaf } from "react-icons/fa";
import localFont from "next/font/local";
import Link from "next/link";

const terminal = localFont({ src: "../../app/fonts/terminal-grotesque.ttf" });

export default function About() {
  return (
    <div>
      <section
        id="about"
        aria-label="About RocketHacks"
        className="about-us bg-gradient-to-b from-[#030c1b] from-50% to-[#051735] to-90% text-white py-16 px-5 md:px-10 xl:py-20"
      >
        <div className="flex flex-col items-center">
          <h2
            className={`${terminal.className} text-4xl md:text-6xl my-[10px] text-center text-[#FFDA20]`}
          >
            ABOUT US
          </h2>
          <p className="mt-4 text-base text-pretty font-normal text-center max-w-3xl">
            RocketHacks is a 24-hour hackathon hosted by the University of
            Toledo dedicated to fostering innovation and problem-solving among
            students from the Midwest and beyond. This event will gather
            talented students from budding programmers to visionary designers to
            build real solutions to real-world challenges. With an emphasis on
            collaboration, creativity, and technical skills, RocketHacks will
            empower students to turn their ideas into impactful projects.
          </p>
          <div
            className="flex flex-col lg:flex-row items-stretch justify-center gap-4 mt-10 max-w-5xl w-full"
            role="list"
          >
            {/* Box 1 */}
            <div
              className="flex-1 border-2 border-blue-600 rounded-lg text-center p-8 flex flex-col items-center justify-between min-h-[400px]"
              role="listitem"
            >
              <div className="flex-grow flex flex-col justify-center">
                <IoDiamond
                  className="mx-auto mb-4"
                  size={64}
                  color="#FFDA20"
                  aria-hidden="true"
                  role="img"
                />
                <h3
                  className={`${terminal.className} mb-4 text-[#FFDA20] text-[28px] leading-tight h-[70px] flex items-center justify-center`}
                >
                  SPONSOR US FOR 2026
                </h3>
                <p className="text-base h-[50px] flex items-center justify-center">
                  Check out the sponsorship packet(RH26) for more info!
                </p>
              </div>
              <Link
                href="/documents/sponsorship-packet.pdf"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View sponsorship packet"
              >
                <button
                  className="bg-blue-600 py-3 px-20 rounded-md mt-6 focus:ring-2 focus:ring-blue-400 focus:outline-none hover:bg-[#FFDA20] hover:text-white transition-all duration-300 hover:shadow-[0_0_15px_#FFDA20]"
                  aria-label="Download sponsor packet"
                >
                  SPONSOR US
                </button>
              </Link>
            </div>
            {/* Box 2 */}
            <div
              className="flex-1 border-2 border-blue-600 rounded-lg text-center p-8 flex flex-col items-center justify-between min-h-[400px]"
              role="listitem"
            >
              <div className="flex-grow flex flex-col justify-center">
                <PiTerminalWindow
                  className="mx-auto mb-4"
                  size={64}
                  color="#E4335E"
                  aria-hidden="true"
                  role="img"
                />
                <h3
                  className={`${terminal.className} mb-4 text-[#E4335E] text-[28px] leading-tight h-[70px] flex items-center justify-center`}
                >
                  HACKERS
                </h3>
                <p className="text-base h-[50px] flex items-center justify-center">
                  Applications for RocketHacks are now open. Apply to be a hacker
                  today!
                </p>
              </div>
              <Link
                href=""
                target="_blank"
                aria-label="Apply to be a hacker"
              >
                <button
                  className="bg-blue-600 py-3 px-20 rounded-md mt-6 focus:ring-2 focus:ring-blue-400 focus:outline-none hover:bg-[#FFDA20] hover:text-white transition-all duration-300 hover:shadow-[0_0_15px_#FFDA20]"
                  aria-label="Apply now to be a hacker"
                >
                  APPLICATION CLOSED
                </button>
              </Link>
            </div>

            {/* Box 3 */}
            <div
              className="flex-1 border-2 border-blue-600 rounded-lg text-center p-8 flex flex-col items-center justify-between min-h-[400px]"
              role="listitem"
            >
              <div className="flex-grow flex flex-col justify-center">
                <FaHandshake
                  className="mx-auto mb-4"
                  size={64}
                  color="#5865F2"
                  aria-hidden="true"
                  role="img"
                />
                <h3
                  className={`${terminal.className} mb-4 text-[#5865F2] text-[28px] leading-tight h-[70px] flex items-center justify-center`}
                >
                  VOLUNTEER
                </h3>
                <p className="text-base h-[50px] flex items-center justify-center">
                  Do you want to volunteer at RocketHacks this year? Fill out
                  this form.
                </p>
              </div>
              <Link
                href=""
                rel="noopener noreferrer"
                aria-label="Fill the volunteer form"
              >
                <button
                  className="bg-blue-600 py-3 px-20 rounded-md mt-6 focus:ring-2 focus:ring-blue-400 focus:outline-none hover:bg-[#FFDA20] hover:text-white transition-all duration-300 hover:shadow-[0_0_15px_#FFDA20]"
                  aria-label="Fill out the volunteer form"
                >
                  FORM CLOSED
                </button>
              </Link>
            </div>
          </div>
          
          {/* Tracks Section */}
          <h2 className={`${terminal.className} text-4xl md:text-6xl mt-16 mb-8 text-center text-[#FFDA20]`}>
            TRACKS (2025)
          </h2>
          <div className="flex flex-col lg:flex-row items-center justify-center gap-4 max-w-5xl w-full flex-wrap" role="list">
            {/* AI for Good Track */}
            <div className="flex-1 min-w-[280px] border-2 border-blue-600 rounded-lg text-center p-8 flex flex-col items-center justify-between" role="listitem">
              <div>
                <GiBrain className="mx-auto mb-4" size={64} color="#4CAF50" aria-hidden="true" role="img" />
                <h3 className={`${terminal.className} mb-4 text-[#4CAF50] text-[32px]`}>
                  AI FOR GOOD
                </h3>
                <p className="text-base">
                  Develop AI solutions that address social challenges and improve lives.
                </p>
              </div>
            </div>

            {/* Healthcare Track */}
            <div className="flex-1 min-w-[280px] border-2 border-blue-600 rounded-lg text-center p-8 flex flex-col items-center justify-between" role="listitem">
              <div>
                <FaHeartbeat className="mx-auto mb-4" size={64} color="#E91E63" aria-hidden="true" role="img" />
                <h3 className={`${terminal.className} mb-4 text-[#E91E63] text-[32px]`}>
                  HEALTHCARE
                </h3>
                <p className="text-base">
                  Create innovative solutions to improve healthcare delivery and patient care.
                </p>
              </div>
            </div>

            {/* Finance Track */}
            <div className="flex-1 min-w-[280px] border-2 border-blue-600 rounded-lg text-center p-8 flex flex-col items-center justify-between" role="listitem">
              <div>
                <FaChartLine className="mx-auto mb-4" size={64} color="#2196F3" aria-hidden="true" role="img" />
                <h3 className={`${terminal.className} mb-4 text-[#2196F3] text-[32px]`}>
                  FINANCE
                </h3>
                <p className="text-base">
                  Build solutions for financial technology and economic empowerment.
                </p>
              </div>
            </div>

            {/* Sustainability Track */}
            <div className="flex-1 min-w-[280px] border-2 border-blue-600 rounded-lg text-center p-8 flex flex-col items-center justify-between" role="listitem">
              <div>
                <FaLeaf className="mx-auto mb-4" size={64} color="#8BC34A" aria-hidden="true" role="img" />
                <h3 className={`${terminal.className} mb-4 text-[#8BC34A] text-[32px]`}>
                  SUSTAINABILITY
                </h3>
                <p className="text-base">
                  Develop projects that promote environmental sustainability and conservation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
