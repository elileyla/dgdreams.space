import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import { Providers } from "./providers";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";

/**
 * Two fonts, two jobs.
 *
 * Archivo is a variable grotesk with a width axis: the UI runs slightly
 * condensed and the big numbers run narrower still, so the whole page reads as
 * one family instead of a headline font fighting a body font.
 *
 * IBM Plex Mono is reserved for data — addresses, hashes, counters, timers.
 * Labels, buttons and captions are set in Archivo.
 */
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
  axes: ["wdth"],
});

const plexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-plex-mono",
  display: "swap",
});

/**
 * the metadataBase is only needed to resolve relative metadata URLs (og image),
 * and pulls from the public site env so previews don't hardcode production.
 */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://dgdreams.space";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "DGDreams — Daily On-Chain Streak",
  description:
    "Track your daily on-chain streak, interact with multiple blockchain networks, and monitor your Web3 activity.",
  // brand kit v1: favicon.ico (16→64), iOS icon 180, mark rendered at 32
  icons: {
    icon: [
      { url: "/brand/favicon.ico" },
      { url: "/brand/mark-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/brand/apple-touch-icon-180.png",
  },
  openGraph: {
    siteName: "DGDreams",
    images: [
      {
        url: "/brand/og-1200x630.png",
        width: 1200,
        height: 630,
        alt: "DGDreams — Daily On-Chain Streak",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/brand/og-1200x630.png"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0D0C0B" },
    { media: "(prefers-color-scheme: light)", color: "#F7F5F2" },
  ],
};

/**
 * Applies the saved theme before the first paint.
 *
 * Dark is the default — the `data-theme="web3"` default pushed for the ritual
 * theme — so an unstyled flash is the dark theme and a saved light preference
 * flips it back. Without this, `/` (which has no theme control of its own)
 * would ignore the saved preference entirely.
 */
const THEME_BOOT = `(function(){try{var s=localStorage.getItem('dgdreams-theme')||localStorage.getItem('voidchain-theme');var dark=!s||s==='dark'||s==='web3'||['cyber','emerald','frost','matrix'].indexOf(s)>-1;document.documentElement.setAttribute('data-theme',dark?'dark':'light');}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${archivo.variable} ${plexMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body className="bg-[var(--bg-base)] text-[var(--text-primary)] antialiased">
        <Providers>
          {children}
          {/* Vercel's own script host is unreachable in local dev (the console
              shows a failed fetch on every page load), so only mount these in
              production builds where they actually collect data. */}
          {process.env.NODE_ENV === "production" ? (
            <>
              <Analytics />
              <SpeedInsights />
            </>
          ) : null}
        </Providers>
      </body>
    </html>
  );
}
