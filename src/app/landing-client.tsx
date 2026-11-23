"use client";

import Link from "next/link";
import Image from "next/image";
import { m, useReducedMotion } from "framer-motion";
import SiteHeader from "@/components/site/SiteHeader";
import { NETWORK_COUNT } from "@/config/chains";
import StreakPreview from "@/components/landing/StreakPreview";
import {
  Globe,
  Flame,
  ArrowRight,
  CheckCircle2,
  Rocket,
  Trophy,
  Wallet,
} from "lucide-react";

/* -------------------------------------------------------------
   Landing: hero, the numbers, what it does, how it works, the
   networks it runs on, and a closing call to action.

   The tone is the same as the app: warm paper, one lime accent,
   and nothing moving that does not need to move.
   ------------------------------------------------------------- */

const features = [
  {
    icon: Globe,
    title: `${NETWORK_COUNT} networks, one place`,
    desc: "Run the same daily rituals on Ethereum, Base, Arbitrum, BNB Chain, GenLayer and more without switching apps.",
    span: "",
  },
  {
    icon: Flame,
    title: "Streaks that pay off",
    desc: "Keep a daily streak. Finish all three missions in a day to mint a soulbound badge — Bronze from day one — that climbs to Legend as the streak grows.",
    span: "",
  },
  {
    icon: Rocket,
    title: "6-in-1 runner",
    desc: "Check-in, GM and GN plus three deploys in one click — about 69% less gas than running them separately.",
    span: "",
  },
];

const badgeTiers = [
  { name: "Bronze", note: "Day 1 — first full day", dot: "#b07845", active: true },
  { name: "Silver", note: "7-day streak", dot: "#9aa3ad", active: false },
  { name: "Gold", note: "30-day streak", dot: "#d4a017", active: false },
  { name: "Diamond", note: "100-day streak", dot: "#7fb3e0", active: false },
  { name: "Legend", note: "365-day streak", dot: "#c6f24e", active: false },
];

const steps = [
  {
    icon: Wallet,
    title: "Connect",
    desc: "Link your wallet once. No sign-up, no email.",
  },
  {
    icon: CheckCircle2,
    title: "Check in",
    desc: "Run Check in, GM and GN on any supported network.",
  },
  {
    icon: Trophy,
    title: "Keep it up",
    desc: "Build your streak, mint your badge, climb the leaderboard.",
  },
];

