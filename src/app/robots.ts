import type { MetadataRoute } from "next";

/**
 * Keep bulk AI/scraper crawlers off the byte budget (they re-download the
 * whole asset tree without caching) while links keep previewing fine in
 * Slack/Discord and on mobile wallets — their fetchers respect `Disallow`.
 */
const BLOCK_BULK_CRAWLERS = [
  "GPTBot",
  "CCBot",
  "PerplexityBot",
  "Google-Extended",
  "Bytespider",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: BLOCK_BULK_CRAWLERS, disallow: "/" },
      { userAgent: "*", allow: "/", disallow: ["/api/"] },
    ],
    sitemap: "https://dgdreams.space/sitemap.xml",
  };
}
