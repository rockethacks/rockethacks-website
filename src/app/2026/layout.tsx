import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RocketHacks 2026 | Hack the Horizon",
  description:
    "RocketHacks is a 24-hour Hackathon hosted by The University of Toledo. Join us in 2026 for the biggest hackathon in the Midwest!",
  openGraph: {
    title: "RocketHacks 2026 | Hack the Horizon",
    description:
      "Join the biggest hackathon in the Midwest at the University of Toledo",
  },
};

export default function Layout2026({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
