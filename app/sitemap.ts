import type { MetadataRoute } from "next";
import { SITE_CANONICAL_URL } from "@/lib/support";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_CANONICAL_URL;
  return [
    { url: `${base}/`, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/privacy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/terms`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/r/sample`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
  ];
}
