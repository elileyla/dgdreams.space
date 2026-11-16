"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount, useDisconnect } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Wallet } from "lucide-react";

import {
  LEGAL_NAV,
  MORE_GROUPS,
  PRIMARY_NAV,
  type NavGroup,
  type NavItem,
} from "@/lib/nav";
import { BrandMark } from "@/components/site/Brand";
import ThemeSwitcher from "@/components/ThemeSwitcher";

/**
 * AppRail — the 64px icon rail on the left.
 *
 * The rail reads in labeled bands: the daily loop on top, then the grouped
 * rest of the menu with hairline separators between the bands, and the quiet
 * help/legal pages pinned near the bottom at half strength. Icons only, with
 * the label as a tooltip, so the rail never becomes a second navigation bar.
 * The active page gets a slim accent bar on the rail's edge, so "where am I"
 * reads from across the room.
 */
/**
 * The wallet, as one square.
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

/** A hairline separator between the rail's bands. */
function RailDivider({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`h-px w-8 shrink-0 ${className}`}
      style={{ background: "var(--border-default)" }}
    />
  );
}

export default function AppRail() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  // One rail link. Icons only, with the label as a tooltip, so the rail holds
  // the entire menu at a constant 64px. The active link gets both the filled
  // pill and a slim accent bar on the rail edge — two signals, one glance.
  const renderLink = (item: NavItem, { quiet = false } = {}) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-label={item.label}
        aria-current={active ? "page" : undefined}
        title={item.label}
        className="group relative flex items-center justify-center w-10 h-10 rounded-[12px] transition-colors"
        style={{
          background: active ? "var(--accent-muted)" : "transparent",
          border: `1px solid ${
            active
              ? "color-mix(in srgb, var(--accent) 36%, transparent)"
              : "transparent"
          }`,
          color: active
            ? "var(--text-bright)"
            : quiet
              ? "var(--text-faint)"
              : "var(--text-tertiary)",
        }}
      >
        {active ? (
          <span
            aria-hidden
            className="absolute -left-3 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full"
            style={{ background: "var(--accent)" }}
          />
        ) : null}
        <Icon
          className={quiet ? "w-4 h-4" : "w-[18px] h-[18px]"}
          strokeWidth={1.75}
        />
      </Link>
    );
  };

  /** One grouped band: its items, tightly packed. */
  const renderGroup = (group: NavGroup, { quiet = false } = {}) => (
    <div key={group.title} className="flex flex-col items-center gap-1">
      {group.items.map((item) => renderLink(item, { quiet }))}
    </div>
  );

  const [toolGroup, playGroup] = MORE_GROUPS;
  const legalGroup = MORE_GROUPS[MORE_GROUPS.length - 1];

  return (
    <nav
      aria-label="Primary"
      className="hidden lg:flex flex-col items-center gap-1 w-16 shrink-0 h-screen sticky top-0 py-4 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{
        borderRight: "1px solid var(--border-default)",
        background: "var(--bg-base)",
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        aria-label="DGDreams — home"
        className="group flex items-center justify-center w-10 h-10 rounded-[12px] mb-3 transition-opacity hover:opacity-80"
      >
        <BrandMark size={26} />
      </Link>

      {/* The daily loop */}
      {PRIMARY_NAV.map((item) => renderLink(item))}

      <RailDivider className="my-2" />

      {/* Tools band */}
      {toolGroup ? renderGroup(toolGroup) : null}

      <RailDivider className="my-2" />

      {/* Collect band */}
      {playGroup ? renderGroup(playGroup) : null}

      <div className="flex-1" />

      {/* Help & legal — quiet reference pages, pinned above the controls */}
      <RailDivider className="my-2" />
      {legalGroup ? renderGroup(legalGroup, { quiet: true }) : null}

      <RailDivider className="my-2" />

      {/* Theme + wallet — the only two controls that live in the chrome */}
      <div className="flex flex-col items-center gap-2">
        <ThemeSwitcher />
        <RailWallet />
      </div>
    </nav>
  );
}
