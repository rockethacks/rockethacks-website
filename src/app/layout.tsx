import type { Metadata, Viewport } from "next";
import Image from "next/image";
import { terminal, jakarta } from "./fonts/fonts";
import "./globals.css";

const mlh =
  "https://s3.amazonaws.com/logged-assets/trust-badge/2025/mlh-trust-badge-2025-blue.svg";

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
    url: "https://rockethacks.github.io",
    siteName: "RocketHacks",
    images: [
      {
        url: "/assets/rh_26/rh_26_folder/rh_26_bundle_png/rh_26_logo_color_transparent.png",
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
        <a
          id="mlh-trust-badge"
          className="z-30 fixed right-4 top-0 hidden lg:block transition-transform hover:scale-105"
          href="https://mlh.io/na?utm_source=na-hackathon&utm_medium=TrustBadge&utm_campaign=2025-season&utm_content=yellow"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Major League Hacking 2025 Official"
        >
          <Image
            src={mlh}
            alt="Major League Hacking 2025"
            height={100}
            width={100}
            className="filter drop-shadow-lg"
          />
        </a>
        {children}
      </body>
    </html>
  );
}
