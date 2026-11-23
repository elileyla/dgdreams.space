"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount, useDisconnect } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Flame, PanelLeftClose, PanelLeftOpen, Wallet } from "lucide-react";

import {
  LEGAL_NAV,
  MORE_GROUPS,
  PRIMARY_NAV,
  type NavGroup,
  type NavItem,
} from "@/lib/nav";
import { BADGE_TIERS } from "@/lib/soulbound";
import { BrandLockup, BrandMark } from "@/components/site/Brand";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { useRitual } from "@/hooks/useRitual";

const COLLAPSE_STORE = "dgdreams-sidebar-collapsed";

/**
 * AppRail — the labeled, collapsible sidebar (Option A).
 *
 * Expanded it is 240px wide: the brand and a collapse toggle on top, the
 * navigation in labeled groups (Daily / Tools / Collect / Help & legal),
 * a streak card, and the wallet pinned at the bottom. Collapsed it is the
 * old 64px icon rail, so busy pages like Deploy can take the width back.
 * The collapsed choice is remembered in localStorage, like the theme.
 * Below lg the sidebar is hidden entirely — phones keep MobileNav.
 *
 * The groups come straight from src/lib/nav.ts, so the desktop sidebar and
 * the phone "More" sheet still read the same menu. Predictions stays out:
 * /litvm-market only redirects to /dashboard.
 */

/** The collapse toggle — one button, both directions. */
function CollapseToggle({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const Icon = collapsed ? PanelLeftOpen : PanelLeftClose;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      aria-expanded={!collapsed}
      title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      className="flex items-center justify-center w-9 h-9 shrink-0 rounded-[12px] transition-colors hover:bg-[var(--bg-strong)]"
      style={{ color: "var(--text-tertiary)" }}
    >
      <Icon className="w-[17px] h-[17px]" strokeWidth={1.75} />
    </button>
  );
}

/**
 * The wallet, as one square — the collapsed rail's version.
 *
 * RainbowKit's full button is ~200px wide and does not fit a 64px rail — it
 * used to overflow the chrome and paint over the page. A single icon that
 * opens the same modal, plus the address's first characters once connected.
 */
function RailWallet() {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { disconnect } = useDisconnect();

  const connected = !!isConnected && !!address;

  return (
    <button
      type="button"
      onClick={() => (connected ? disconnect() : openConnectModal?.())}
      title={connected ? "Disconnect wallet" : "Connect wallet"}
      aria-label={connected ? "Disconnect wallet" : "Connect wallet"}
      className="flex items-center justify-center w-10 h-10 rounded-[12px] transition-colors hover:bg-[var(--bg-strong)]"
      style={{
        border: "1px solid var(--border-default)",
        background: isConnected ? "var(--accent-muted)" : "transparent",
        color: isConnected ? "var(--text-bright)" : "var(--text-tertiary)",
      }}
    >
      {isConnected && address ? (
        <span
          className="text-[12px] font-semibold leading-none"
          style={{ letterSpacing: "-0.02em" }}
        >
          {address.slice(2, 4).toUpperCase()}
        </span>
      ) : (
        <Wallet className="w-[18px] h-[18px]" strokeWidth={1.75} />
      )}
    </button>
  );
}

/**
 * The wallet, as a full row — the expanded sidebar's version.
 *
 * Same modal, same disconnect-on-click as the rail square and the phone
 * chip: "Connect wallet", or the short address once connected.
 */
