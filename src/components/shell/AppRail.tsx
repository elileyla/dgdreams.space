"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount, useDisconnect } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Wallet } from "lucide-react";

import { MORE_NAV, PRIMARY_NAV, type NavItem } from "@/lib/nav";
import { BrandMark } from "@/components/site/Brand";
import ThemeSwitcher from "@/components/ThemeSwitcher";

/**
 * AppRail — the 64px icon rail on the left.
 *
 * The whole menu, directly in the rail: the daily loop (Today / Ritual /
 * Ranks), a divider, then everything else. Icons only, with the label as a
 * tooltip, so the rail never becomes a second navigation bar and nothing
 * hides behind a "More" sheet.
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

export default function AppRail() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  // One rail link. Icons only, with the label as a tooltip, so the rail holds
  // the entire menu at a constant 64px.
  const renderLink = (item: NavItem) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-label={item.label}
        aria-current={active ? "page" : undefined}
        title={item.label}
        className="flex items-center justify-center w-10 h-10 rounded-[12px] transition-colors"
        style={{
          background: active ? "var(--accent-muted)" : "transparent",
          border: `1px solid ${
            active
              ? "color-mix(in srgb, var(--accent) 36%, transparent)"
              : "transparent"
          }`,
          color: active ? "var(--text-bright)" : "var(--text-tertiary)",
        }}
      >
        <Icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
      </Link>
    );
  };

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

      {/* Primary destinations — the daily loop */}
      {PRIMARY_NAV.map(renderLink)}

      {/* Divider — the daily loop above, the rest of the menu below */}
      <span
        aria-hidden
        className="my-2 h-px w-8 shrink-0"
        style={{ background: "var(--border-default)" }}
      />

      {/* The rest of the menu, directly in the rail (no "More" sheet) */}
      {MORE_NAV.map(renderLink)}

      <div className="flex-1" />

      {/* Theme + wallet — the only two controls that live in the chrome */}
      <div className="flex flex-col items-center gap-2">
        <ThemeSwitcher />
        <RailWallet />
      </div>
    </nav>
  );
}
