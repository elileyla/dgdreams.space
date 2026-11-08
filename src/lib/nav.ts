import {
  ArrowDownUp,
  BookOpen,
  CheckCircle2,
  FileText,
  HelpCircle,
  Layers,
  Rocket,
  ShieldCheck,
  SquareTerminal,
  Sunrise,
  Swords,
  Trophy,
  type LucideIcon,
} from "lucide-react";

/**
 * The information architecture, in one place.
 *
 * Five destinations in the rail, everything else behind "More". The old
 * build had ten items in a horizontal strip, which is a lot of chrome for a
 * product people open once a day.
 */

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** short description, used in the "More" sheet */
  blurb?: string;
}

export const PRIMARY_NAV: NavItem[] = [
  {
    href: "/dashboard",
    label: "Today",
    icon: Sunrise,
    blurb: "Your streak, today's missions, your score",
  },
  {
    href: "/tasks",
    label: "Ritual",
    icon: CheckCircle2,
    blurb: "Missions, the 6-in-1 run, your badge",
  },
  {
    href: "/leaderboard",
    label: "Ranks",
    icon: Trophy,
    blurb: "Where you stand",
  },
];

export const MORE_NAV: NavItem[] = [
  {
    href: "/gallery",
    label: "Gallery",
    icon: Layers,
    blurb: "The Grand Tour — one free soulbound badge per network",
  },
  {
    href: "/app",
    label: "Console",
    icon: SquareTerminal,
    blurb: "Missions and swap in one screen",
  },
  {
    href: "/swap",
    label: "Swap",
    icon: ArrowDownUp,
  },
  {
    href: "/deploy",
    label: "Deploy",
    icon: Rocket,
  },
  {
    href: "/sybil",
    label: "Risk score",
    icon: ShieldCheck,
  },
  {
    href: "/tournaments",
    label: "Tournaments",
    icon: Swords,
  },
  {
    href: "/faq",
    label: "FAQ",
    icon: HelpCircle,
  },
  {
    href: "/terms",
    label: "Terms",
    icon: BookOpen,
  },
  {
    href: "/license",
    label: "License",
    icon: FileText,
  },
];
