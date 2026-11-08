import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DGDreams — Daily On-Chain Streak",
    short_name: "DGDreams",
    description: "Daily on-chain ritual, streak and badge terminal across 21 networks.",
    start_url: "/dashboard",
    display: "standalone",
    // brand v2 "Orbit-D": night background, acid-lime mark
    background_color: "#0D0C0B",
    theme_color: "#0D0C0B",
    icons: [
      {
        src: "/brand/mark.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/brand/avatar-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/avatar-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/brand/mark-64.png",
        sizes: "64x64",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
