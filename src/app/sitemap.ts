import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://dgdreams.space";
  const now = new Date();

  const routes = [
    "",
    "/dashboard",
    "/tasks",
    "/leaderboard",
    "/swap",
    "/deploy",
    "/litvm-market",
    "/faq",
    "/bamboo",
    "/terms",
    "/license",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" || route === "/dashboard" || route === "/leaderboard" ? "daily" : "weekly",
    priority: route === "" ? 1.0 : route === "/dashboard" ? 0.9 : 0.7,
  }));
}
