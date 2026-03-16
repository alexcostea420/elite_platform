import type { MetadataRoute } from "next";

import { getAbsoluteRouteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: getAbsoluteRouteUrl("/"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: getAbsoluteRouteUrl("/upgrade", "app"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];
}
