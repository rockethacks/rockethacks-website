"use client";

import { usePathname } from "next/navigation";

export default function MlhBadgeGate() {
  const pathname = usePathname();
  const isRh27Home = pathname === "/" || pathname === "";

  if (isRh27Home) return null;

  return (
    <a
      id="mlh-trust-badge"
      className="fixed top-0 right-0 w-[50px] sm:w-[65px] md:w-[80px] lg:w-[100px] max-w-[100px] min-w-[50px] z-[45] hidden md:block transition-transform hover:scale-105 active:scale-95"
      href="https://mlh.io/na?utm_source=na-hackathon&utm_medium=TrustBadge&utm_campaign=2026-season&utm_content=yellow"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Major League Hacking 2026 Hackathon Season"
    >
      <img
        src="https://s3.amazonaws.com/logged-assets/trust-badge/2026/mlh-trust-badge-2026-yellow.svg"
        alt="Major League Hacking 2026 Hackathon Season"
        style={{ width: "100%" }}
        className="filter drop-shadow-lg"
      />
    </a>
  );
}
