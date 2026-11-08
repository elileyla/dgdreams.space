/**
 * BambooDrop — the shared core.
 *
 * Ported from the standalone `bambo` project (D:\bambo\lib\telegram.js) so the
 * /bamboo page can live on this domain without a second deployment. No external
 * packages: the public Telegram channel HTML is the only data source.
 *
 * One addition over the original: a 60-second in-memory cache. The five route
 * handlers all read the same snapshot, and a warm lambda should not scrape the
 * archive again for every request. The CDN header (s-maxage) still does the
 * heavier lifting.
 */

export const CHANNEL = process.env.CHANNEL || "Bamboodrop";
export const GROUP = process.env.GROUP || "Bamboodropgroup";
export const CACHE_TTL = 60 * 1000;

/**
 * How many archive pages to read (each page is ~20 posts and they are fetched
 * in parallel batches). Six is enough for the feed and keeps the worst case
 * well inside the function timeout; override with PAGES.
 */
export const PAGES = Math.min(Number(process.env.PAGES || 6), 80);

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export interface BambooPost {
  id: string;
  post: string;
  url: string;
  text: string;
  links: string[];
  tags: string[];
  date: string | null;
  views: string | null;
  isAirdrop: boolean;
  score: number;
}

export interface BambooProject {
  tag: string;
  slug: string;
  status: string;
  posts: Array<{
    id: string;
    text: string;
    url: string;
    links: string[];
    date: string | null;
    views: string | null;
    isAirdrop: boolean;
  }>;
  drops: number;
  count: number;
  latest: string | null;
  link: string;
  title: string;
}

export interface BambooDropCard {
  id: string;
  title: string;
  desc: string;
  network: string;
  link: string;
  channelUrl: string;
  date: string | null;
  views: string | null;
  status: string;
  tag: string;
}

export interface BambooData {
  updatedAt: string;
  channel: string;
  group: string;
  pages?: number;
  stats: { subscribers: number; members: number; online: number; posts: number };
  posts: BambooPost[];
  drops: BambooDropCard[];
  projects: BambooProject[];
  stale: boolean;
  error?: string;
}

const stripTags = (s = "") =>
  s
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCharCode(+d))
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCharCode(parseInt(h, 16)))
    .trim();

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, "Accept-Language": "en" },
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return await res.text();
}

const num = (s: string | null | undefined): number => {
  if (!s) return 0;
  const m = String(s).trim().replace(/\s/g, "").toUpperCase();
  const v = parseFloat(m.replace("K", "")) * (m.includes("K") ? 1000 : 1);
  return isNaN(v) ? 0 : Math.round(v);
};

// ── classification ──────────────────────────────────────────────────────────
// The old filter was keyword-only and let news/opinion posts through. Score
// positive and negative signals instead.

const NEGATIVE: Array<{ re: RegExp; w: number }> = [
  { re: /بنظرتون|به نظر شما|نظراتتون|کسی(?:جوری|ها)?\s*می(?:دونه|دونن)/i, w: 3 },
  { re: /^\s*🚨|مراقب (?:این|کپچا)|صفحه(?:ی|ٔ)? جعلی|فیشینگ|کلاهبردار|اسکم/i, w: 3 },
  { re: /قیمت (?:بیت|اتر|سکه)|نرخ (?:بیت|دلار)|صرافی|بیت‌گت|بایننس|پیش ?فروش|presale/i, w: 2 },
  { re: /کمیسیون|قوانین|حکم|دادگاه|\bSEC\b/i, w: 2 },
  { re: /^\s*(?:اخبار|گزارش)|تحلیل|بررسی قیمت|مرور سریع/i, w: 2 },
  { re: /t\.me\/(?!Bamboodrop)[\w_]*(?:news|neews)/i, w: 3 },
];

