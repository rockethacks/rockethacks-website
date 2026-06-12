import {
  BsTwitterX,
  BsInstagram,
  BsLinkedin,
  BsGithub,
  BsYoutube,
} from "react-icons/bs";
import { FaTiktok } from "react-icons/fa";
import { SiDevpost } from "react-icons/si";
import type { IconType } from "react-icons";

export type SocialLink = {
  href: string;
  ariaLabel: string;
  icon: IconType;
  name: string;
};

export const socialLinks: SocialLink[] = [
  {
    href: "https://rockethacks26.devpost.com/",
    ariaLabel: "Find out more on Devpost",
    icon: SiDevpost,
    name: "Devpost",
  },
  {
    href: "https://x.com/UTRocketHacks",
    ariaLabel: "Follow us on X (Twitter)",
    icon: BsTwitterX,
    name: "X",
  },
  {
    href: "https://www.instagram.com/rockethacks.ut",
    ariaLabel: "Follow us on Instagram",
    icon: BsInstagram,
    name: "Instagram",
  },
  {
    href: "https://www.linkedin.com/company/rocket-hacks",
    ariaLabel: "Follow us on LinkedIn",
    icon: BsLinkedin,
    name: "LinkedIn",
  },
  {
    href: "https://github.com/rockethacks",
    ariaLabel: "Follow us on GitHub",
    icon: BsGithub,
    name: "GitHub",
  },
  {
    href: "https://www.tiktok.com/@ut.rockethacks",
    ariaLabel: "Follow us on TikTok",
    icon: FaTiktok,
    name: "TikTok",
  },
  {
    href: "https://www.youtube.com/@RocketHacks25",
    ariaLabel: "Subscribe to our YouTube channel",
    icon: BsYoutube,
    name: "YouTube",
  },
];
