import type { VisibilityResult } from "@/lib/visibility";
import { citationKind, citationTypes } from "@/lib/citation-kind";

/**
 * Fills in everything the v2 contract asks for that can be worked out from a
 * payload we already have.
 *
 * The split matters. Some fields are genuinely new information the engine has
 * to go and collect — the answer text, the position a brand held inside an
 * answer, the URL behind a citation. Others are only arithmetic or
 * classification over data already in hand, and waiting for the backend to send
 * those would be waiting for no reason.
 *
 * So: this derives what is derivable, and leaves the rest absent rather than
 * guessing. A field this cannot honestly compute stays undefined, because a
 * plausible invented number in a client report is worse than a blank.
 */

const bare = (d: string) =>
  d.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];

/** Domains the brand owns, for the "own"/"Owned" distinction. */
function ownDomains(result: VisibilityResult, brand: string): string[] {
  const out = new Set<string>();
  if (brand.includes(".")) out.add(bare(brand));
  for (const s of result.citedSources ?? []) if (s.isYou) out.add(bare(s.domain));
  const me = result.competitors.find((c) => c.you);
  if (me?.domain) out.add(bare(me.domain));
  return [...out];
}

/**
 * A competitor's domain, but only when the payload actually contains it.
 *
 * Deliberately does not guess. "Dreamdata" → "dreamdata.com" is right often
 * enough to be dangerous: a wrong favicon next to a competitor's name in a
 * document a customer sends to their client is a small, very visible error.
 */
function domainFor(
  name: string,
  sources: { domain: string }[],
): string | undefined {
  // Strip a TLD from the name before comparing: a competitor listed as
  // "numberhill.com" must still match the host "numberhill.com".
  const squash = (s: string) =>
    s.toLowerCase().replace(/\.[a-z.]+$/, "").replace(/[^a-z0-9]/g, "");
  const target = squash(name);
  if (!target) return undefined;
  const hit = sources.find((s) => {
    const host = bare(s.domain);
    return squash(host.split(".")[0]) === target;
  });
  return hit ? bare(hit.domain) : undefined;
}

export function enrich(result: VisibilityResult, brand: string): VisibilityResult {
  const own = ownDomains(result, brand);
  const sources = result.citedSources ?? [];

  // ---- citations: kind always, share only when it can be counted ----------
  const withShare = sources.some((s) => typeof s.share === "number");
  const citedSources = sources.map((s) => {
    const kind = s.kind ?? (s.isYou ? "own" : citationKind(s.domain, own));
    // Even split when the engine reports no counts. Flagged by `shareBasis` so
    // the UI can say "cited" rather than implying a measured frequency.
    const share =
      typeof s.share === "number"
        ? s.share
        : withShare
          ? s.share
          : Math.round((100 / sources.length) * 10) / 10;
    return {
      ...s,
      kind,
      share,
      shareBasis: typeof s.share === "number" ? "counted" : "even",
      // A citation entry whose domain carries a path is really a page.
      pages:
        s.pages ??
        (s.domain.includes("/")
          ? [{ url: s.domain.startsWith("http") ? s.domain : `https://${s.domain}` }]
          : undefined),
    };
  });

  // ---- competitors: a domain when the citation list reveals one -----------
  const competitors = result.competitors.map((c) => ({
    ...c,
    domain: c.domain ?? domainFor(c.name, sources),
  }));

  // ---- engines: stats from `answers` when the engine sent them ------------
  const answers = result.answers ?? [];
  const engines = result.engines.map((e) => {
    const mine = answers.filter((a) => a.engine === e.name);
    if (!mine.length) return e;
    const hits = mine.filter((a) => a.mentioned);
    const positions = hits
      .map((a) => a.position)
      .filter((p): p is number => typeof p === "number");
    const cites = mine.flatMap((a) => a.citations ?? []);
    const mineCites = cites.filter((c) => own.includes(bare(c.domain)));
    return {
      ...e,
      answers: mine.length,
      mentionRate: Math.round((hits.length / mine.length) * 1000) / 10,
      avgPosition: positions.length
        ? Math.round((positions.reduce((a, b) => a + b, 0) / positions.length) * 100) / 100
        : null,
      citationShare: cites.length
        ? Math.round((mineCites.length / cites.length) * 1000) / 10
        : null,
    };
  });

  return {
    ...result,
    engines,
    competitors,
    citedSources,
    citationTypes:
      result.citationTypes ?? (sources.length ? citationTypes(citedSources, own) : undefined),
  } as VisibilityResult;
}
