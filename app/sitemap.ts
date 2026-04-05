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
      priority: 0.9,
    },
    {
      url: getAbsoluteRouteUrl("/bots"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: getAbsoluteRouteUrl("/login", "app"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: getAbsoluteRouteUrl("/signup", "app"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: getAbsoluteRouteUrl("/blog"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: getAbsoluteRouteUrl("/blog/cum-sa-incepi-trading"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}
