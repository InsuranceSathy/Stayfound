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

/** "8 August 2026" — spelled out, because 08/08 is ambiguous across regions. */
export function formatPostDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
