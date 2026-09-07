/**
 * What kind of page a citation is.
 *
 * Profound's citation-types bar is the one chart in their dashboard that tells
 * a customer *where to go* rather than where they stand: "41% of the answers
 * about you are shaped by vendor blogs and 22% by review sites" is a plan, and
 * a list of bare domains is not.
 *
 * Deterministic, from the domain alone. That matters because it means the
 * classification works on payloads the engine has already sent — no scan has to
 * be re-run and the hosted scorer needs no change to light this up.
 */

export type CitationKind =
  | "own"
  | "review-site"
  | "forum"
  | "video"
  | "directory"
  | "vendor-blog"
  | "news"
  | "docs"
  | "social"
  | "other";

export const CITATION_KIND_LABEL: Record<CitationKind, string> = {
  own: "Your own site",
  "review-site": "Review sites",
  forum: "Forums",
  video: "Video",
  directory: "Directories",
  "vendor-blog": "Vendor blogs",
  news: "News & press",
  docs: "Documentation",
  social: "Social",
  other: "Other",
};

const EXACT: Record<string, CitationKind> = {
  "g2.com": "review-site",
  "capterra.com": "review-site",
  "trustpilot.com": "review-site",
  "gartner.com": "review-site",
  "getapp.com": "review-site",
  "softwareadvice.com": "review-site",
  "trustradius.com": "review-site",
  "reddit.com": "forum",
  "news.ycombinator.com": "forum",
  "quora.com": "forum",
  "stackoverflow.com": "forum",
  "indiehackers.com": "forum",
  "youtube.com": "video",
  "vimeo.com": "video",
  "tiktok.com": "video",
  "producthunt.com": "directory",
  "alternativeto.net": "directory",
  "crunchbase.com": "directory",
  "saashub.com": "directory",
  "tracxn.com": "directory",
  "clutch.co": "directory",
  "techcrunch.com": "news",
  "theverge.com": "news",
  "forbes.com": "news",
  "businessinsider.com": "news",
  "wikipedia.org": "docs",
  "github.com": "docs",
  "linkedin.com": "social",
  "x.com": "social",
  "twitter.com": "social",
  "facebook.com": "social",
  "instagram.com": "social",
};

const bare = (d: string) =>
  d.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];

/**
 * `ownDomains` wins over everything: a customer's own docs subdomain is still
 * theirs, and counting it as documentation would quietly inflate how much of
 * the conversation they are seen to control.
 */
export function citationKind(domain: string, ownDomains: string[] = []): CitationKind {
  const d = bare(domain);
  if (ownDomains.some((o) => d === bare(o) || d.endsWith("." + bare(o)))) return "own";
  if (EXACT[d]) return EXACT[d];

  // Subdomain of a known host — docs.stripe.com, blog.hubspot.com.
  const parent = Object.keys(EXACT).find((k) => d.endsWith("." + k));
  if (parent) return EXACT[parent];

  if (/^docs\.|^developer\.|^developers\./.test(d)) return "docs";
  if (/^blog\./.test(d)) return "vendor-blog";
  if (/(^|\.)(news|press)\./.test(d)) return "news";
  if (/(forum|community)\./.test(d)) return "forum";
  if (/(directory|listing|alternatives)/.test(d)) return "directory";

  // A company domain that is neither the customer's nor a known platform is
  // almost always a competitor or adjacent vendor publishing about the
  // category — which is exactly the "vendor blog" bucket that matters here.
  return "vendor-blog";
}

/** The share-by-kind breakdown the citation-types bar reads. */
export function citationTypes(
  sources: { domain: string; share?: number | null; isYou?: boolean }[],
  ownDomains: string[] = [],
): { kind: CitationKind; label: string; share: number }[] {
  if (!sources.length) return [];
  // Where the engine gave no share, every source counts once — a flat split is
  // honest about "we know it was cited, not how often".
  const weight = (s: { share?: number | null }) =>
    typeof s.share === "number" && s.share > 0 ? s.share : 1;
  const total = sources.reduce((a, s) => a + weight(s), 0) || 1;

  const by = new Map<CitationKind, number>();
  for (const s of sources) {
    const k = s.isYou ? "own" : citationKind(s.domain, ownDomains);
    by.set(k, (by.get(k) ?? 0) + weight(s));
  }
  return [...by.entries()]
    .map(([kind, n]) => ({
      kind,
      label: CITATION_KIND_LABEL[kind],
      share: Math.round((n / total) * 1000) / 10,
    }))
    .sort((a, b) => b.share - a.share);
}