const POSITIVE: Array<{ re: RegExp; w: number }> = [
  { re: /ایردراپ|ایر ?دراپ|airdrop/i, w: 3 },
  { re: /تست ?نت|testnet/i, w: 2 },
  { re: /تسک|task|quest|مأموریت|ماموریت/i, w: 2 },
  { re: /کلیم|claim|دریافت|جمع‌آوری|برداشت|领取/i, w: 2 },
  { re: /بزنید|بزن|شرکت کنید|مشارکت|انجام (?:بدید|دهید)|وارد سایت|کلیک کنید/i, w: 2 },
  { re: /باج|badge|امتیاز|\bXP\b|پوینت|نقاط/i, w: 2 },
  { re: /سیزن|season|مرحله|دور اول/i, w: 1 },
  { re: /جواب (?:کوییز|کویز)|کوییز|کویز|پیشنهاد|فرصت/i, w: 2 },
];

const INFO_HOSTS = /calculator|wiki|medium|substack|^https?:\/\/(?:www\.)?t\.me\//i;
const SOCIAL =
  /^https?:\/\/(?:www\.)?(?:x|twitter|t\.me|instagram|telegram|medium)\./i;
const CALL_TO_ACTION =
  /کلیم|بزنید|بزن|کوییز|کویز|انجام بدید|وارد سایت|کلیک کنید/i;
const ACTION_HOSTS = /app\.|quest|claim|testnet|guild|airdrop|mint|portal|dashboard/i;

function classify(text: string, links: string[]): { isDrop: boolean; score: number } {
  let score = 0;
  for (const { re, w } of POSITIVE) if (re.test(text)) score += w;
  for (const { re, w } of NEGATIVE) if (re.test(text)) score -= w;

  if (score < 0) return { isDrop: false, score };

  const real = links.filter((u) => !SOCIAL.test(u) && !INFO_HOSTS.test(u));
  const strong = real.filter((u) => ACTION_HOSTS.test(u));

  if (strong.length) return { isDrop: true, score: Math.max(score, 3) };
  if (!real.length && !CALL_TO_ACTION.test(text)) return { isDrop: false, score };

  return { isDrop: score >= 2, score };
}

/**
 * Project list. `live` means the activity is ongoing, `ended` means the
 * testnet is over. Projects without a status are treated as live.
 */
const PROJECTS: Array<{ slug: string; status: "live" | "ended" }> = [
  { slug: "ethra", status: "live" },
  { slug: "loqua", status: "live" },
  { slug: "railo", status: "live" },
  { slug: "rep", status: "live" },
  { slug: "tempo", status: "live" },
  { slug: "circle", status: "live" },
  { slug: "arc", status: "live" },
  { slug: "robinhood", status: "ended" },
  { slug: "titan", status: "live" },
  { slug: "phantom", status: "live" },
  { slug: "shelby", status: "live" },
  { slug: "arbitrum", status: "live" },
  { slug: "dydx", status: "live" },
  { slug: "aura", status: "live" },
  { slug: "base", status: "live" },
];

const TAG_IGNORE = new Set([
  "leaderboard", "airdrop", "airdrops", "news", "update", "gem", "nft", "defi", "arcus",
  "xrp", "xrpl", "xrplevm", "xrpl-evm",
  "events", "extentions", "extensions", "chrome", "sol", "relay", "solana",
]);

