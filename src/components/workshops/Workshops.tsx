"use client";

import { useState } from "react";
import { terminal } from "@/app/fonts/fonts";
import Workshops2027 from "./Workshops2027";
import Workshops2026 from "./Workshops2026";
import Workshops2025 from "./Workshops2025";

type WorkshopYear = "2027" | "2026" | "2025";

const years: WorkshopYear[] = ["2027", "2026", "2025"];

export default function Workshops() {
  const [activeYear, setActiveYear] = useState<WorkshopYear>("2027");

  return (
    <section
      id="workshops"
      aria-labelledby="workshops-heading"
      className="relative scroll-mt-20 overflow-hidden px-5 py-16 text-white md:px-10 xl:py-24"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-rh-navy-light/80 via-rh-background/90 to-rh-navy-dark/90" />
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 25px 25px, rgba(255, 196, 90, 0.3) 2px, transparent 0)",
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <header className="mb-10 text-center md:mb-14">
          <h2
            id="workshops-heading"
            className={`${terminal.className} heading-lg gradient-text mb-5 uppercase tracking-wider`}
          >
            Workshops
          </h2>
          <div className="mx-auto mb-6 h-1 w-24 rounded-full bg-gradient-to-r from-rh-yellow to-rh-orange" />
          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-rh-white/85">
            Learn new tools, build practical skills, and make something you can
            take beyond the workshop.
          </p>
        </header>

        <div
          role="tablist"
          aria-label="Workshop year"
          className="mb-8 flex justify-center gap-2"
        >
          {years.map((year) => (
            <button
              key={year}
              id={`workshops-tab-${year}`}
              type="button"
              role="tab"
              aria-selected={activeYear === year}
              aria-controls={`workshops-panel-${year}`}
              onClick={() => setActiveYear(year)}
              className={`${terminal.className} rounded-lg border px-6 py-3 text-sm font-semibold tracking-wider transition-colors ${
                activeYear === year
                  ? "border-rh-yellow bg-rh-yellow text-rh-navy-dark"
                  : "border-white/15 bg-white/5 text-rh-white/75 hover:border-rh-yellow/50 hover:text-rh-yellow"
              }`}
            >
              {year}
            </button>
          ))}
        </div>

        <div
          id="workshops-panel-2027"
          role="tabpanel"
          aria-labelledby="workshops-tab-2027"
          tabIndex={activeYear === "2027" ? 0 : -1}
          hidden={activeYear !== "2027"}
        >
          <Workshops2027 />
        </div>
        <div
          id="workshops-panel-2026"
          role="tabpanel"
          aria-labelledby="workshops-tab-2026"
          tabIndex={activeYear === "2026" ? 0 : -1}
          hidden={activeYear !== "2026"}
        >
          <Workshops2026 />
        </div>
        <div
          id="workshops-panel-2025"
          role="tabpanel"
          aria-labelledby="workshops-tab-2025"
          tabIndex={activeYear === "2025" ? 0 : -1}
          hidden={activeYear !== "2025"}
        >
          <Workshops2025 />
        </div>
      </div>
    </section>
  );
}
