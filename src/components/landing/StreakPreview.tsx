"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Flame, Trophy } from "lucide-react";

/**
 * Suggestions 2, 3 and 7 — hero streak preview + UTC proof.
 *
 * A preview card for the landing hero. It is NOT live on-chain data:
 * it shows the shape of a day (Check-in / GM / GN, a streak ring, and the
 * 00:00 UTC reset) so a first-time visitor can see the product in one
 * glance. The label says "Preview" and the card links to /dashboard,
 * where the wallet-connected, real state lives.
 *
 * Colours stay inside the existing system: warm paper surfaces, hairline
 * borders, the one lime accent. Badge tier dots are the only extra hues,
 * and they describe the tiers themselves (Bronze → Legend).
 */

const RITUALS = [
  { label: "Check-in", done: true },
  { label: "GM", done: true },
  { label: "GN", done: false },
];

function useTimeToUtcMidnight() {
  const [label, setLabel] = useState("--:--:--");
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setUTCHours(24, 0, 0, 0);
      const ms = Math.max(0, midnight.getTime() - now.getTime());
      const h = Math.floor(ms / 3_600_000);
      const m = Math.floor((ms % 3_600_000) / 60_000);
      const s = Math.floor((ms % 60_000) / 1000);
      const pad = (n: number) => String(n).padStart(2, "0");
      setLabel(`${pad(h)}:${pad(m)}:${pad(s)}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return label;
}

export default function StreakPreview() {
  const countdown = useTimeToUtcMidnight();
  // Preview shape only: 6 of 7 days towards the first (Bronze) badge.
  const done = RITUALS.filter((r) => r.done).length;
  const streakDays = 6;
  const toFirstBadge = 7;
  const ring = 2 * Math.PI * 26;
  const ringOffset = ring * (1 - streakDays / toFirstBadge);

  return (
    <div
      className="surface streak-preview-card w-full max-w-md p-6 text-left"
      aria-label="Streak preview"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="kicker">Today&apos;s ritual · Preview</span>
        <span className="badge badge-live">
          <span className="status-dot status-dot-green" />
          Resets 00:00 UTC
        </span>
      </div>

      <div className="mt-5 flex items-center gap-5">
        <div className="relative shrink-0" aria-hidden>
          <svg width="72" height="72" viewBox="0 0 72 72">
            <circle cx="36" cy="36" r="26" fill="none" stroke="var(--bg-strong)" strokeWidth="6" />
            <circle
              cx="36"
              cy="36"
              r="26"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={ring}
              strokeDashoffset={ringOffset}
              transform="rotate(-90 36 36)"
            />
          </svg>
          <span
            className="absolute inset-0 grid place-items-center text-[20px] font-bold"
            style={{ color: "var(--text-bright)" }}
          >
            {streakDays}d
          </span>
        </div>
        <div>
          <p className="font-bold text-[16px]" style={{ color: "var(--text-bright)" }}>
            <Flame className="mr-1 inline w-4 h-4" strokeWidth={2} />
            6-day streak
          </p>
          <p className="mt-1 text-[14px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            1 more day to your first badge — Bronze, soulbound.
          </p>
          <div className="progress-bar mt-3" aria-hidden>
            <div className="progress-fill" style={{ width: `${(streakDays / toFirstBadge) * 100}%` }} />
          </div>
        </div>
      </div>

      <ul className="mt-5 grid gap-2">
        {RITUALS.map((r) => (
          <li
            key={r.label}
            className="flex items-center justify-between rounded-[12px] px-3 py-2.5 text-[14px] font-medium"
            style={{
              background: "var(--bg-subtle)",
              border: "1px solid var(--border-default)",
              color: r.done ? "var(--text-bright)" : "var(--text-secondary)",
            }}
          >
            <span className="flex items-center gap-2">
              {r.done ? (
                <CheckCircle2 className="w-4 h-4" style={{ color: "var(--success)" }} />
              ) : (
                <Circle className="w-4 h-4" style={{ color: "var(--text-faint)" }} />
              )}
              {r.label}
            </span>
            <span className="font-mono text-[12px]" style={{ color: "var(--text-secondary)" }}>
              {r.done ? "Done" : "To do"}
            </span>
          </li>
        ))}
      </ul>

      <div
        className="mt-5 flex items-center justify-between gap-3 rounded-[12px] px-3 py-2.5 text-[13px]"
        style={{ background: "var(--bg-subtle)", color: "var(--text-secondary)" }}
      >
        <span>
          New day in <span className="font-mono font-semibold" style={{ color: "var(--text-bright)" }}>{countdown}</span>
        </span>
        <span className="font-mono">{done}/3 done</span>
      </div>

      <p className="mt-4 text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        Preview — connect your wallet on the dashboard for your live streak.
      </p>
      <Link href="/dashboard" className="btn-primary mt-3 w-full">
        <Trophy className="w-4 h-4" />
        Open the app
      </Link>
    </div>
  );
}
