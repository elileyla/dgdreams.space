import { getData } from "@/lib/bamboo/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 10;

const CACHE = "public, s-maxage=120, stale-while-revalidate=600";

/** Channel counters only — the hero strip on /bamboo. */
export async function GET() {
  const d = await getData();
  return Response.json(
    {
      updatedAt: d.updatedAt,
      channel: d.channel,
      group: d.group,
      stats: d.stats,
      stale: d.stale,
    },
    {
      headers: {
        "Cache-Control": CACHE,
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}
