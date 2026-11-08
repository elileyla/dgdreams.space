import { getData } from "@/lib/bamboo/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 10;

const CACHE = "public, s-maxage=120, stale-while-revalidate=600";

/** Airdrop cards + project groups. */
export async function GET() {
  const d = await getData();
  return Response.json(
    {
      updatedAt: d.updatedAt,
      drops: d.drops,
      projects: d.projects,
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
