/**
 * BambooDrop — email subscriptions.
 *
 * Upstash Redis over its REST API, no npm package. Credentials come from the
 * Vercel environment (never the repo):
 *
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 *
 * When they are absent the feature degrades to a no-op instead of throwing,
 * and /api/bamboo/subscribe reports `configured: false`.
 */

const URL = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export const isConfigured = (): boolean => Boolean(URL && TOKEN);

async function cmd(...args: Array<string | number>): Promise<unknown> {
  const res = await fetch(`${URL}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
    signal: AbortSignal.timeout(6000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Upstash ${res.status}: ${await res.text()}`);
  return (await res.json()).result;
}

const keyOf = (email: string) => "bd:sub:" + email;

/** One set holds every subscriber; each email also has its own hash. */
const hashKey = () => "bd:subs:list";

/** Add an email. `fresh` is true only when it was not already stored. */
export async function addEmail(
  email: string
): Promise<{ ok: boolean; configured: boolean; fresh: boolean }> {
  if (!isConfigured()) return { ok: false, configured: false, fresh: false };

  const h = keyOf(email);
  const added = await cmd("SADD", hashKey(), h);
  if (Number(added) === 0) return { ok: true, configured: true, fresh: false };

  await cmd("HSET", h, "email", email, "at", new Date().toISOString());
  await cmd("EXPIRE", h, 60 * 60 * 24 * 365 * 2);
  return { ok: true, configured: true, fresh: true };
}

export async function count(): Promise<number> {
  if (!isConfigured()) return 0;
  return Number(await cmd("SCARD", hashKey())) || 0;
}
