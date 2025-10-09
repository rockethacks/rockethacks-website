import localFont from "next/font/local";
import { Plus_Jakarta_Sans } from "next/font/google";

// Terminal Grotesque for headings and technical elements
export const terminal = localFont({ 
  src: "./terminal-grotesque.ttf",
  display: 'swap',
  variable: '--font-terminal'
});

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