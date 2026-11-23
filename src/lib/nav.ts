import {
  ArrowDownUp,
  BookOpen,
  CheckCircle2,
  FileText,
  HelpCircle,
  Layers,
  Play,
  Rocket,
  ShieldCheck,
  SquareTerminal,
  Sunrise,
  Trophy,
  type LucideIcon,
} from "lucide-react";

/**
 * The information architecture, in one place.
 *
 * Three destinations in the rail (the daily loop), then everything else
 * grouped so the rail reads in labeled bands instead of one flat list of
 * twelve icons. The groups drive both the desktop rail and the \"More\" sheet,
 * so the menu is written once and stays in sync.
 */

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** short description, used in the \"More\" sheet */
  blurb?: string;
}

export interface NavGroup {
  /** Tiny caption used in the More sheet (\"Tools\", \"Collect\", …). */
  title: string;
  items: NavItem[];
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

/** Tools — the workbench screens you drive manually. */
export const TOOL_NAV: NavGroup = {
  title: "Tools",
  items: [
    {
      href: "/app",
      label: "Console",
      icon: SquareTerminal,
      blurb: "Missions and swap in one screen",
    },
    {
      href: "/run",
      label: "Run",
      icon: Play,
      blurb: "Missions and deploys, one card at a time",
    },
    {
      href: "/swap",
      label: "Swap",
      icon: ArrowDownUp,
      blurb: "Swap across the supported chains",
    },
    {
      href: "/deploy",
      label: "Deploy",
      icon: Rocket,
      blurb: "One-click contract deployment",
    },
  ],
};

/**
 * Predictions is deliberately not listed here: /litvm-market only redirects
 * to /dashboard — the prediction markets on LiteVM were removed. If they
 * ever come back, add the entry here and restore the page.
 */

/** Collect — the parts of the product you build up over time. */
export const PLAY_NAV: NavGroup = {
  title: "Collect",
  items: [
    {
      href: "/gallery",
      label: "Gallery",
      icon: Layers,
      blurb: "The Grand Tour — one free soulbound badge per network",
    },
    {
      href: "/sybil",
      label: "Risk score",
      icon: ShieldCheck,
      blurb: "How sybil-like your wallet looks",
    },
  ],
};

/**
 * Tournaments is deliberately not listed here: /tournaments only redirects
 * to /dashboard — the tournaments lived in the LiteVM Hub, and both are
 * gone. Listing it promised \"seasonal competitions and prizes\" that do not
 * exist. If tournaments ever come back, add the entry here and the page.
 */

/** Help & legal — quiet reference pages, kept out of the main flow. */
export const LEGAL_NAV: NavGroup = {
  title: "Help & legal",
  items: [
    {
      href: "/faq",
      label: "FAQ",
      icon: HelpCircle,
      blurb: "Answers to the common questions",
    },
    {
      href: "/terms",
      label: "Terms",
      icon: BookOpen,
      blurb: "The rules of the platform",
    },
    {
      href: "/license",
      label: "License",
      icon: FileText,
      blurb: "What the code may be used for",
    },
  ],
};

/** Everything that is not the daily loop, in reading order. */
export const MORE_GROUPS: NavGroup[] = [TOOL_NAV, PLAY_NAV, LEGAL_NAV];

/** Flat list of the same items — kept for the \"More\" sheet and any single
 *  \"is this link anywhere?\" checks. */
export const MORE_NAV: NavItem[] = MORE_GROUPS.flatMap((g) => g.items);