// Suggestion 4 — the full 21 networks from src/config/chains.ts
// (15 mainnet + 6 testnet), with each chain's real colour from its
// NetworkConfig. "Cheapest" is per README: Arbitrum and OP are the
// cheapest networks here, a full 6-in-1 run costs well under a cent.
const networks = [
  { name: "Ethereum", logo: "/logos/ethereum.png", color: "var(--text-tertiary)", type: "Mainnet", cheapest: false },
  { name: "Base", logo: "/logos/base.svg", color: "#0052FF", type: "Mainnet", cheapest: false },
  { name: "Arbitrum", logo: "/logos/arbitrum.png", color: "#12AAFF", type: "Mainnet", cheapest: true },
  { name: "OP Mainnet", logo: "/logos/optimism.png", color: "#FF0420", type: "Mainnet", cheapest: true },
  { name: "HyperEVM", logo: "/logos/hyperliquid.png", color: "var(--danger)", type: "Mainnet", cheapest: false },
  { name: "BNB Chain", logo: "/logos/bnb.svg", color: "#F0B90B", type: "Mainnet", cheapest: false },
  { name: "opBNB", logo: "/logos/opbnb.svg", color: "#00B2A9", type: "Mainnet", cheapest: false },
  { name: "Unichain", logo: "/logos/unichain.png", color: "#FC6C85", type: "Mainnet", cheapest: false },
  { name: "Arc", logo: "/logos/arc.png", color: "var(--accent-text)", type: "Mainnet", cheapest: false },
  { name: "GenLayer", logo: "/logos/genlayer.svg", color: "var(--accent-text)", type: "Testnet", cheapest: false },
  { name: "Tempo", logo: "/logos/tempo.png", color: "var(--accent-text)", type: "Mainnet", cheapest: false },
  { name: "Robinhood", logo: "/logos/robinhood.png", color: "#00C805", type: "Mainnet", cheapest: false },
  { name: "Ink", logo: "/logos/ink.svg", color: "#0052FF", type: "Mainnet", cheapest: false },
  { name: "Soneium", logo: "/logos/soneium.svg", color: "#1B2CFF", type: "Mainnet", cheapest: false },
  { name: "XRP EVM", logo: "/logos/xrplevm.png", color: "#23292F", type: "Mainnet", cheapest: false },
  { name: "Elysium", logo: "/logos/elysium.svg", color: "#2B8FB6", type: "Mainnet", cheapest: false },
  { name: "Maroo", logo: "/logos/maroo.png", color: "#0096AA", type: "Testnet", cheapest: false },
  { name: "DogeOS", logo: "/logos/dogeos.svg", color: "#E1B000", type: "Testnet", cheapest: false },
  { name: "GIWA Sepolia", logo: "/logos/giwa.png", color: "var(--danger)", type: "Testnet", cheapest: false },
  { name: "LitVM", logo: "/logos/litvm.png", color: "var(--accent-text)", type: "Testnet", cheapest: false },
  { name: "SimpleChain", logo: "/logos/simplechain.png", color: "#FF8C00", type: "Testnet", cheapest: false },
];

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function LandingPage() {
  const reduced = useReducedMotion();

  return (
    <div
      className="min-h-screen relative overflow-x-clip"
      style={{ background: "var(--bg-base)" }}
    >
      <SiteHeader />

      {/* Hero — Suggestion 2: two columns on desktop, copy left, live
          streak preview right, instead of centred text only. */}
      <section className="relative z-10 px-6 pt-16 sm:pt-24 pb-16">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
        <m.div {...fadeUp} transition={{ duration: 0.5 }}>
          <span
            className="inline-flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full text-[14px] font-medium"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-default)",
              color: "var(--text-secondary)",
            }}
          >
            <span
              className="inline-flex items-center justify-center w-5 h-5 rounded-full"
              style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-contrast)]" />
            </span>
            A minute a day, on chain
          </span>
        </m.div>

        <m.h1
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.06 }}
          className="mt-7 mb-6 text-[clamp(2.5rem,8vw,4.5rem)] font-bold leading-[1.04] tracking-[-0.04em]"
          style={{ color: "var(--text-bright)" }}
        >
          Your daily
          <br />
          <span className="mark">on-chain habit</span>
        </m.h1>

        <m.p
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="text-[16px] sm:text-[20px] max-w-2xl mb-9 leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          Connect once. Check in, say GM and GN across 21 networks, keep a
          streak and unlock soulbound badges.
        </m.p>

        <m.div
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.18 }}
          className="flex flex-col sm:flex-row items-center gap-3"
        >
          <Link href="/dashboard" className="btn-primary w-full sm:w-auto">
            Start your streak
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a href="#how" className="btn-ghost w-full sm:w-auto">
            How it works
          </a>
          <a href="#networks" className="btn-ghost w-full sm:w-auto">
            View networks
          </a>
        </m.div>

        {/* The numbers */}
        <m.div
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.24 }}
          className="grid grid-cols-3 gap-3 sm:gap-4 w-full max-w-lg mt-14"
        >
          {[
            { value: String(NETWORK_COUNT), label: "Networks" },
            { value: "3", label: "Daily rituals" },
            { value: "1d", label: "To first badge" },
          ].map((s) => (
            <div key={s.label} className="surface text-center py-4 px-2">
              <div
                className="text-[20px] sm:text-[32px] font-bold leading-none"
                style={{ color: "var(--text-bright)" }}
              >
                {s.value}
              </div>
              <div className="kicker mt-2">{s.label}</div>
            </div>
          ))}
        </m.div>
          </div>
          <m.div
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.24 }}
            className="flex justify-center lg:justify-end"
          >
            <StreakPreview />
          </m.div>
        </div>
      </section>

      {/* The networks — Suggestion 4: an informative grid, not a static
          strip. Real chain colour, Mainnet/Testnet, cheapest highlighted. */}
      <section id="networks" className="relative z-10 py-14 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="kicker text-center mb-2">Runs on</p>
          <h2
            className="text-center text-[20px] sm:text-[32px] font-bold mb-3"
            style={{ color: "var(--text-bright)" }}
          >
            {NETWORK_COUNT} networks, one wallet
          </h2>
          <p className="text-center text-[14px] mb-8" style={{ color: "var(--text-secondary)" }}>
            Arbitrum and OP are the cheapest — a full 6-in-1 run costs well
            under a cent, so they are the best place to start.
          </p>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {networks.map((n) => (
              <li
                key={n.name}
                className="surface flex items-center gap-2 px-3 py-2.5 text-[14px] font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: n.color }}
                  aria-hidden
                />
                <Image
                  src={n.logo}
                  alt=""
                  width={16}
                  height={16}
                  // Both dimensions pinned so a non-square intrinsic ratio
                  // (GenLayer's viewBox is 97.76 x 91.93) can never trip
                  // next/image's "width or height modified" layout warning.
                  style={{ objectFit: "contain", width: "16px", height: "16px" }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                {n.name}
                <span className="ml-auto shrink-0 text-[11px]" style={{ color: "var(--text-faint)" }}>
                  {n.cheapest ? "Cheapest" : n.type}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* What it does */}
      <section className="relative z-10 py-14 px-6">
        <div className="max-w-5xl mx-auto">
          <m.div {...fadeUp} transition={{ duration: 0.5 }} className="text-center mb-12">
            <p className="kicker mb-3">What it does</p>
            <h2
              className="text-[20px] sm:text-[32px] font-bold mb-3"
              style={{ color: "var(--text-bright)" }}
            >
              Everything in one place
            </h2>
            <p className="text-[16px]" style={{ color: "var(--text-secondary)" }}>
              A daily routine that is quick to finish and easy to keep.
            </p>
          </m.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <m.div
                  key={f.title}
                  initial={reduced ? undefined : { opacity: 0, y: 16 }}
                  whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.45, delay: i * 0.05 }}
                  className={`surface p-6 ${f.span}`}
                >
                  <span
                    className="inline-flex items-center justify-center w-10 h-10 rounded-[12px] mb-5"
                    style={{
                      background: "var(--bg-subtle)",
                      border: "1px solid var(--border-default)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <Icon className="w-5 h-5" strokeWidth={1.75} />
                  </span>
                  <h3
                    className="font-bold text-[16px] mb-2"
                    style={{ color: "var(--text-bright)" }}
                  >
                    {f.title}
                  </h3>
                  <p
                    className="text-[14px] leading-relaxed"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {f.desc}
                  </p>
                </m.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Badge ladder — Suggestion 3: Bronze to Legend, in order.
          Thresholds are the contract's (contracts/SoulboundStreak.sol
          _tierFor): Bronze from a 1-day streak, Silver 7, Gold 30,
          Diamond 100, Legend 365. Mint needs all three missions done
          on the day. */}
      <section className="relative z-10 py-14 px-6" aria-label="Badge ladder">
        <div className="max-w-5xl mx-auto">
          <m.div {...fadeUp} transition={{ duration: 0.5 }} className="text-center mb-8">
            <p className="kicker mb-3">Soulbound badges</p>
            <h2
              className="text-[20px] sm:text-[32px] font-bold mb-3"
              style={{ color: "var(--text-bright)" }}
            >
              Bronze to Legend
            </h2>
            <p className="text-[16px]" style={{ color: "var(--text-secondary)" }}>
              One full day mints Bronze. Keep the streak and climb — Silver
              at 7 days, Gold at 30, Diamond at 100, Legend at 365. Badges are
              soulbound, so they stay with your wallet.
            </p>
          </m.div>
          <ol className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-4">
            {badgeTiers.map((b) => (
              <li key={b.name} className="surface p-4 text-center">
                <span
                  className="badge-tier-dot"
                  data-active={b.active}
                  style={{ background: b.dot }}
                  aria-hidden
                />
                <span className="block font-bold text-[14px]" style={{ color: "var(--text-bright)" }}>
                  {b.name}
                </span>
                <span className="mt-1 block text-[12px]" style={{ color: "var(--text-tertiary)" }}>
                  {b.note}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative z-10 py-14 px-6">
        <div className="max-w-4xl mx-auto">
          <m.div {...fadeUp} transition={{ duration: 0.5 }} className="text-center mb-12">
            <p className="kicker mb-3">How it works</p>
            <h2
              className="text-[20px] sm:text-[32px] font-bold"
              style={{ color: "var(--text-bright)" }}
            >
              Three steps, every day
            </h2>
          </m.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <m.div
                  key={s.title}
                  initial={reduced ? undefined : { opacity: 0, y: 16 }}
                  whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.45, delay: i * 0.08 }}
                  className="surface p-6 text-left"
                >
                  <div className="flex items-center justify-between mb-5">
                    <span
                      className="inline-flex items-center justify-center w-10 h-10 rounded-[12px]"
                      style={{
                        background: "var(--bg-subtle)",
                        border: "1px solid var(--border-default)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      <Icon className="w-5 h-5" strokeWidth={1.75} />
                    </span>
                    <span className="kicker">0{i + 1}</span>
                  </div>
                  <h3
                    className="font-bold text-[16px] mb-1.5"
                    style={{ color: "var(--text-bright)" }}
                  >
                    {s.title}
                  </h3>
                  <p
                    className="text-[14px] leading-relaxed"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {s.desc}
                  </p>
                </m.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-16 px-6">
        <m.div
          initial={reduced ? undefined : { opacity: 0, y: 16 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="max-w-3xl mx-auto text-center surface rounded-[24px] p-10 sm:p-14"
        >
          <h2
            className="text-[20px] sm:text-[32px] font-bold mb-4"
            style={{ color: "var(--text-bright)" }}
          >
            Ready to start your streak?
          </h2>
          <p className="text-[16px] mb-8" style={{ color: "var(--text-secondary)" }}>
            Connect your wallet and finish today&apos;s rituals in under a minute.
          </p>
          <Link href="/dashboard" className="btn-primary">
            Open the app
            <ArrowRight className="w-4 h-4" />
          </Link>
        </m.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-6">
        <div
          className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 pt-6"
          style={{ borderTop: "1px solid var(--border-default)" }}
        >
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="DGDreams" width={20} height={20} />
            <span className="text-[12px]" style={{ color: "var(--text-tertiary)" }}>
              DGDreams
            </span>
          </div>
          <div
            className="flex items-center gap-4 text-[12px]"
            style={{ color: "var(--text-tertiary)" }}
          >
            <Link href="/terms" className="hover:text-[var(--text-secondary)] transition-colors">
              Terms
            </Link>
            <Link href="/license" className="hover:text-[var(--text-secondary)] transition-colors">
              License
            </Link>
            <Link href="/faq" className="hover:text-[var(--text-secondary)] transition-colors">
              FAQ
            </Link>
            <a
              href="https://github.com/Misagh95/dgdreams"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--text-secondary)] transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
