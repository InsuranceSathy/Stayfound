// The post catalogue, in one place because four things have to agree about it:
// the blog index, the [slug] route that renders one, `generateStaticParams`
// which decides what gets prerendered, and the sitemap. When those disagree the
// symptom is a post that renders at its URL but never gets discovered — the
// worst failure mode for content whose entire job is being found and cited.
//
// Posts are TSX components rather than MDX on purpose. The bodies lean on dense
// comparison tables and the site's own design tokens, which is more direct to
// write as JSX than to configure a markdown pipeline for — and it keeps the
// dependency count at zero.

import type { ComponentType } from "react";
import AiVisibilityToolsCompared2026 from "@/content/posts/ai-visibility-tools-compared-2026";
import DoesLlmsTxtWork2026 from "@/content/posts/does-llms-txt-work-2026";
import GeoVsAeoVsSeo from "@/content/posts/geo-vs-aeo-vs-seo";
import HowToGetCitedByChatGpt from "@/content/posts/how-to-get-cited-by-chatgpt";
import HowToMeasureAiVisibility from "@/content/posts/how-to-measure-ai-visibility";

export interface Post {
  slug: string;
  /** The <h1>. Written for a human skimming the page. */
  title: string;
  /** The <title> tag, in the site-wide "<Page> — StayFound" form. */
  seoTitle: string;
  description: string;
  /** The index card blurb. Shorter and punchier than `description`. */
  excerpt: string;
  /** ISO date, always absolute — a relative date rots the moment it's written. */
  publishedAt: string;
  updatedAt?: string;
  readingMinutes: number;
  tags: readonly string[];
  Body: ComponentType;
}

export const POSTS: readonly Post[] = [
  {
    slug: "ai-visibility-tools-compared-2026",
    title:
      "Who AI recommends, and who's tracking it: the 2026 AI-visibility tool landscape",
    seoTitle: "AI visibility tools compared (2026) — StayFound",
    description:
      "A sourced comparison of Profound, Peec AI, Otterly.AI, Scrunch, Semrush AI Toolkit, Ahrefs Brand Radar and StayFound — what each one costs, which engines it reads, and which of them actually fix what they find.",
    excerpt:
      "Seven tools now claim to tell you how ChatGPT talks about your brand. We priced them, listed what they cover, and said plainly where each one wins — including where we don't.",
    publishedAt: "2026-08-08",
    readingMinutes: 11,
    tags: ["Comparison", "AEO", "AI search"],
    Body: AiVisibilityToolsCompared2026,
  },
  {
    slug: "geo-vs-aeo-vs-seo",
    title: "GEO vs AEO vs SEO: the difference, in plain terms",
    seoTitle: "GEO vs AEO vs SEO explained (2026) — StayFound",
    description:
      "SEO ranks you, AEO selects you, GEO cites and recommends you. What each term actually means, how they differ row by row, and why GEO is a layer on top of SEO rather than a replacement.",
    excerpt:
      "Three acronyms, heavily overlapping, argued about constantly. Here's the honest distinction — and the one row in the comparison that invalidates most transferred SEO instinct.",
    publishedAt: "2026-08-04",
    readingMinutes: 7,
    tags: ["Explainer", "GEO", "AI search"],
    Body: GeoVsAeoVsSeo,
  },
  {
    slug: "how-to-measure-ai-visibility",
    title: "How to measure AI visibility: the five numbers that matter",
    seoTitle: "How to measure AI visibility — StayFound",
    description:
      "Share of voice, citation rate, average position, answers lost and sentiment — how to define each one, the cadence to review them on, and which popular metric to distrust.",
    excerpt:
      "Your analytics cannot see this funnel, so measurement has to be active. Five numbers are enough — and one widely reported metric deserves a hard question.",
    publishedAt: "2026-08-05",
    readingMinutes: 9,
    tags: ["How-to", "Metrics", "AI search"],
    Body: HowToMeasureAiVisibility,
  },
  {
    slug: "how-to-get-cited-by-chatgpt",
    title: "How to get cited by ChatGPT: what actually moves the needle",
    seoTitle: "How to get cited by ChatGPT (2026) — StayFound",
    description:
      "In one analysis of 21,311 brand mentions, 85% came from domains the brand didn't own. What that means for where you spend the effort, in priority order.",
    excerpt:
      "Almost all the advice on this is about your own website, and that is mostly not where the model is looking. The uncomfortable finding, and what to do about it.",
    publishedAt: "2026-08-06",
    readingMinutes: 8,
    tags: ["How-to", "AEO", "Citations"],
    Body: HowToGetCitedByChatGpt,
  },
  {
    slug: "does-llms-txt-work-2026",
    title: "We generate llms.txt. Here’s whether it actually works.",
    seoTitle: "Does llms.txt work? The 2026 evidence — StayFound",
    description:
      "Perplexity reads llms.txt. OpenAI, Anthropic and Google have never confirmed they do, and none document it as a citation signal. The evidence, and why we still ship one.",
    excerpt:
      "Our own product generates this file and lists it as a feature. Then we went looking for proof it works. Here is what we found, including the part that makes our feature look smaller.",
    publishedAt: "2026-08-07",
    readingMinutes: 6,
    tags: ["AEO", "Technical", "Citations"],
    Body: DoesLlmsTxtWork2026,
  },
] as const;

