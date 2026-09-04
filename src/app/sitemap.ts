import type { MetadataRoute } from "next";
import { pool } from "@/models/repositories/server/database";
import { loadHunterIds } from "@/models/repositories/server/roster.store";
import { SITE_URL } from "@/shared/constants/site";

const PUBLIC_ROUTES: readonly { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] =
  [
    { path: "", priority: 1, changeFrequency: "weekly" },
    { path: "/login", priority: 0.7, changeFrequency: "monthly" },
    { path: "/wiki", priority: 0.9, changeFrequency: "weekly" },
    { path: "/ranking", priority: 0.9, changeFrequency: "daily" },
  ];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = PUBLIC_ROUTES.map((route) => ({
    url: SITE_URL + route.path,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  try {
    const client = await pool.connect();
    try {
      const hunters = await loadHunterIds(client);
      for (const hunter of hunters) {
        entries.push({
          url: SITE_URL + "/ranking/" + hunter.id,
          lastModified: now,
          changeFrequency: "daily",
          priority: 0.6,
        });
      }
    } finally {
      client.release();
    }
  } catch {
  }

  return entries;
}
