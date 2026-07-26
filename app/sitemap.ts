import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1, lastModified },
    {
      url: `${SITE_URL}/pricing`,
      changeFrequency: "monthly",
      priority: 0.9,
      lastModified,
    },
    {
      url: `${SITE_URL}/demo`,
      changeFrequency: "monthly",
      priority: 0.8,
      lastModified,
    },
    {
      url: `${SITE_URL}/about`,
      changeFrequency: "monthly",
      priority: 0.7,
      lastModified,
    },
    {
      url: `${SITE_URL}/privacy`,
      changeFrequency: "yearly",
      priority: 0.3,
      lastModified,
    },
    {
      url: `${SITE_URL}/terms`,
      changeFrequency: "yearly",
      priority: 0.3,
      lastModified,
    },
  ];
}
