import type { MetadataRoute } from "next";

const BASE = "https://showsup.co";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/index",
          "/index/",
          "/methodology",
          "/learn/",
          "/blog/",
          "/about",
          "/changelog",
          "/privacy",
          "/terms",
        ],
        disallow: [
          "/app/",
          "/api/",
          "/login",
          "/signup",
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
