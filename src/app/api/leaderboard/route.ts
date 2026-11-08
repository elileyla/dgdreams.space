import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { litevmStats, walletStreaks } from "@/db/schema";
import { desc, count, sum, avg, eq } from "drizzle-orm";
import { ensureTables } from "@/lib/init-db";

const LITVM_NETWORK = "LITVM Liteforge";
const ALL_NETWORKS = "All Networks";

export type LeaderboardCategory = "streak" | "litevm";

export interface LeaderboardEntry {
  rank: number;
  walletAddress: string;
  value: number;
  secondary: string;
  network: string;
}

export interface LeaderboardStats {
  totalPlayers: number;
  totalValue: number;
  avgValue: number;
}

export async function GET(request: NextRequest) {
  await ensureTables();
  const { searchParams } = new URL(request.url);
  const rawCategory = searchParams.get("category") || "litevm";
  const category: LeaderboardCategory =
    rawCategory === "streak" || rawCategory === "litevm"
      ? rawCategory
      : "litevm";
  const chain = searchParams.get("chain") || "all";
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50", 10) || 50, 1), 100);

  // "All Networks" (the page's default) is the same as "all" — no filtering.
  const filter = chain.toLowerCase();
  const isAll = filter === "all" || filter === "all networks";

  try {
    let rows: Omit<LeaderboardEntry, "rank">[] = [];
    let stats: LeaderboardStats = { totalPlayers: 0, totalValue: 0, avgValue: 0 };

    if (category === "streak") {
      // Read from wallet_streaks, which only ever holds values the server read
      // off NikBase for a wallet that signed in. The old litevm_stats.streak
      // column was client-reported and could be inflated by a crafted request.
      //
      // There is one row per wallet, but a database written before that change
      // can still hold several, so the best row per address is picked here
      // rather than showing the same wallet more than once.
      const rowsByWallet = await db
        .select()
        .from(walletStreaks)
        .orderBy(desc(walletStreaks.streak))
        .limit(500);

      const best = new Map<string, (typeof rowsByWallet)[number]>();
      for (const s of rowsByWallet) {
        const key = s.walletAddress.toLowerCase();
        const current = best.get(key);
        if (!current || (s.streak ?? 0) > (current.streak ?? 0)) best.set(key, s);
      }

      // The page filters by network *name*, so compare names, not chain ids.
      const matching = isAll
        ? [...best.values()]
        : [...best.values()].filter(
            (s) => (s.chainName || "").toLowerCase() === filter
          );

      rows = matching.map((s) => ({
        walletAddress: s.walletAddress,
        value: s.streak ?? 0,
        secondary: `${s.totalActions ?? 0} actions · ${s.totalCheckIns ?? 0} check-ins`,
        network: s.chainName || ALL_NETWORKS,
      }));

      const totalValue = rows.reduce((acc, m) => acc + m.value, 0);
      stats = {
        totalPlayers: rows.length,
        totalValue,
        avgValue: rows.length > 0 ? totalValue / rows.length : 0,
      };
    } else {
      const where = isAll ? undefined : eq(litevmStats.chain, chain);
      const [data, agg] = await Promise.all([
        db.select().from(litevmStats).orderBy(desc(litevmStats.totalPoints)).limit(limit),
        db
          .select({
            totalPlayers: count(),
            totalValue: sum(litevmStats.totalPoints),
            avgValue: avg(litevmStats.totalPoints),
          })
          .from(litevmStats)
          .where(where),
      ]);
      rows = data.map((s) => ({
        walletAddress: s.walletAddress,
        value: s.totalPoints ?? 0,
        secondary: `${s.playCount ?? 0} games · hs ${s.highScore ?? 0}`,
        network: s.chain || LITVM_NETWORK,
      }));
      stats = {
        totalPlayers: agg[0]?.totalPlayers ?? 0,
        totalValue: Number(agg[0]?.totalValue ?? 0),
        avgValue: Number(agg[0]?.avgValue ?? 0),
      };
    }

    // streak/litevm rows are already chain-filtered by the SQL where clause.
    const entries: LeaderboardEntry[] = rows
      .sort((a, b) => b.value - a.value)
      .slice(0, limit)
      .map((r, i) => ({ ...r, rank: i + 1 }));

    return NextResponse.json({ category, chain, stats, entries });
  } catch (e) {
    console.error("GET /api/leaderboard error:", e);
    return NextResponse.json({
      category,
      chain,
      stats: { totalPlayers: 0, totalValue: 0, avgValue: 0 },
      entries: [],
    });
  }
}