/** Newest first — the order the index renders in. */
export function allPosts(): readonly Post[] {
  return [...POSTS].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getPost(slug: string): Post | null {
  return POSTS.find((p) => p.slug === slug) ?? null;
}

/** The date search engines and readers should treat as current. */
export function lastTouched(post: Post): string {
  return post.updatedAt ?? post.publishedAt;
}

/** "How-to" → "how-to". The URL form of a tag. */
export function tagSlug(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Every tag in use, most-used first, then alphabetical for a stable order. */
export function allTags(): { label: string; slug: string; count: number }[] {
  const seen = new Map<string, { label: string; slug: string; count: number }>();
  for (const post of POSTS) {
    for (const tag of post.tags) {
      const slug = tagSlug(tag);
      const hit = seen.get(slug);
      if (hit) hit.count += 1;
      else seen.set(slug, { label: tag, slug, count: 1 });
    }
  }
  return [...seen.values()].sort(
    (a, b) => b.count - a.count || a.label.localeCompare(b.label),
  );
}

export function getTag(slug: string): { label: string; slug: string } | null {
  return allTags().find((t) => t.slug === slug) ?? null;
}

export function postsByTag(slug: string): readonly Post[] {
  return allPosts().filter((p) => p.tags.some((t) => tagSlug(t) === slug));
}

/**
 * The posts either side of this one in reading order.
 *
 * Named `newer`/`older` rather than prev/next on purpose — "previous" is
 * ambiguous once the list is sorted newest-first, and the two readings put the
 * arrows on opposite ends of the footer.
 */
export function neighbors(slug: string): {
  newer: Post | null;
  older: Post | null;
} {
  const posts = allPosts();
  const i = posts.findIndex((p) => p.slug === slug);
  if (i < 0) return { newer: null, older: null };
  return {
    newer: posts[i - 1] ?? null,
    older: posts[i + 1] ?? null,
  };
}

/** Most tags in common wins; recency breaks the tie. */
export function related(slug: string, limit = 3): readonly Post[] {
  const post = getPost(slug);
  if (!post) return [];
  const mine = new Set(post.tags.map(tagSlug));

  return allPosts()
    .filter((p) => p.slug !== slug)
    .map((p) => ({
      post: p,
      shared: p.tags.filter((t) => mine.has(tagSlug(t))).length,
    }))
    .sort(
      (a, b) =>
        b.shared - a.shared ||
        b.post.publishedAt.localeCompare(a.post.publishedAt),
    )
    .slice(0, limit)
    .map((r) => r.post);
}

/** "8 August 2026" — spelled out, because 08/08 is ambiguous across regions. */
export function formatPostDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
