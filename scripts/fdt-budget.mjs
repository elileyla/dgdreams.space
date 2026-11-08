/**
 * Fast Data Transfer budget guard for the Hobby plan.
 *
 *   VERCEL_TOKEN=<token> node scripts/fdt-budget.mjs             # report + projection
 *   VERCEL_TOKEN=<token> node scripts/fdt-budget.mjs --fail-at 70
 *   VERCEL_TOKEN=<token> node scripts/fdt-budget.mjs --json
 *
 * The Hobby plan includes 100 GB of Fast Data Transfer per billing cycle and
 * PAUSES the team when it is exceeded (see vercel.com/docs/plans), so the
 * useful question is never "how much so far" but "where will this land?".
 *
 * This reads the same feed the dashboard's Usage page renders —
 *   GET /v2/usage?type=requests&granularity=day
 * whose `bandwidth_outgoing_bytes` per day is edge → visitor traffic (Fast
 * Data Transfer) and `bandwidth_incoming_bytes` is the upload half:
 *
 *   used        outgoing + incoming for the billing cycle
 *   pace        average over the days the feed actually reports data
 *   projection  pace × days in cycle → the number that must stay < cap
 *
 * Exit codes
 *   0  under the guard
 *   1  over --fail-at of the cap, or the projection lands over the cap
 *   2  could not read the meter (no token, API error) — a scheduled run that
 *      cannot see usage must not look like a healthy run
 */
import { pathToFileURL } from "node:url";

const API = "https://api.vercel.com";
const DEFAULT_TEAM_SLUG = "misagh-s-projects1";
const CAP_GB = 100; // Hobby: Fast Data Transfer, included

function parseArgs(argv) {
  const args = { failAt: 80, json: false, cycle: null, cap: CAP_GB };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") args.json = true;
    else if (a === "--fail-at") args.failAt = Number(argv[++i]);
    else if (a === "--cycle") args.cycle = argv[++i]; // YYYY-MM-DD
    else if (a === "--cap") args.cap = Number(argv[++i]);
    else if (a === "--help" || a === "-h") args.help = true;
  }
  return args;
}

const gb = (bytes) => bytes / 1024 ** 3;
const fmt = (n, d = 2) => n.toFixed(d);

/** First day of the current cycle. Hobby has no billing period object, so the
 *  meter resets with the calendar month unless --cycle says otherwise. */
