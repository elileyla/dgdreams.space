/**
 * Brand asset builder — DGDreams v2 "Orbit-D".
 *
 * One bold D (two round-capped strokes sharing a gradient) plus an orbital
 * spark at the shoulder: the streak (D) and the dream (spark), without the
 * cramped counter of v1. Everything is generated from a single 64-unit
 * geometry so the favicon, the app icon and the OG card cannot drift.
 *
 * At 16 px the spark collapses into a smudge, so that size (and the 16 px
 * favicon frame) uses a simplified D-only drawing.
 *
 * Usage:  node scripts/build-brand-assets.mjs
 */
import sharp from "sharp";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = "public/brand";
mkdirSync(OUT, { recursive: true });

const LIME = "#C6F24E";
const INK = "#12100E";
const PAPER = "#F7F5F2";
const TILE = "#141312";

/* ---------------------------------------------------------------- geometry */

const GRADIENT = `<linearGradient id="dg" x1="12" y1="8" x2="51" y2="57" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#EDFFA8"/>
    <stop offset=".45" stop-color="${LIME}"/>
    <stop offset="1" stop-color="#6FD42F"/>
  </linearGradient>`;

/** Four-point spark with concave sides, centred on (cx, cy). */
const spark = (cx, cy, r) => {
  const k = r * 0.18;
  return `<path fill="url(#dg)" d="M ${cx} ${cy - r} Q ${cx + k} ${cy - k} ${cx + r} ${cy} Q ${cx + k} ${cy + k} ${cx} ${cy + r} Q ${cx - k} ${cy + k} ${cx - r} ${cy} Q ${cx - k} ${cy - k} ${cx} ${cy - r} Z"/>`;
};

/** The mark, drawn in a 64 × 64 box. `paint` is a colour or url(#dg). */
const markBody = (paint, { withSpark = true, weight = 10, x = 18.5, bowl = 49 } = {}) => `
  <path d="M${x} 14 V50" fill="none" stroke="${paint}" stroke-width="${weight}" stroke-linecap="round"/>
  <path d="M${x} 14 C ${bowl} 14 ${bowl} 50 ${x} 50" fill="none" stroke="${paint}" stroke-width="${weight}" stroke-linecap="round"/>
  ${withSpark ? spark(54.5, 12.5, 9.5).replace('url(#dg)', paint) : ""}`;

const markSvg = (paint, opts) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <defs>${GRADIENT}</defs>
  ${markBody(paint, opts)}
</svg>`;

/** Mark sitting in a rounded tile — the app-icon silhouette. */
const tileSvg = (bg, paint, opts, radius = 22) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
  <defs>${GRADIENT}</defs>
  <rect width="96" height="96" rx="${radius}" fill="${bg}"/>
  <g transform="translate(16 16)">${markBody(paint, opts)}</g>
</svg>`;

/* ------------------------------------------------------------------ assets */

const files = {
  "mark.svg": markSvg("url(#dg)"),
  "mark-mono.svg": markSvg(INK),
  "mark-on-accent.svg": markSvg(INK),
  "mark-light.svg": markSvg(PAPER),
  "avatar.svg": tileSvg(TILE, "url(#dg)"),
  "avatar-accent.svg": tileSvg(LIME, INK),
  "avatar-mono.svg": tileSvg(TILE, PAPER),
};
for (const [name, svg] of Object.entries(files)) writeFileSync(join(OUT, name), svg);
writeFileSync("public/logo.svg", files["mark.svg"]);

/* ------------------------------------------------------------- lockups ---- */

// Re-use the v1 wordmark outline (a clean geometric grotesk) so the lockup is
// pure vector and needs no webfont at render time.
const v1 = readFileSync("DGDreams-brand-sheet.html", "utf8");
const wordmark = /translate\(225\.25,174\.00\)"><path fill="#F7F5F2" d="([^"]+)"/.exec(v1)?.[1];
if (!wordmark) throw new Error("wordmark outline not found in brand sheet");

const lockup = (ink) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1030 210" fill="none">
  <defs>${GRADIENT}</defs>
  <g transform="translate(6 24) scale(1.62)">${markBody("url(#dg)")}</g>
  <g transform="translate(196 168) scale(.92)"><path fill="${ink}" d="${wordmark}"/></g>
