import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { referralPortalUrl } from "@/lib/referral";
import { allPosts, allTags, lastTouched } from "@/lib/blog";

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
      url: `${SITE_URL}/blog`,
      changeFrequency: "weekly",
      priority: 0.8,
      lastModified,
    },
    // A post's own publish date, not today's — claiming everything changed on
    // every deploy is how a sitemap stops being believed.
    ...allPosts().map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
      lastModified: new Date(`${lastTouched(post)}T00:00:00Z`),
    })),
    // Tag pages are real crawlable URLs, but they're indexes rather than
    // content — low priority so they don't compete with the posts themselves.
    ...allTags().map((tag) => ({
      url: `${SITE_URL}/blog/tag/${tag.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
      lastModified,
    })),
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