function SidebarWallet() {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { disconnect } = useDisconnect();

  const connected = !!isConnected && !!address;

  return (
    <button
      type="button"
      onClick={() => (connected ? disconnect() : openConnectModal?.())}
      title={connected ? "Disconnect wallet" : "Connect wallet"}
      aria-label={connected ? "Disconnect wallet" : "Connect wallet"}
      className="flex w-full items-center gap-2.5 px-3 h-11 rounded-[12px] text-[12px] font-medium transition-colors hover:bg-[var(--bg-strong)]"
      style={{
        border: "1px solid var(--border-default)",
        background: connected ? "var(--accent-muted)" : "transparent",
        color: "var(--text-primary)",
      }}
    >
      <Wallet
        className="w-[18px] h-[18px] shrink-0"
        strokeWidth={1.75}
        style={{ color: "var(--text-tertiary)" }}
      />
      <span className="min-w-0 flex-1 text-left truncate font-mono">
        {connected && address
          ? `${address.slice(0, 6)}…${address.slice(-4)}`
          : "Connect wallet"}
      </span>
    </button>
  );
}

/**
 * The streak card.
 *
 * The numbers come from useRitual — the same hook behind TodayHero and
 * ScoreRail, read straight from the NikBase contract — so the sidebar
 * never disagrees with the page. The next tier comes from BADGE_TIERS in
 * src/lib/soulbound.ts (Bronze 1d, Silver 7d, Gold 30d, Diamond 100d,
 * Legend 365d), which matches contracts/SoulboundStreak.sol.
 */
function SidebarStreak() {
  const { isConnected } = useAccount();
  const { streak, doneCount, allDone } = useRitual();
  const nextTier = BADGE_TIERS.find((tier) => tier.threshold > streak);

  return (
    <Link
      href="/tasks"
      className="block rounded-[16px] p-4 transition-colors hover:bg-[var(--bg-strong)]"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-default)",
      }}
      aria-label={
        isConnected
          ? `${streak} day streak, ${doneCount} of 3 missions done today. Open the ritual.`
          : "No streak yet. Connect a wallet to start one."
      }
    >
      <div className="flex items-center gap-2">
        <Flame
          className="w-4 h-4 shrink-0"
          strokeWidth={2}
          style={{ color: "var(--accent-text)" }}
        />
        <span
          className="text-[14px] font-semibold"
          style={{ color: "var(--text-bright)" }}
        >
          {isConnected ? `${streak}d streak` : "No streak yet"}
        </span>
      </div>
      <p
        className="mt-1 text-[12px] leading-relaxed"
        style={{ color: "var(--text-tertiary)" }}
      >
        {isConnected
          ? allDone
            ? "Today is done. See you tomorrow."
            : `${doneCount}/3 missions done today`
          : "Connect a wallet to start a streak."}
      </p>
      <div className="mt-3 progress-bar">
        <div
          className="progress-fill"
          style={{
            width: `${isConnected ? (doneCount / 3) * 100 : 0}%`,
          }}
        />
      </div>
      <p
        className="mt-2 text-[12px] font-mono"
        style={{ color: "var(--text-faint)" }}
      >
        {nextTier
          ? `${nextTier.label} at ${nextTier.threshold}d`
          : "Legend — top tier"}
      </p>
    </Link>
  );
}

/** A hairline separator between the sidebar's bands. */
function SidebarDivider({ collapsed }: { collapsed: boolean }) {
  return (
    <span
      aria-hidden
      className={`h-px shrink-0 my-2 ${collapsed ? "w-8" : "w-full"}`}
      style={{ background: "var(--border-default)" }}
    />
  );
}

