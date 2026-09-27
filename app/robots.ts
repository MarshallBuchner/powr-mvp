import type { MetadataRoute } from "next";
import { SITE_CANONICAL_URL } from "@/lib/support";

/** Next.js metadata route (works alongside public/robots.txt). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/assessments",
        "/unlock",
        "/login",
        "/auth/",
        "/r/",
        "/prototype/",
      ],
    },
    sitemap: `${SITE_CANONICAL_URL}/sitemap.xml`,
  };
}