function cycleStart(explicit, team) {
  if (explicit) return new Date(`${explicit}T00:00:00Z`);
  const period = team?.billing?.period?.start;
  if (typeof period === "number" && period > 0) return new Date(period);
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

async function api(path, token) {
  const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} ${path.split("?")[0]} — ${body.slice(0, 160)}`);
  }
  return res.json();
}

/**
 * @returns {Promise<{ok: boolean, lines: string[], data?: object, reason?: string}>}
 */
export async function fdtSummary({ token, teamSlug = DEFAULT_TEAM_SLUG, failAt = 80, cap = CAP_GB, cycle } = {}) {
  if (!token) {
    return { ok: false, code: 2, reason: "VERCEL_TOKEN is not set", lines: ["fdt budget — skipped (no VERCEL_TOKEN)"] };
  }

  try {
    const teams = await api(`/v2/teams`, token);
    const team = (teams.teams ?? []).find((t) => t.slug === teamSlug);
    if (!team) {
      return { ok: false, code: 2, reason: `team "${teamSlug}" not visible to this token`, lines: ["fdt budget — skipped (team not visible)"] };
    }

    const from = cycleStart(cycle, team);
    const to = new Date(Date.now() + 3600_000);
    const qs = `type=requests&granularity=day&from=${from.toISOString()}&to=${to.toISOString()}&teamId=${team.id}`;
    const usage = await api(`/v2/usage?${qs}`, token);

    const rows = (usage.data ?? []).slice().sort((a, b) => a.date.localeCompare(b.date));
    let out = 0;
    let incoming = 0;
    const daily = rows.map((r) => {
      out += r.bandwidth_outgoing_bytes ?? 0;
      incoming += r.bandwidth_incoming_bytes ?? 0;
      return { date: r.date.slice(0, 10), out: r.bandwidth_outgoing_bytes ?? 0, in: r.bandwidth_incoming_bytes ?? 0, hit: r.request_hit_count ?? 0, miss: r.request_miss_count ?? 0 };
    });

    const used = out + incoming;
    const usedGb = gb(used);
    const pct = (usedGb / cap) * 100;

    const observed = Math.max(daily.length, 1);
    const paceGb = usedGb / observed;

    // days in the cycle (month) and days already gone by
    const daysInCycle =
      (Date.UTC(to.getUTCFullYear(), to.getUTCMonth() + 1, 1) - Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1)) / 86400_000;
    const elapsedDays = Math.max((to - from) / 86400_000, 1);
    const remainingDays = Math.max(0, daysInCycle - elapsedDays + 1);

    // projection = what has been spent + the observed pace for the days left.
    // It is the number that must stay under `cap`: a low "used" at the start
    // of the cycle is worthless on its own if the pace says it runs out later.
    const projectedGb = usedGb + paceGb * remainingDays;
    const projectedPct = (projectedGb / cap) * 100;
    const runwayDays = paceGb > 0 ? (cap - usedGb) / paceGb : Infinity;
    const perDayLeft = Math.max(0, cap - usedGb) / Math.max(1, remainingDays);

    const overGuard = pct >= failAt;
    const overProjection = projectedGb >= cap || usedGb >= cap;

    const lines = [];
    lines.push(`Fast Data Transfer — ${fmt(usedGb)} GB of ${cap} GB (${fmt(pct, 1)}%) · cycle from ${from.toISOString().slice(0, 10)}`);
    lines.push(`  source     ${daily.length} day(s) reported by the usage feed · outgoing ${fmt(gb(out))} GB (edge→visitor) + incoming ${fmt(gb(incoming))} GB`);
    if (daily.length) {
      const tail = daily.slice(-7);
      for (const d of tail) {
        lines.push(`    ${d.date}  ${fmt(gb(d.out + d.in), 3)} GB   ${d.hit + d.miss} req (cache ${100 * (d.hit || 0) / Math.max(1, (d.hit || 0) + (d.miss || 0)) | 0}%)`);
      }
      if (daily.length > tail.length) lines.push(`    … ${daily.length - tail.length} earlier day(s)`);
    }
    lines.push(`  pace       ${fmt(paceGb, 3)} GB/day reported · cap runway ${runwayDays === Infinity ? "∞" : fmt(runwayDays, 0)} more day(s) at this pace`);
    const cycleEnd = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 0))
      .toISOString()
      .slice(0, 10);
    lines.push(`  projection ${fmt(projectedGb)} GB by end of cycle ${cycleEnd} (${fmt(projectedPct, 1)}% of cap)`);
    if (!overGuard && !overProjection && perDayLeft > 0) {
      lines.push(`  room       ${fmt(perDayLeft, 2)} GB/day can be spent for the rest of the cycle and still land under ${cap} GB`);
    }

    if (overGuard || overProjection) {
      lines.push(
        `  ✗ OVER GUARD: used ${fmt(pct, 1)}% (limit ${failAt}%) or projection ${fmt(projectedPct, 1)}% — cut bandwidth and investigate before the next deploy`
      );
    } else {
      lines.push(`  ✓ under guard (${fmt(pct, 1)}% used, ${fmt(projectedPct, 1)}% projected at cycle end)`);
    }

    return {
      ok: !(overGuard || overProjection),
      code: overGuard || overProjection ? 1 : 0,
      lines,
      data: { usedGb, pct, paceGb, projectedGb, projectedPct, cap, failAt, daily },
    };
  } catch (e) {
    return {
      ok: false,
      code: 2,
      reason: String(e?.message ?? e),
      lines: [`fdt budget — usage feed unavailable: ${String(e?.message ?? e).slice(0, 200)}`],
    };
  }
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log("usage: VERCEL_TOKEN=… node scripts/fdt-budget.mjs [--fail-at 80] [--cycle YYYY-MM-DD] [--cap GB] [--json]");
    process.exit(0);
  }
  const token = process.env.VERCEL_TOKEN || process.env.VERCEL_ACCESS_TOKEN;
  const res = await fdtSummary({
    token,
    teamSlug: process.env.VERCEL_TEAM_SLUG || DEFAULT_TEAM_SLUG,
    failAt: args.failAt,
    cap: args.cap,
    cycle: args.cycle,
  });

  if (args.json) {
    console.log(JSON.stringify({ ok: res.ok, reason: res.reason, ...(res.data ?? {}) }, null, 2));
  } else {
    for (const line of res.lines) console.log(line);
  }
  process.exit(res.code ?? 1);
}