</svg>`;
writeFileSync(join(OUT, "lockup.svg"), lockup(PAPER));
writeFileSync(join(OUT, "lockup-light.svg"), lockup(INK));

/* --------------------------------------------------------------- raster --- */

const raster = async (svg, size, out) =>
  sharp(Buffer.from(svg)).resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(out);

const small = { withSpark: false, weight: 11, x: 18, bowl: 50 };

await Promise.all([
  raster(markSvg("url(#dg)", small), 16, join(OUT, "mark-16.png")),
  raster(markSvg("url(#dg)"), 32, join(OUT, "mark-32.png")),
  raster(markSvg("url(#dg)"), 64, join(OUT, "mark-64.png")),
  raster(tileSvg(TILE, "url(#dg)"), 180, join(OUT, "apple-touch-icon-180.png")),
  raster(tileSvg(TILE, "url(#dg)"), 512, join(OUT, "avatar-512.png")),
]);

/* ---------------------------------------------------------------- favicon -- */

// ICO with PNG-encoded frames (supported everywhere that matters). The 16 px
// frame drops the spark so the glyph stays legible in a tab strip.
const icoSpec = [
  [16, tileSvg(TILE, "url(#dg)", small, 20)],
  [32, tileSvg(TILE, "url(#dg)")],
  [48, tileSvg(TILE, "url(#dg)")],
  [64, tileSvg(TILE, "url(#dg)")],
];
const frames = await Promise.all(icoSpec.map(([, svg]) => sharp(Buffer.from(svg)).png().toBuffer()));
const framesSized = await Promise.all(
  icoSpec.map(([size], i) => sharp(frames[i]).resize(size, size).png().toBuffer())
);
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(icoSpec.length, 4);
const dir = Buffer.alloc(16 * icoSpec.length);
let offset = 6 + dir.length;
framesSized.forEach((buf, i) => {
  const p = 16 * i;
  dir.writeUInt8(icoSpec[i][0], p);
  dir.writeUInt8(icoSpec[i][0], p + 1);
  dir.writeUInt8(0, p + 2);
  dir.writeUInt8(0, p + 3);
  dir.writeUInt16LE(1, p + 4);
  dir.writeUInt16LE(32, p + 6);
  dir.writeUInt32LE(buf.length, p + 8);
  dir.writeUInt32LE(offset, p + 12);
  offset += buf.length;
});
writeFileSync(join(OUT, "favicon.ico"), Buffer.concat([header, dir, ...framesSized]));

/* ------------------------------------------------------------------- OG --- */

const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    ${GRADIENT}
    <radialGradient id="glow" cx="210" cy="170" r="640" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${LIME}" stop-opacity=".17"/><stop offset="1" stop-color="${LIME}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M48 0H0V48" fill="none" stroke="#FFFFFF" stroke-opacity=".035" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="#0D0C0B"/>
  <rect width="1200" height="630" fill="url(#grid)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <g transform="translate(88 84) scale(2.3)">${markBody("url(#dg)")}</g>
  <g transform="translate(88 300) scale(.62)"><path fill="${PAPER}" d="${wordmark}"/></g>
  <text x="92" y="430" fill="#9A9488" font-family="Segoe UI, Arial, sans-serif" font-size="32" letter-spacing=".2">Your daily on-chain habit</text>
  <g transform="translate(92 492)">
    <rect width="704" height="56" rx="28" fill="#171513" stroke="#2A2724"/>
    <circle cx="30" cy="28" r="6" fill="${LIME}"/>
    <text x="52" y="37" fill="#F7F5F2" font-family="Segoe UI, Arial, sans-serif" font-size="22">23 networks · 3 rituals · one streak</text>
  </g>
  <text x="92" y="596" fill="#79736A" font-family="ui-monospace, Consolas, monospace" font-size="20">dgdreams.space</text>
</svg>`;
await sharp(Buffer.from(og)).png().toFile(join(OUT, "og-1200x630.png"));

/* ---------------------------------------------------------------- banner -- */

const banner = `<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="500" viewBox="0 0 1500 500">
  <defs>${GRADIENT}
    <radialGradient id="bglow" cx="240" cy="250" r="520" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${LIME}" stop-opacity=".18"/><stop offset="1" stop-color="${LIME}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1500" height="500" fill="#0D0C0B"/>
  <rect width="1500" height="500" fill="url(#bglow)"/>
  <g transform="translate(104 132) scale(3.6)">${markBody("url(#dg)")}</g>
  <g transform="translate(420 330) scale(1.05)"><path fill="${PAPER}" d="${wordmark}"/></g>
  <text x="425" y="392" fill="#9A9488" font-family="Segoe UI, Arial, sans-serif" font-size="30">Daily on-chain streak · 23 networks</text>
</svg>`;
await sharp(Buffer.from(banner)).png().toFile(join(OUT, "banner-1500x500.png"));

console.log("brand assets written to", OUT);
