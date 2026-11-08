import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DGDreams — Web3 Activity Terminal",
    short_name: "DGDreams",
    description: "Daily on-chain task terminal and multi-chain activity tracker.",
    start_url: "/dashboard",
    display: "standalone",
    // brand kit v1: Night background, accent chrome
    background_color: "#0D0C0B",
    theme_color: "#0D0C0B",
    icons: [
      {
        src: "/brand/mark.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/brand/avatar-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/brand/mark-64.png",
        sizes: "64x64",
        type: "image/png",
      },
    ],
  };
}
