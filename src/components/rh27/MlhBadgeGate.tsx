"use client";

import { usePathname } from "next/navigation";

export default function MlhBadgeGate() {
  const pathname = usePathname();
  const isRh27Home = pathname === "/" || pathname === "";

  if (isRh27Home) return null;

  return (
    <a
      id="mlh-trust-badge"
      style={{
        display: "block",
        maxWidth: "100px",
        minWidth: "60px",
        position: "fixed",
        right: "50px",
        top: 0,
        width: "10%",
        zIndex: 10000,
      }}
      href="https://mlh.io/na?utm_source=na-hackathon&utm_medium=TrustBadge&utm_campaign=2026-season&utm_content=yellow"
      target="_blank"
      rel="noopener noreferrer"
    >
      <img
        src="https://logged-assets.s3.amazonaws.com/trust-badge/2027/mlh-trust-badge-2027-yellow.svg"
        alt="Major League Hacking 2026 Hackathon Season"
        style={{ width: "100%" }}
      />
    </a>
  );
}
