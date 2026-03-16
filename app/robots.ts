import type { MetadataRoute } from "next";

import { getAbsoluteRouteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/admin/"],
      },
    ],
    sitemap: getAbsoluteRouteUrl("/sitemap.xml"),
  };
}
