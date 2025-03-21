"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import localFont from "next/font/local";

const terminal = localFont({ src: "../../app/fonts/terminal-grotesque.ttf" });

const teamSections = [
  {
    section: "Director",
    members: [
      { name: "Caleb", img: "/team photos/caleb.jpeg", link: "https://www.linkedin.com/in/calebmonteiro/" },
    ],
  },
  {
    section: "Co-Director",
    members: [
      { name: "Aadinath", img: "/team photos/aadi.jpg", link: "https://www.linkedin.com/in/aadinath-sanjeev-686205201/" },
      { name: "Kavish", img: "/team photos/kavish.jpg", link: "https://www.linkedin.com/in/kshetty3/" },
    ],
  },
  {
    section: "Sponsorship Lead",
    members: [
      { name: "Nikhil", img: "/team photos/nikhil.jpg", link: "https://www.linkedin.com/in/nikhil-ankam/" },
    ],
  },
  {
    section: "Sponsorship Team",
    members: [
      { name: "Maheen", img: "/team photos/maheen.jpg", link: "https://www.linkedin.com/in/maheenasim?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app" },
      { name: "Kartik", img: "/team photos/karthik.jpg", link: "https://www.linkedin.com/in/kartik-nair-b290b72b6/" },
    ],
  },
  {
    section: "Tech-Dev Lead",
    members: [
      { name: "Vedant", img: "/team photos/vedant.png", link: "https://www.linkedin.com/in/vedantgosavi/" },
    ],
  },
  {
    section: "Tech-Dev",
    members: [
      { name: "Aditya", img: "/team photos/aditya-tech dev.jpg", link: "https://www.linkedin.com/in/aditya-mhambrey/" },
      { name: "Shivom", img: "/team photos/shivom.jpg", link: "https://www.linkedin.com/in/shivom-vr/" },
      { name: "Pranav", img: "/team photos/pranav.jpg", link: "https://www.linkedin.com/in/justprnv/" },
      { name: "Charlie", img: "/team photos/charlie.png", link: "https://www.linkedin.com/in/charles-voss-7172232bb/" },
    ],
  },
  {
    section: "Safety Team",
    members: [
      { name: "Shaan", img: "/team photos/shaan.png", link: "https://www.linkedin.com/in/shaankagadagar/" },
      { name: "Nandan", img: "/team photos/nandan.jpg", link: "https://www.linkedin.com/in/nandanreddy15/" },
    ],
  },
  {
    section: "Judging Lead",
    members: [
      { name: "Adithya", img: "/team photos/aditya2.jpg", link: "https://www.linkedin.com/in/adithya-sudhakar-680681334/" },
    ],
  },
  {
    section: "Judging Team",
    members: [
      { name: "Finni", img: "/team photos/finni.jpg", link: "https://www.linkedin.com/in/finni-sam-saju-40a876296/" },
    ],
  },
  {
    section: "Marketing Lead",
    members: [
      { name: "Runil", img: "/team photos/runil.jpg", link: "https://www.linkedin.com/in/runildaptardar/" },
    ],
  },
  {
    section: "Marketing Co-Lead",
    members: [
      { name: "Ayan", img: "/team photos/ayan.jpg", link: "https://www.linkedin.com/in/mirza-ayan-baig-0159162a9/" },
    ],
  },
  {
    section: "Marketing",
    members: [
      { name: "Ann", img: "/team photos/ann.jpg", link: "https://www.linkedin.com/in/ann-treasa-sojan-4380b72b6/" },
      { name: "Bhumika", img: "/team photos/bhumika.jpg", link: "https://www.linkedin.com/in/bhumika-agarwal27" },
      { name: "Shubham", img: "/team photos/shubham.jpg", link: "https://www.linkedin.com/in/shubham-verma-cse" },
    ],
  },
  {
    section: "High-School Planning",
    members: [
      { name: "Insiyah", img: "/team photos/insiyah.jpg", link: "https://www.linkedin.com/in/irajkot1106/" },
    ],
  },
];

const teamMembers = teamSections.flatMap((section) =>
  section.members.map((member) => ({
    ...member,
    position: section.section,
  }))
);

export default function TeamPage() {
  return (
    <main className="bg-gradient-to-b from-[#030c1b] from-20% to-[#051735] to-40% text-white min-h-screen w-screen m-0 p-0">
      <section className="py-12 px-6">
        <h1
          className={`${terminal.className} text-6xl font-bold text-center mb-12 text-[#FFDA20]`}
        >
          Meet the Team
        </h1>
        {/* 7-column responsive grid with increased row spacing */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-x-8 gap-y-20 justify-items-center">
          {teamMembers.map((member, i) => (
            <Link
              key={i}
              href={member.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block transform transition-transform duration-300 hover:-translate-y-2"
            >
              <div className="relative w-36 h-36 rounded-full overflow-hidden">
                <Image
                  src={member.img}
                  alt={member.name}
                  fill
                  className="object-cover"
                />
              </div>
              <p className="mt-2 text-center text-yellow-500">{member.name}</p>
              <p className="text-center text-gray-300">{member.position}</p>
            </Link>
          ))}
        </div>

        <div className="flex justify-center mt-12">
          <Link
            href="/"
            className="bg-yellow-500 text-black font-semibold px-6 py-3 rounded-full hover:bg-yellow-600 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </section>
    </main>
  );
}
