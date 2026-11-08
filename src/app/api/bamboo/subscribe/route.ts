import { addEmail, count, isConfigured } from "@/lib/bamboo/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 10;

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"\s]+\.[^\s@<>()[\]\\,;:"\s]{2,}$/;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

/** Subscriber count, for the badge under the form. */
export async function GET() {
  return Response.json(
    { count: await count(), configured: isConfigured() },
    { headers: { ...CORS, "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  let email = "";
  try {
    const body = (await request.json()) as { email?: unknown } | null;
    email = String(body?.email ?? "").trim().toLowerCase();
  } catch {
    return Response.json({ error: "bad_json" }, { status: 400, headers: CORS });
  }

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return Response.json({ error: "invalid_email" }, { status: 400, headers: CORS });
  }

  try {
    const r = await addEmail(email);
    if (!r.configured) {
      // Redis is optional; the page still works without it.
      return Response.json({ error: "not_configured" }, { status: 503, headers: CORS });
    }
    return Response.json(
      { ok: true, fresh: r.fresh, count: await count() },
      { headers: { ...CORS, "Cache-Control": "no-store" } }
    );
  } catch {
    return Response.json({ error: "store_failed" }, { status: 500, headers: CORS });
  }
}
