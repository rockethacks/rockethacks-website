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
  keywords:
    "hackathon, programming, technology, university of toledo, coding, innovation",
  authors: [{ name: "RocketHacks Team" }],
  icons: {
    icon: "/assets/rh_26/rh_26_folder/rh_26_bundle_png/rh_26_arrow_transparent.png",
  },
  openGraph: {
    title: "RocketHacks 2026 | Hack the Horizon",
    description:
      "Join the biggest hackathon in the Midwest at the University of Toledo",
    url: "https://rockethacks.org",
    siteName: "RocketHacks",
    images: [
      {
        url: "/assets/rh_26/rh_26_folder/rh_26_bundle_jpg/Rockethacks 26 Linkedin Banner.png",
        width: 1200,
        height: 630,
        alt: "RocketHacks Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RocketHacks 2026 | Hack the Horizon",
    description:
      "Join the biggest hackathon in the Midwest at the University of Toledo",
  },
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
        {children}
      </body>
    </html>
  );
}