const extractTags = (text: string): string[] => {
  const out = new Set<string>();
  for (const m of text.matchAll(/#([A-Za-z][A-Za-z0-9_]{1,24})/g)) {
    const tag = m[1];
    const key = tag.toLowerCase();
    if (TAG_IGNORE.has(key)) continue;
    if (tag.length < 3) continue;
    out.add(key);
  }
  return [...out];
};

/**
 * Read the channel archive page by page. The public /s/<channel> view shows
 * only the last ~20 posts, but ?before=<oldest_id> walks backwards. Batches of
 * four cursors are guessed and fetched in parallel.
 */
const PARALLEL = 4;

async function fetchArchive(pages = PAGES): Promise<{
  html: string;
  extraHtml: string[];
  pages: number;
  total: number;
}> {
  const idsOf = (html: string): number[] =>
    [...html.matchAll(new RegExp(`data-post="${CHANNEL}/(\\d+)"`, "g"))].map((m) =>
      Number(m[1])
    );

  const first = await fetchText(`https://t.me/s/${CHANNEL}`);
  const firstIds = idsOf(first);
  if (!firstIds.length) return { html: first, extraHtml: [], pages: 1, total: 0 };

  const seen = new Set(firstIds);
  const extraHtml: string[] = [];

  const oldest = Math.min(...firstIds);
  const avgStep = Math.max(
    1,
    Math.round((Math.max(...firstIds) - oldest) / firstIds.length)
  );
  let cursors = [0, 1, 2, 3]
    .map((i) => oldest - i * avgStep * 18)
    .filter((b) => b > 0);

  let round = 0;
  while (extraHtml.length < pages - 1 && cursors.length && round < 12) {
    round++;
    const batch = cursors.slice(0, PARALLEL);
    const results = await Promise.all(
      batch.map(async (b) => {
        try {
          return await fetchText(`https://t.me/s/${CHANNEL}?before=${b}`);
        } catch {
          return "";
        }
      })
    );

    const next: number[] = [];
    for (const html of results) {
      if (!html) continue;
      const ids = idsOf(html);
      if (!ids.length) continue;
      const fresh = ids.filter((i) => !seen.has(i));
      if (!fresh.length) continue;
      fresh.forEach((i) => seen.add(i));
      extraHtml.push(html);
      next.push(Math.min(...fresh) - 1);
    }
    if (!next.length) break;
    cursors = [...new Set(next)].filter((b) => b > 0);
  }

  return { html: first, extraHtml, pages: 1 + extraHtml.length, total: seen.size };
}

function parseChannel(html: string): BambooPost[] {
  const segments = html.split("tgme_widget_message_wrap js-widget_message").slice(1);
  const seen = new Set<string>();
  const posts: BambooPost[] = [];

  for (const seg of segments) {
    const post = (seg.match(/data-post="([^"]+)"/) || [])[1];
    if (!post || seen.has(post)) continue;
    seen.add(post);

    const raw =
      (seg.match(/<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/) ||
        [])[1] || "";
    const text = stripTags(raw);
    const links = [...new Set(raw.match(/https?:\/\/[^\s"'<>)\]]+/g) || [])]
      .map((u) => u.replace(/&amp;/g, "&"))
      .filter((u) => !new RegExp(`t\\.me/(s/)?${CHANNEL}`, "i").test(u));

    const c = classify(text, links);
    posts.push({
      id: (post.match(/_(\d+)$/) || [])[1] || post,
      post,
      url:
        (seg.match(/<a class="tgme_widget_message_date"[^>]*href="([^"]+)"/) || [])[1] ||
        `https://t.me/${post}`,
      text,
      links,
      tags: extractTags(text),
      date: (seg.match(/datetime="([^"]+)"/) || [])[1] || null,
      views:
        (seg.match(/<span class="tgme_widget_message_views">([^<]+)<\/span>/) || [])[1]?.trim() ||
        null,
      isAirdrop: c.isDrop,
      score: c.score || 0,
    });
  }
  return posts;
}

function buildProjects(posts: BambooPost[]): BambooProject[] {
  const groups = new Map<
    string,
    Pick<BambooProject, "tag" | "slug" | "status" | "posts" | "drops">
  >();
  for (const p of PROJECTS) {
    groups.set(p.slug, {
      tag: p.slug,
      slug: p.slug,
      status: p.status,
      posts: [],
      drops: 0,
    });
  }

  for (const post of posts) {
    for (const key of post.tags) {
      if (!groups.has(key)) {
        groups.set(key, { tag: key, slug: key, status: "live", posts: [], drops: 0 });
      }
      const g = groups.get(key)!;
      if (g.posts.some((x) => x.id === post.id)) continue;
      g.posts.push({
        id: post.id,
        text: post.text,
        url: post.url,
        links: post.links,
        date: post.date,
        views: post.views,
        isAirdrop: post.isAirdrop,
      });
      if (post.isAirdrop) g.drops++;
    }
  }

  return [...groups.values()]
    .map((g) => {
      g.posts.sort((a, b) => Number(new Date(b.date || 0)) - Number(new Date(a.date || 0)));
      const latest = g.posts[0]?.date || null;
      return {
        ...g,
        count: g.posts.length,
        latest,
        link: g.posts[0]?.links?.[0] || g.posts[0]?.url || `https://t.me/${CHANNEL}`,
        title:
          g.posts[0]?.text.replace(/\s+/g, " ").trim().slice(0, 90) ||
          "هنوز پیامی برای این پروژه منتشر نشده.",
      };
    })
    .sort((a, b) => {
      if ((a.count > 0) !== (b.count > 0)) return b.count - a.count;
      return (
        b.drops - a.drops ||
        b.count - a.count ||
        Number(new Date(b.latest || 0)) - Number(new Date(a.latest || 0))
      );
    });
}

function buildDrops(posts: BambooPost[]): BambooDropCard[] {
  return posts
    .filter((p) => p.isAirdrop)
    .slice(0, 12)
    .map((p, i) => {
      const line = p.text.split("\n").find((l) => l.trim()) || p.text;
      const net = p.text.match(
        /\b(ETH|BNB|BSC|SOL|ARB|OP|BASE|AVAX|TON|SUI|APT|LINEA|SCROLL|POLYGON|ETHEREUM|SOLANA|ARBITRUM)\b/i
      );
      return {
        id: p.id,
        title: line.length > 70 ? line.slice(0, 70) + "…" : line,
        desc: p.text.length > 240 ? p.text.slice(0, 240) + "…" : p.text,
        network: net ? net[1].toUpperCase() : "—",
        link: p.links[0] || p.url,
        channelUrl: p.url,
        date: p.date,
        views: p.views,
        status: i === 0 ? "جدید" : "فعال",
        tag: /airdrop|ایردراپ/i.test(p.text) ? "airdrop" : "task",
      };
    });
}

async function fetchCounts(): Promise<{
  subscribers: number;
  members: number;
  online: number;
}> {
  const out = { subscribers: 0, members: 0, online: 0 };
  const grab = (src: string) => {
    const m = src.match(/([\d][\d\s,\.]*[KM]?)\s*(subscribers|members)/i);
    const o = src.match(/([\d][\d\s,\.]*[KM]?)\s*online/i);
    return { n: m ? m[1] : null, on: o ? o[1] : null };
  };
  const jobs: Array<[string, (s: string) => void]> = [
    [
      `https://t.me/${CHANNEL}`,
      (s) => {
        out.subscribers = num(grab(s).n);
      },
    ],
    [
      `https://t.me/${GROUP}`,
      (s) => {
        const g = grab(s);
        out.members = num(g.n) || out.members;
        out.online = num(g.on);
      },
    ],
  ];
  await Promise.all(
    jobs.map(async ([url, apply]) => {
      try {
        apply(await fetchText(url));
      } catch {
        /* offline: keep zeros */
      }
    })
  );
  return out;
}

let cache: { at: number; data: BambooData } | null = null;

/** Full snapshot. stale=true means the archive was unreachable. */
export async function getData(): Promise<BambooData> {
  if (cache && Date.now() - cache.at < CACHE_TTL) return cache.data;

  try {
    const [archive, counts] = await Promise.all([fetchArchive(), fetchCounts()]);
    const posts = [archive.html, ...archive.extraHtml].flatMap(parseChannel);
    posts.sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));

    const data: BambooData = {
      updatedAt: new Date().toISOString(),
      channel: CHANNEL,
      group: GROUP,
      pages: archive.pages,
      stats: { ...counts, posts: posts.length },
      posts: posts.slice(0, 60),
      drops: buildDrops(posts),
      projects: buildProjects(posts),
      stale: false,
    };
    cache = { at: Date.now(), data };
    return data;
  } catch (e) {
    if (cache) return { ...cache.data, stale: true };
    return {
      updatedAt: new Date().toISOString(),
      channel: CHANNEL,
      group: GROUP,
      stats: { subscribers: 0, members: 0, online: 0, posts: 0 },
      posts: [],
      drops: [],
      projects: [],
      stale: true,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
