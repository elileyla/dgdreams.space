/**
 * BambooDrop — email subscriptions.
 *
 * Originally backed by Upstash Redis over its REST API. The instance behind
 * those credentials is gone (its hostname no longer resolves — the failure
 * mode the old 500 was hiding), and this site already runs a real Postgres,
 * so subscribers now live in Neon next to everything else:
 *
 *   bamboo_subscribers (email timestamptz)
 *
 * The functions keep the same shape and the same degradation: no DATABASE_URL
 * means the feature reports `configured: false` and the page works anyway.
 */

import { db } from "@/db";
import { sql } from "drizzle-orm";

export const isConfigured = (): boolean => Boolean(process.env.DATABASE_URL);

/**
 * drizzle returns a pg QueryResult for `execute`, but a plain row array with
 * some drivers — accept both.
 */
function rowsOf(result: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(result)) return result as Array<Record<string, unknown>>;
  const rows = (result as { rows?: unknown[] } | null)?.rows;
  return Array.isArray(rows) ? (rows as Array<Record<string, unknown>>) : [];
}

let ready: Promise<void> | null = null;

/** Idempotent; a failed attempt is retried on the next request. */
function ensureTable(): Promise<void> {
  if (!ready) {
    ready = db
      .execute(sql`
        CREATE TABLE IF NOT EXISTS bamboo_subscribers (
          email TEXT PRIMARY KEY,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `)
      .then(() => undefined)
      .catch((error: unknown) => {
        ready = null;
        throw error;
      });
  }
  return ready;
}

/** Returns whether the email was new. */
export async function addEmail(
  email: string
): Promise<{ ok: boolean; configured: boolean; fresh: boolean }> {
  if (!isConfigured()) return { ok: false, configured: false, fresh: false };

  await ensureTable();
  const result = await db.execute(sql`
    INSERT INTO bamboo_subscribers (email)
    VALUES (${email})
    ON CONFLICT (email) DO NOTHING
    RETURNING email
  `);
  return { ok: true, configured: true, fresh: rowsOf(result).length > 0 };
}

export async function count(): Promise<number> {
  if (!isConfigured()) return 0;
  await ensureTable();
  const rows = rowsOf(await db.execute(sql`SELECT COUNT(*) AS n FROM bamboo_subscribers`));
  return Number(rows[0]?.n ?? 0) || 0;
}