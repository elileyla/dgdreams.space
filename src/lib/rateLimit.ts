/**
 * In-memory, per-instance rate limiting for the public API routes.
 *
 * Honest limits of this approach (kept small on purpose):
 * - Vercel runs each function in isolated serverless instances, so the
 *   counters are per-instance: a burst spread across instances sees a looser
 *   limit than it would behind a single process.
 * - There is no shared store. A Postgres-backed counter (per-IP sliding
 *   window) is the proper fix and is deliberately deferred until the API
 *   traffic justifies it.
 *
 * What is fixed here:
 * - The IP is taken from the LAST entry of X-Forwarded-For, not the first.
 *   Vercel appends the real peer IP to the end of the chain, so the client
 *   can only prepend spoofed values — they no longer win.
 * - The bucket map is purged lazily, so idle instances do not accumulate
 *   entries forever.
 */

const buckets = new Map<string, number[]>();

// A bucket is dead once its newest hit is older than this. All current
// callers use 60-second windows; 10 minutes is a wide safety margin.
const BUCKET_TTL_MS = 10 * 60_000;
// Purge at most once every 5 minutes.
const SWEEP_INTERVAL_MS = 5 * 60_000;

let lastSweep = 0;

function sweep(now: number): void {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, times] of buckets) {
    // `times` is kept sorted ascending, so the last hit decides.
    const last = times[times.length - 1];
    if (last === undefined || now - last >= BUCKET_TTL_MS) buckets.delete(key);
  }
}

export function rateLimit(
  key: string,
  limit = 30,
  windowMs = 60_000
): boolean {
  const now = Date.now();
  sweep(now);
  const prev = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (prev.length >= limit) {
    buckets.set(key, prev);
    return false;
  }
  prev.push(now);
  buckets.set(key, prev);
  return true;
}

/**
 * Best-effort client IP for Vercel: the last entry of X-Forwarded-For is the
 * one Vercel appended from the real connection, the first is settable by the
 * client. x-real-ip is a fallback, then an uninformative constant.
 */
export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) {
    const entries = fwd.split(",").map((s) => s.trim()).filter(Boolean);
    if (entries.length > 0) return entries[entries.length - 1];
  }
  return request.headers.get("x-real-ip") || "unknown";
}
