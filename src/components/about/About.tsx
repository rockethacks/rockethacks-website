import React from "react";
import { PiTerminalWindow } from "react-icons/pi";
import { IoDiamond } from "react-icons/io5";
// import { AiOutlineDiscord } from "react-icons/ai";
import { FaHandshake } from "react-icons/fa6";
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
            className="flex flex-col lg:flex-row items-center justify-center gap-4 mt-10 max-w-5xl w-full"
            role="list"
          >
            {/* Box 1 */}
            <div
              className="flex-1 border-2 border-blue-600 rounded-lg text-center p-8 flex flex-col items-center justify-between"
              role="listitem"
            >
              <div>
                <IoDiamond
                  className="mx-auto mb-4"
                  size={64}
                  color="#FFDA20"
                  aria-hidden="true"
                  role="img"
                />
                <h3
                  className={`${terminal.className} mb-4 text-[#FFDA20] text-[32px]`}
                >
                  SPONSORS
                </h3>
                <p className="text-base">
                  Check out the sponsorship packet for more info!
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
              className="flex-1 border-2 border-blue-600 rounded-lg text-center p-8 flex flex-col items-center justify-between"
              role="listitem"
            >
              <div>
                <PiTerminalWindow
                  className="mx-auto mb-4"
                  size={64}
                  color="#E4335E"
                  aria-hidden="true"
                  role="img"
                />
                <h3
                  className={`${terminal.className} mb-4 text-[#E4335E] text-[32px]`}
                >
                  HACKERS
                </h3>
                <p className="text-base">
                  Applications for RocketHacks are now open.&nbsp; Apply to be a
                  hacker today!
                </p>
              </div>
              <Link
                href="https://form.jotform.com/rockethacks25/rh25RegForm"
                target="_blank"
                aria-label="Apply to be a hacker"
              >
                <button
                  className="bg-blue-600 py-3 px-20 rounded-md mt-6 focus:ring-2 focus:ring-blue-400 focus:outline-none hover:bg-[#FFDA20] hover:text-white transition-all duration-300 hover:shadow-[0_0_15px_#FFDA20]"
                  aria-label="Apply now to be a hacker"
                >
                  APPLY NOW
                </button>
              </Link>
            </div>

            {/* Box 3 */}
            <div
              className="flex-1 border-2 border-blue-600 rounded-lg text-center p-8 flex flex-col items-center justify-between"
              role="listitem"
            >
              <div>
                <FaHandshake
                  className="mx-auto mb-4"
                  size={64}
                  color="#5865F2"
                  aria-hidden="true"
                  role="img"
                />
                <h3
                  className={`${terminal.className} mb-4 text-[#5865F2] text-[32px]`}
                >
                  VOLUNTEER
                </h3>
                <p className="text-base">
                  Do you want to volunteer at RocketHacks this year? Fill out
                  this form.
                </p>
              </div>
              <Link
                href="https://docs.google.com/forms/d/e/1FAIpQLSeAmg3YExuSxCsBWOElKdpByMP_UXKGnB4HJZtd29xJTXnZzQ/viewform?usp=dialog"
                rel="noopener noreferrer"
                aria-label="Fill the volunteer form"
              >
                <button
                  className="bg-blue-600 py-3 px-20 rounded-md mt-6 focus:ring-2 focus:ring-blue-400 focus:outline-none hover:bg-[#FFDA20] hover:text-white transition-all duration-300 hover:shadow-[0_0_15px_#FFDA20]"
                  aria-label="Fill out the volunteer form"
                >
                  VOLUNTEER
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
