import type { Metadata, Viewport } from "next";
import { terminal, jakarta } from "./fonts/fonts";
import MlhBadgeGate from "@/components/rh27/MlhBadgeGate";
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
  title: "RocketHacks 2027 | February 27–28",
  description:
    "RocketHacks returns February 27–28, 2027 at the University of Toledo. In-person event, MLH Official Member.",
  keywords:
    "hackathon, programming, technology, university of toledo, coding, innovation",
  authors: [{ name: "RocketHacks Team" }],
  icons: {
    icon: "/assets/rh_26/rh_26_folder/rh_26_bundle_png/rh_26_arrow_transparent.png",
  },
  openGraph: {
    title: "RocketHacks 2027 | February 27–28",
    description:
      "RocketHacks February 27–28, 2027 at the University of Toledo. In-person, MLH Official Member.",
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
    title: "RocketHacks 2027 | February 27–28",
    description:
      "RocketHacks February 27–28, 2027 at the University of Toledo. In-person, MLH Official Member.",
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
        <MlhBadgeGate />
        {children}
      </body>
    </html>
  );
}
