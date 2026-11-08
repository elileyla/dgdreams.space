import { getData } from "@/lib/bamboo/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 10;

const CACHE = "public, s-maxage=120, stale-while-revalidate=600";

/** Channel feed, newest first. `?limit=` is capped at 50. */
export async function GET(request: Request) {
  const d = await getData();
  const limit = Math.min(
    Number(new URL(request.url).searchParams.get("limit") || 20),
    50
  );
  return Response.json(
    {
      updatedAt: d.updatedAt,
      posts: d.posts.slice(0, limit),
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
