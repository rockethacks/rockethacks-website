import localFont from "next/font/local";
import { Alegreya_Sans_SC, Josefin_Sans, Plus_Jakarta_Sans } from "next/font/google";

export const josefinSans = Josefin_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-josefin-sans"
});

export const alegreyaSansSC = Alegreya_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-alegreya-sans-sc"
});

// Alegreya Sans SC replaces the previous terminal heading style.
export const terminal = alegreyaSansSC;

// Terminal Grotesque Open for lighter weight text
export const terminalOpen = localFont({ 
  src: "./terminal-grotesque_open.otf",
  display: 'swap',
  variable: '--font-terminal-open'
});

// Plus Jakarta Sans for body text
export const jakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: 'swap',
  variable: '--font-jakarta'
});

// Font combinations for different contexts
export const fontConfig = {
  heading: terminal.className,
  subheading: terminalOpen.className,
  body: jakarta.className,
  code: terminal.className
};