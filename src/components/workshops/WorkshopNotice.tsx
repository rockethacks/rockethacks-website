"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { X } from "lucide-react";

const NOTIFICATION_EXPIRY = Date.parse("2026-11-23T18:00:00-05:00");

export default function WorkshopNotice() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const timeUntilExpiry = NOTIFICATION_EXPIRY - Date.now();
    if (timeUntilExpiry <= 0) return;

    const showTimeout = window.setTimeout(() => setIsVisible(true), 700);
    const expiryTimeout = window.setTimeout(
      () => setIsVisible(false),
      timeUntilExpiry,
    );
    const hideIfExpired = () => {
      if (Date.now() >= NOTIFICATION_EXPIRY) setIsVisible(false);
    };

    document.addEventListener("visibilitychange", hideIfExpired);
    return () => {
      window.clearTimeout(showTimeout);
      window.clearTimeout(expiryTimeout);
      document.removeEventListener("visibilitychange", hideIfExpired);
    };
  }, []);

  const openWorkshops = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const section = document.getElementById("workshops");
    if (!section) return;
    window.history.replaceState(null, "", "#workshops");
    section.scrollIntoView({ behavior: "smooth", block: "start" });
    setIsVisible(false);
  };

  return (
    <aside
      aria-label="Upcoming workshop reminder"
      aria-live="polite"
      className={`fixed left-4 top-24 z-[60] w-[calc(100%-2rem)] max-w-sm transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
        isVisible && !isDismissed
          ? "translate-x-0 scale-100 opacity-100"
          : "-translate-x-[120%] scale-95 opacity-0 pointer-events-none"
      }`}
    >
      <div className="flex items-center gap-3 rounded-2xl border border-rh-yellow/40 bg-rh-navy-dark/95 p-4 shadow-2xl backdrop-blur-xl">
        <a
          href="#workshops"
          onClick={openWorkshops}
          className="min-w-0 flex-1 text-sm font-semibold leading-relaxed text-white hover:text-rh-yellow sm:text-base"
        >
          Hey, did you RSVP for our latest workshop? 👀👩‍💻
        </a>
        <button
          type="button"
          onClick={() => {
            setIsDismissed(true);
            setIsVisible(false);
          }}
          aria-label="Dismiss workshop reminder"
          className="shrink-0 rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
