import type { Metadata, Viewport } from "next";
import { terminal, jakarta } from "./fonts/fonts";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 2,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#030c1b" },
    { media: "(prefers-color-scheme: dark)", color: "#030c1b" },
  ],
  colorScheme: "dark",
  // Ensure proper rendering on different devices
  interactiveWidget: "resizes-visual",
};

export const metadata: Metadata = {
  title: "RocketHacks 2026 | Hack the Horizon",
  description:
    "RocketHacks is a 24-hour Hackathon hosted by The University of Toledo. Join us in 2026 for the biggest hackathon in the Midwest!",
  keywords: "hackathon, programming, technology, university of toledo, coding, innovation",
  authors: [{ name: "RocketHacks Team" }],
  openGraph: {
    title: "RocketHacks 2026 | Hack the Horizon",
    description: "Join the biggest hackathon in the Midwest at the University of Toledo",
    url: "https://rockethacks.org",
    siteName: "RocketHacks",
    images: [
      {
        url: "/assets/rh_26/rh_26_folder/rh_26_bundle_jpg/Rockethacks 26 Linkedin Banner.png",
        width: 1200,
        height: 630,
        alt: "RocketHacks Logo"
      }
    ],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "RocketHacks 2026 | Hack the Horizon",
    description: "Join the biggest hackathon in the Midwest at the University of Toledo"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${terminal.variable} ${jakarta.variable}`}>
      <body className={`${jakarta.className} antialiased`}>
        {/* MLH 2026 Trust Badge - Positioned far right to avoid profile icon */}
        <a
          id="mlh-trust-badge"
          className="fixed top-0 right-0 w-[50px] sm:w-[65px] md:w-[80px] lg:w-[100px] max-w-[100px] min-w-[50px] z-[45] block transition-transform hover:scale-105 active:scale-95"
          style={{ display: 'block' }}
          href="https://mlh.io/na?utm_source=na-hackathon&utm_medium=TrustBadge&utm_campaign=2026-season&utm_content=yellow"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Major League Hacking 2026 Hackathon Season"
        >
          <img
            src="https://s3.amazonaws.com/logged-assets/trust-badge/2026/mlh-trust-badge-2026-yellow.svg"
            alt="Major League Hacking 2026 Hackathon Season"
            style={{ width: '100%' }}
            className="filter drop-shadow-lg"
          />
        </a>
        {children}
      </body>
    </html>
  );
}
