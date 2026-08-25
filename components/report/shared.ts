import type { Brand, Snapshot } from "@/lib/queries";
import type { VisibilityResult } from "@/lib/visibility";
import {
  citationStanding,
  engineStanding,
  findYou,
  rankedActions,
  standing,
  verdictFor,
} from "@/lib/report-derive";
import { steps, takeaway } from "@/lib/action-format";
import { snippetsFor } from "@/lib/snippets";

/**
 * One derivation pass, shared by all five templates.
 *
 * The templates differ in how the report looks, never in what it says — so the
 * arithmetic, the sorting and the sentence-level phrasing all happen once here.
 * Five copies of "rank #3 of 6" is five chances for one of them to disagree
 * with the others about the same scan.
 */

export interface TemplateProps {
  brand: Brand;
  snapshot: Snapshot;
  history: Snapshot[];
  /** The platform's address. Printed once, on the final page. */
  site: string;
}

export function derive({ brand, snapshot, history }: Omit<TemplateProps, "site">) {
  const data: VisibilityResult = snapshot.data;
  const sorted = [...data.competitors].sort((a, b) => b.share - a.share);
  const you = findYou(data.competitors, brand.name);

  const moves = rankedActions(data.actions).map((move) => ({
    move,
    why: takeaway(move.detail),
    list: steps(move.detail),
    snippets: snippetsFor(move, {
      name: brand.name,
      category: brand.category,
    }),
  }));

  // Oldest reading we hold, for "up 17 points since June" lines. History comes
  // back newest-first, so the tail is the earliest.
  const first = history[history.length - 1] ?? null;
  const delta =
    first && history.length > 1
      ? Math.round(snapshot.score - first.score)
      : null;

  return {
    data,
    verdict: verdictFor(snapshot.score),
    place: standing(data.competitors, brand.name),
    engines: engineStanding(data.engines),
    cites: citationStanding(data.citedSources),
    sources: data.citedSources ?? [],
    ideas: data.contentIdeas ?? [],
    sentiment: data.sentiment ?? null,
    sortedCompetitors: sorted,
    you,
    moves,
    anySnippets: moves.some((m) => m.snippets.length > 0),
    score: Math.round(snapshot.score),
    delta,
    since: first ? fmtShort(first.created_at) : null,
    measured: fmtLong(snapshot.created_at),
    /** Engines sorted best-first — every template shows this table. */
    engineRows: [...data.engines].sort((a, b) => b.score - a.score),
  };
}

export type Derived = ReturnType<typeof derive>;
export type Move = Derived["moves"][number];

/**
 * Splits the recommendations across as many pages as they need.
 *
 * Left to itself a long list of moves runs past the fold and the browser
 * spills it onto a sheet with no running head and no footer — a page that
 * looks like a printing accident in a document someone is handing to a client.
 * Paginating here means every sheet is composed.
 *
 * The rule is deliberately blunt so it is predictable: a move carrying a
 * paste-ready block is close to a full page on its own and gets one; anything
 * else pairs up.
 */
export function paginateMoves(moves: Move[], perPage = 2): Move[][] {
  const pages: Move[][] = [];
  let current: Move[] = [];

  for (const m of moves) {
    if (m.snippets.length > 0) {
      if (current.length) pages.push(current);
      pages.push([m]);
      current = [];
      continue;
    }
    current.push(m);
    if (current.length === perPage) {
      pages.push(current);
      current = [];
    }
  }
  if (current.length) pages.push(current);
  return pages;
}

export function fmtLong(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function fmtShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** `+4` / `−3` / `—`, with a real minus sign rather than a hyphen. */
export function signed(n: number | null): string {
  if (n === null) return "—";
  if (n === 0) return "0";
  return n > 0 ? `+${n}` : `−${Math.abs(n)}`;
}

export type SnippetEntry = { title: string; label: string; code: string };

/**
 * The paste-ready blocks, lifted out of the recommendations into an appendix.
 *
 * A single recommendation carrying two code blocks is close to a page and a
 * half, which pushed every portrait template past the fold. Splitting them out
 * also matches who reads what: the recommendation is for whoever decides, the
 * block is for whoever ships it, and they are rarely the same person.
 */
export function snippetPages(moves: Move[]): SnippetEntry[][] {
  const flat: SnippetEntry[] = moves.flatMap(({ move, snippets }) =>
    snippets.map((s) => ({ title: move.title, label: s.label, code: s.code })),
  );

  // Packed by how tall each block actually is rather than a fixed count: a
  // six-line robots.txt and a twenty-line JSON-LD are not the same page. The
  // budget is the usable height of a sheet expressed in code lines, measured
  // against the rendered templates rather than guessed.
  const BUDGET = 44;
  const cost = (s: SnippetEntry) => s.code.split("\n").length + 4; // + caption and frame

  const pages: SnippetEntry[][] = [];
  let current: SnippetEntry[] = [];
  let spent = 0;
  for (const s of flat) {
    const c = cost(s);
    if (current.length && spent + c > BUDGET) {
      pages.push(current);
      current = [];
      spent = 0;
    }
    current.push(s);
    spent += c;
  }
  if (current.length) pages.push(current);
  return pages;
}
