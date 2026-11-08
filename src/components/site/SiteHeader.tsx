"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount, useDisconnect } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { ArrowUpRight, Menu, Wallet, X } from "lucide-react";

import { BrandLockup } from "@/components/site/Brand";
import ThemeSwitcher from "@/components/ThemeSwitcher";

/**
 * The public header.
 *
 * One 64 px glass bar: brand on the left, destinations in the middle, and the
 * three things a visitor actually needs on the right — theme, wallet, and the
 * way into the app. It is sticky because the landing page is long, and it
 * carries a single accent hairline on its bottom edge so it reads as a brand
 * bar rather than another card.
 */

const LINKS = [
  { href: "/dashboard", label: "Today" },
  { href: "/tasks", label: "Ritual" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/faq", label: "FAQ" },
];

function WalletChip({ block = false }: { block?: boolean }) {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { disconnect } = useDisconnect();
  const connected = !!isConnected && !!address;

  return (
    <button
      type="button"
      onClick={() => (connected ? disconnect() : openConnectModal?.())}
      title={connected ? "Disconnect wallet" : "Connect wallet"}
      className={`inline-flex items-center justify-center gap-2 h-9 rounded-full px-3.5 text-[13px] font-medium transition-colors ${
        block ? "w-full" : ""
      }`}
      style={{
        border: "1px solid var(--border-default)",
        background: connected ? "var(--bg-strong)" : "transparent",
        color: connected ? "var(--text-bright)" : "var(--text-secondary)",
      }}
    >
      {connected && address ? (
        <>
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--accent)" }}
          />
          <span className="font-mono tracking-tight">
            {address.slice(0, 6)}…{address.slice(-4)}
          </span>
        </>
      ) : (
        <>
          <Wallet className="w-[15px] h-[15px]" strokeWidth={1.9} />
          Connect
        </>
      )}
    </button>
  );
}

export default function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Route changes and Escape both dismiss the phone sheet.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-50">
      <div
        className="relative"
        style={{
          background:
            "color-mix(in srgb, var(--bg-base) 82%, transparent)",
          backdropFilter: "blur(14px) saturate(140%)",
          WebkitBackdropFilter: "blur(14px) saturate(140%)",
          borderBottom: "1px solid var(--border-default)",
          boxShadow: scrolled ? "0 10px 30px -18px rgba(0,0,0,0.45)" : "none",
          transition: "box-shadow .25s ease",
        }}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-6">
          <BrandLockup wordmarkClassName="hidden sm:inline" />

          {/* Centre: destinations, optically centred regardless of the two
              side clusters. */}
          <nav
            aria-label="Primary"
            className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 rounded-full p-1 md:flex"
            style={{
              border: "1px solid var(--border-default)",
              background: "color-mix(in srgb, var(--bg-card) 55%, transparent)",
            }}
          >
            {LINKS.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className="rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors"
                  style={{
                    background: active ? "var(--bg-strong)" : "transparent",
                    color: active ? "var(--text-bright)" : "var(--text-secondary)",
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <span className="hidden sm:inline-flex">
              <WalletChip />
            </span>
            <Link
              href="/dashboard"
              className="btn-primary h-9 px-4 text-[13px] sm:h-10 sm:px-5"
            >
              Open app
              <ArrowUpRight className="w-4 h-4" strokeWidth={2.2} />
            </Link>
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-controls="site-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full"
              style={{
                border: "1px solid var(--border-default)",
                color: "var(--text-bright)",
              }}
            >
              {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* The one accent in the chrome. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -bottom-px h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent 8%, color-mix(in srgb, var(--accent) 55%, transparent) 50%, transparent 92%)",
          }}
        />
      </div>

      {open ? (
        <div
          id="site-menu"
          className="md:hidden px-5 pb-5 pt-2"
          style={{
            background: "color-mix(in srgb, var(--bg-base) 94%, transparent)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            borderBottom: "1px solid var(--border-default)",
          }}
        >
          <nav aria-label="Primary (mobile)" className="grid gap-1">
            {LINKS.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className="flex items-center justify-between rounded-xl px-3 py-3 text-[15px] font-medium"
                  style={{
                    background: active ? "var(--bg-strong)" : "transparent",
                    color: active ? "var(--text-bright)" : "var(--text-secondary)",
                  }}
                >
                  {link.label}
                  <ArrowUpRight
                    className="w-4 h-4"
                    style={{ color: "var(--text-tertiary)" }}
                  />
                </Link>
              );
            })}
          </nav>
          <div className="mt-3 grid gap-2">
            <WalletChip block />
          </div>
        </div>
      ) : null}
    </header>
  );
}
