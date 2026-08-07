import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { referralPortalUrl } from "@/lib/referral";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    // /refer only exists when the program is configured — it 404s otherwise,
    // and submitting a 404 to search engines is worse than omitting it.
    ...(referralPortalUrl()
      ? [
          {
            url: `${SITE_URL}/refer`,
            changeFrequency: "monthly" as const,
            priority: 0.6,
            lastModified,
          },
        ]
      : []),
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
