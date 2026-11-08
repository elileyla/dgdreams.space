/**
 * Post-deploy health check for dgdreams.space — run it whenever you want to
 * answer "which Vercel project/account is answering, and is it the right one?"
 *
 *   node scripts/verify-deploy.mjs                     # check https://dgdreams.space
 *   node scripts/verify-deploy.mjs https://staging-abc.vercel.app   # check a preview
 *
 * Checks, per route:
 *   /                     200 HTML, contains DGDreams
 *   /gallery              200 HTML, contains the daily-priced mint copy
 *   /api/health           200 JSON
 *   /api/badge?chain=8453 200 JSON, Base badge name, fresh 24h cache headers
 *   /output-premium/*.png 200, compressed (~180KB, not the old 1.3MB), 1y immutable
 *   /robots.txt           200, bulk-crawler blocks present
 *   fdt budget            Fast Data Transfer against the 100 GB Hobby cap
 *                          (run only when VERCEL_TOKEN is set; fails when the
 *                          meter is past the guard or the month projects past
 *                          the cap — Hobby pauses the team at 100 GB)
 *   dns resolve4          domain still resolves to the Vercel anycast IP
 * plus x-vercel-deployment-url printed at the end — that URL ties an answer
 * to a specific Vercel team ("which account is serving") without guessing.
 */
import { resolve4 } from "node:dns/promises";

const base = process.argv[2]?.replace(/\/+$/, "") || "https://dgdreams.space";
const VERCEL_ANYCAST = ["76.76.21.21", "216.198.79.1", "64.29.17.1", "216.198.79.67"];

let pass = 0;
let fail = 0;

function ok(name, detail = "") {
  pass++;
  console.log(`  ✓ ${name}${detail ? ` — ${detail}` : ""}`);
}
function bad(name, detail = "") {
  fail++;
  console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
}

/** fetch + minimal sanity, returns a small record */
async function probe(path, opts = {}) {
  const res = await fetch(`${base}${path}`, { redirect: "manual", ...opts });
  const body = await res.text();
  return { res, body };
}

const results = [];
for (const [path, expect] of [
  ["/", "DGDreams"],
  ["/gallery", "One free mint per wallet"],
  ["/robots.txt", "GPTBot"],
]) {
  try {
    const { res, body } = await probe(path);
    const hit = body.includes(expect);
    if (res.status === 200 && hit) ok(path);
    else bad(path, `status ${res.status}${hit ? "" : ` (missing "${expect}")`}`);
    results.push(path);
  } catch (e) {
    bad(path, String(e).split("\n")[0]);
  }
}

// /api/health: platform probes matter for uptime monitors
try {
  const { res } = await probe("/api/health");
  res.ok ? ok("/api/health") : bad("/api/health", `status ${res.status}`);
} catch (e) {
  bad("/api/health", String(e).split("\n")[0]);
}

// badge metadata: the NFT pricing rewrite lives here — chain + ttl headers
try {
  const { res, body } = await probe("/api/badge?chain=8453&id=1");
  const meta = JSON.parse(body);
  const cc = res.headers.get("cache-control") ?? "";
  if (res.ok && meta.name?.includes("Base Badge") && cc.includes("max-age=86400")) {
    ok("/api/badge?chain=8453", `"${meta.name}" · ${cc}`);
  } else {
    bad("/api/badge?chain=8453", `name="${meta.name}" · cache="${cc}"`);
  }
} catch (e) {
  bad("/api/badge?chain=8453", String(e).split("\n")[0]);
}

// badge artwork: small (quantized) + pinned at the edge, or the transfer bill grows back
try {
  const { res } = await probe("/output-premium/ethereum.png");
  const cc = res.headers.get("cache-control") ?? "";
  const kb = Math.round(Number(res.headers.get("content-length") ?? 0) / 1024);
  if (res.ok && cc.includes("max-age=31536000") && kb > 50 && kb < 300) {
    ok("/output-premium/ethereum.png", `${kb}KB · ${cc.split(";")[0].trim()}`);
  } else {
    bad(
      "/output-premium/ethereum.png",
      `${kb}KB (expect 50..300 — >1000KB means old PNGs still deployed) · cache="${cc}"`
    );
  }
} catch (e) {
  bad("/output-premium/ethereum.png", String(e).split("\n")[0]);
}

// Fast Data Transfer budget: the Hobby plan includes 100 GB/cycle and pauses
// the team when it is crossed, so every deploy check reports where the meter
// sits. Uses the same endpoint the dashboard's Usage page renders.
if (!process.env.VERCEL_TOKEN) {
  console.log("  · fdt budget   skipped (set VERCEL_TOKEN to check the 100 GB meter)");
} else {
  try {
    const { fdtSummary } = await import("./fdt-budget.mjs");
    const fdt = await fdtSummary({ token: process.env.VERCEL_TOKEN });
    for (const line of fdt.lines.slice(-4)) console.log(`      ${line}`);
    if (fdt.ok) {
      ok("fdt budget", `${fdt.data.pct.toFixed(1)}% used · ${fdt.data.projectedPct.toFixed(1)}% projected`);
    } else {
      bad(
        "fdt budget",
        fdt.data
          ? `OVER GUARD — ${fdt.data.pct.toFixed(1)}% used, ${fdt.data.projectedPct.toFixed(1)}% projected`
          : fdt.reason
      );
    }
  } catch (e) {
    bad("fdt budget", String(e).split("\n")[0]);
  }
}

// dns: name still on the Vercel anycast address
try {
  const ips = await resolve4(new URL(base).hostname);
  if (ips.some((ip) => VERCEL_ANYCAST.includes(ip))) {
    ok("dns", `${new URL(base).hostname} → ${ips.join(", ")}`);
    results.push(ips.join(" "));
  } else {
    bad("dns", `resolves to ${ips.join(", ")} — neither Vercel anycast IP`);
  }
} catch (e) {
  bad("dns", String(e).split("\n")[0]);
}

// which team is answering — print, don't assert
try {
  const { res } = await probe("/");
  const dep = res.headers.get("x-vercel-deployment-url") ?? "(none)";
  const id = res.headers.get("x-vercel-id") ?? "(none)";
  console.log(`\nServed by deployment: ${dep}`);
  console.log(`x-vercel-id:          ${id}`);
  results.push(dep.indexOf(".vercel.app", dep.length - 11) > -1 ? dep : "(no identifier)");
  console.log(
    "\nCompare that deployment URL between the old and the new account: a\nchange here is your proof the switch actually happened."
  );
} catch {
  /* probed already */
}

console.log(`\n${pass} passed, ${fail} failed — ${base}`);
process.exitCode = fail > 0 ? 1 : 0;
