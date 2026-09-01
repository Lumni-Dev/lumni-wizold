import type { MetadataRoute } from "next";
import { SITE_URL } from "@/shared/constants/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/login", "/wiki", "/ranking"],
      disallow: [
        "/api/",
        "/create",
        "/character",
        "/hunt",
        "/training",
        "/forge",
        "/market",
        "/inventory",
        "/arena",
        "/tavern",
        "/pet",
        "/bazaar",
        "/store",
        "/settings",
      ],
    },
    sitemap: SITE_URL + "/sitemap.xml",
    host: SITE_URL,
  };
}
