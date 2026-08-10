import type { VisibilityResult } from "@/lib/visibility";

/**
 * Pure derivations over a stored snapshot. A raw score of "8" means nothing to a
 * first-time user — everything here exists to turn the numbers we already have
 * into a sentence someone can act on. No fabrication: every value is computed
 * from fields the scan actually returned.
 */

export type Tone = "critical" | "warn" | "ok" | "good";

export type Verdict = { label: string; meaning: string; tone: Tone };

/** Plain-English reading of the 0-100 visibility score. */
export function verdictFor(score: number): Verdict {
  if (score < 20)
    return {
      label: "Invisible",
      meaning:
        "AI assistants almost never name you when buyers ask for options in your category.",
      tone: "critical",
    };
  if (score < 40)
    return {
      label: "Barely visible",
      meaning:
        "You surface now and then, but competitors own the default answer buyers see.",
      tone: "warn",
    };
  if (score < 60)
    return {
      label: "Emerging",
      meaning:
        "You appear in a fair share of answers, but rarely as the first recommendation.",
      tone: "warn",
    };
  if (score < 80)
    return {
      label: "Competitive",
      meaning:
        "You're a regular recommendation and often sit near the top of the list.",
      tone: "ok",
    };
  return {
    label: "Leading",
    meaning:
      "You're one of the first brands AI recommends when buyers ask in this category.",
    tone: "good",
  };
}

const norm = (s: string) => s.toLowerCase().replace(/^www\./, "").trim();

/**
 * Finds the user's own row in the competitor set. Prefers the explicit `you`
 * flag, then falls back to name matching so the dashboard still works if the
 * backend forgets to set it.
 */
export function findYou(
  competitors: VisibilityResult["competitors"],
  brandName: string,
) {
  const flagged = competitors.find((c) => c.you);
  if (flagged) return flagged;
  const b = norm(brandName);
  const bare = b.replace(/\.[a-z.]+$/, ""); // numberhill.com → numberhill
  return competitors.find((c) => {
    const n = norm(c.name);
    return n === b || n === bare || n.replace(/\.[a-z.]+$/, "") === bare;
  });
}

export type Standing = {
  rank: number | null;
  total: number;
  yourShare: number;
  leader: { name: string; share: number } | null;
  /** How many times the leader's share exceeds yours (null if you're the leader). */
  leaderMultiple: number | null;
  gapPoints: number | null;
};

/** Where you sit in the share-of-voice table, and how far off the leader. */
export function standing(
  competitors: VisibilityResult["competitors"],
  brandName: string,
): Standing {
  const sorted = [...competitors].sort((a, b) => b.share - a.share);
  const you = findYou(competitors, brandName);
  const idx = you ? sorted.findIndex((c) => c === you) : -1;
  const leader = sorted[0] ?? null;
  const yourShare = you?.share ?? 0;
  const isLeader = !!you && leader === you;
  return {
    rank: idx >= 0 ? idx + 1 : null,
    total: sorted.length,
    yourShare,
    leader: leader ? { name: leader.name, share: leader.share } : null,
    leaderMultiple:
      leader && !isLeader && yourShare > 0
        ? Math.round((leader.share / yourShare) * 10) / 10
        : null,
    gapPoints:
      leader && !isLeader ? Math.round(leader.share - yourShare) : null,
  };
}

/** Engine coverage: how many assistants mention you, and the best/worst one. */
export function engineStanding(engines: VisibilityResult["engines"]) {
  const sorted = [...engines].sort((a, b) => b.score - a.score);
  return {
    mentioned: engines.filter((e) => e.mentioned).length,
    total: engines.length,
    best: sorted[0] ?? null,
    worst: sorted[sorted.length - 1] ?? null,
  };
}

/** Citation presence: of the sources AI leans on, how many are yours. */
export function citationStanding(sources: VisibilityResult["citedSources"]) {
  const list = sources ?? [];
  const yours = list.filter((s) => s.isYou).length;
  return { yours, total: list.length, missing: list.length - yours };
}

const IMPACT_ORDER = { high: 0, medium: 1, low: 2 } as const;

/** Actions sorted so the highest-impact move is always first. */
export function rankedActions(actions: VisibilityResult["actions"]) {
  return [...actions].sort(
    (a, b) => IMPACT_ORDER[a.impact] - IMPACT_ORDER[b.impact],
  );
}

/** Cache key used by the scan-job table, so a job can be tied to a brand. */
export function scanKey(brand: string, category: string) {
  return `${brand.toLowerCase()}|${category.toLowerCase()}`;
}

/**
 * Long-form age, for a sentence rather than a chip: "6 hours ago".
 *
 * A reading taken this morning is not stale — assistants change their answers
 * over weeks, not minutes — so this is written to state a fact, never to
 * apologise for one.
 */
export function measuredAgo(iso: string | Date): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins} minutes ago`;
  const hours = Math.round(mins / 60);
  if (hours === 1) return "an hour ago";
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

export function relativeTime(iso: string | Date): string {
  const then = new Date(iso).getTime();
  const m = Math.round((Date.now() - then) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}
