import type { NextConfig } from "next";

const securityHeaders = [
  {
    // Inline scripts are allowed (Next.js hydration), but external script
    // origins are blocked unless loaded from 'self'. Wallet extensions
    // (MetaMask etc.) inject via content scripts and are not affected.
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      // WalletConnect relay (wss), chain RPCs and wallet metadata APIs (https).
      "connect-src 'self' https: wss:",
      "frame-src 'self' https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    // lucide-react ships ~1500 icon modules; without this Next pulls the whole
    // barrel into every page bundle and parse time shows up as slow loads.
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "viem",
      "wagmi",
      "@rainbow-me/rainbowkit",
    ],
  },
  async rewrites() {
    return [
      // The BambooDrop page is a full standalone HTML document (its own RTL
      // layout, fonts and nav), so it is served from /public as-is instead of
      // being rebuilt as a React page. /bamboo masks the index.html.
      { source: "/bamboo", destination: "/bamboo/index.html" },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // BambooDrop lives as a self-contained static page under /public.
        // Its stickers never change, so pin them; the html/css/js stay
        // revalidated so a copy tweak ships without a purge.
        source: "/bamboo/stickers/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/bamboo/style.css",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
      },
      {
        source: "/bamboo/script.js",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
      },
      {
        // Badge artwork and network logos are 2048->1024 quantized PNGs served
        // as-is (unfingerprinted, no /_next/static hashing) — marketplaces,
        // wallets and explorers re-fetch the same files for every token they
        // index, so let the edge cache pin them for a year instead of the
        // default must-revalidate re-download.
        source: "/output-premium/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/:path*.png",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/:path*.svg",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/:path*.mp4",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
