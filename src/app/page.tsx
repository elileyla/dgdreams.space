import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DGDreams — Multi-Chain On-Chain Activity Terminal",
  description:
    "Connect your wallet, execute daily check-ins across 24 blockchain networks, build streaks, mint soulbound NFTs and climb the leaderboard. Supports Ethereum, Base, HyperEVM, BNB Chain, GenLayer and more.",
  openGraph: {
    title: "DGDreams — Multi-Chain On-Chain Activity Terminal",
    description:
      "Daily on-chain tasks across 21 networks. Build streaks and earn soulbound NFTs.",
    url: "https://dgdreams.space",
    siteName: "DGDreams",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/brand/og-1200x630.png",
        width: 1200,
        height: 630,
        alt: "DGDreams — Multi-Chain Activity Terminal",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DGDreams — Multi-Chain On-Chain Activity Terminal",
    description:
      "Daily on-chain tasks across 21 networks. Build streaks, earn soulbound NFTs.",
    images: ["/brand/og-1200x630.png"],
  },
  keywords: [
    "web3",
    "blockchain",
    "daily tasks",
    "on-chain",
    "streak",
    "soulbound NFT",
    "multi-chain",
    "DGDreams",
    "GenLayer",
    "Ethereum",
    "Base",
    "BNB Chain",
  ],
  authors: [{ name: "Misagh95", url: "https://github.com/Misagh95" }],
  metadataBase: new URL("https://dgdreams.space"),
};

export { default } from "./landing-client";