export default function AppRail() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // The layout ships expanded; only a saved choice collapses it, so the
  // server render and the first paint agree.
  useEffect(() => {
    try {
      if (localStorage.getItem(COLLAPSE_STORE) === "1") setCollapsed(true);
    } catch {
      /* private mode */
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_STORE, next ? "1" : "0");
      } catch {
        /* private mode */
      }
      return next;
    });
  };

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  // One sidebar link. Expanded it is a full row — icon, label, and a lime
  // pill when active, so "where am I" reads at a glance. Collapsed it is
  // the old 40px icon square with the label as a tooltip, and the same
  // lime fill when active — one signal, not two.
  const renderLink = (item: NavItem, { quiet = false } = {}) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    if (collapsed) {
      return (
        <Link
          key={item.href}
          href={item.href}
          aria-label={item.label}
          aria-current={active ? "page" : undefined}
          title={item.label}
          className="group relative flex items-center justify-center w-10 h-10 rounded-[12px] transition-colors"
          style={{
            background: active ? "var(--accent)" : "transparent",
            color: active
              ? "var(--accent-contrast)"
              : quiet
                ? "var(--text-faint)"
                : "var(--text-tertiary)",
          }}
        >
          <Icon
            className={quiet ? "w-4 h-4" : "w-[18px] h-[18px]"}
            strokeWidth={1.75}
          />
        </Link>
      );
    }
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={`flex items-center gap-3 px-3 h-10 rounded-[12px] text-[14px] font-medium transition-colors ${
          active ? "" : "hover:bg-[var(--bg-strong)]"
        }`}
        style={{
          background: active ? "var(--accent)" : "transparent",
          color: active
            ? "var(--accent-contrast)"
            : quiet
              ? "var(--text-faint)"
              : "var(--text-secondary)",
        }}
      >
        <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.75} />
        <span className="min-w-0 truncate">{item.label}</span>
      </Link>
    );
  };

  /** One grouped band: its heading, then its items. */
  const renderGroup = (group: NavGroup, { quiet = false } = {}) => (
    <div key={group.title} className="flex flex-col gap-0.5">
      {collapsed ? null : (
        <p
          className="kicker px-3 pb-1 pt-1"
          style={{ color: "var(--text-faint)" }}
        >
          {group.title}
        </p>
      )}
      {group.items.map((item) => renderLink(item, { quiet }))}
    </div>
  );

  const DAILY_GROUP: NavGroup = { title: "Daily", items: PRIMARY_NAV };
  const [toolGroup, playGroup] = MORE_GROUPS;

  return (
    <nav
      aria-label="Primary"
      className={`hidden lg:flex flex-col shrink-0 h-screen sticky top-0 py-4 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
        collapsed ? "w-16 items-center gap-1" : "w-60 px-3 gap-1"
      }`}
      style={{
        borderRight: "1px solid var(--border-default)",
        background: "var(--bg-base)",
      }}
    >
      {/* Brand + collapse toggle */}
      {collapsed ? (
        <>
          <Link
            href="/"
            aria-label="DGDreams — home"
            className="flex items-center justify-center w-10 h-10 rounded-[12px] mb-1 transition-opacity hover:opacity-80"
          >
            <BrandMark size={26} />
          </Link>
          <CollapseToggle collapsed={collapsed} onToggle={toggleCollapsed} />
        </>
      ) : (
        <div className="flex items-center gap-2 px-1 mb-2">
          <div className="flex-1 min-w-0">
            <BrandLockup size={26} />
          </div>
          <CollapseToggle collapsed={collapsed} onToggle={toggleCollapsed} />
        </div>
      )}

      {/* The daily loop */}
      {renderGroup(DAILY_GROUP)}

      <SidebarDivider collapsed={collapsed} />

      {/* Tools band */}
      {toolGroup ? renderGroup(toolGroup) : null}

      <SidebarDivider collapsed={collapsed} />

      {/* Collect band */}
      {playGroup ? renderGroup(playGroup) : null}

      <div className="flex-1" />

      {/* Streak — expanded only; the collapsed rail has no room for it */}
      {collapsed ? null : <SidebarStreak />}

      <SidebarDivider collapsed={collapsed} />

      {/* Help & legal — quiet reference pages, pinned above the controls */}
      {LEGAL_NAV ? renderGroup(LEGAL_NAV, { quiet: true }) : null}

      <SidebarDivider collapsed={collapsed} />

      {/* Theme + wallet — the only two controls that live in the chrome */}
      {collapsed ? (
        <div className="flex flex-col items-center gap-2">
          <ThemeSwitcher />
          <RailWallet />
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <SidebarWallet />
          </div>
          <ThemeSwitcher />
        </div>
      )}
    </nav>
  );
}
