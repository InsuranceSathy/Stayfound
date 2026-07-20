import { generateText, generateObject } from "ai";
import { z } from "zod";
import type { VisibilityResult } from "@/lib/visibility";

/**
 * The real measurement pipeline.
 *
 * 1. Discover the competitive set for the category.
 * 2. Run a prompt set against multiple AI engines (models via the AI Gateway).
 * 3. Detect brand + competitor mentions and their position in each answer.
 * 4. Aggregate into a position-weighted visibility score + share of voice.
 *
 * Throws on total failure; callers fall back to a sample estimate.
 */

type EngineDef = { name: string; model: string };

// Each "engine" is a model routed through the Vercel AI Gateway.
const DEFAULT_ENGINES: EngineDef[] = [
  { name: "ChatGPT", model: "openai/gpt-4o-mini" },
  { name: "Gemini", model: "google/gemini-2.0-flash" },
  { name: "Claude", model: "anthropic/claude-haiku-4-5" },
];

function engines(): EngineDef[] {
  const raw = process.env.SURFACED_ENGINES;
  if (!raw) return DEFAULT_ENGINES;
  try {
    const parsed = JSON.parse(raw) as EngineDef[];
    if (Array.isArray(parsed) && parsed.length) return parsed;
  } catch {
    /* ignore, use defaults */
  }
  return DEFAULT_ENGINES;
}

const DISCOVERY_MODEL =
  process.env.SURFACED_DISCOVERY_MODEL || "anthropic/claude-haiku-4-5";

const PROMPT_TEMPLATES: ((c: string) => string)[] = [
  (c) => `What are the best ${c}?`,
  (c) => `Can you recommend a good ${c}?`,
  (c) => `What is the most popular ${c} right now?`,
  (c) => `Best ${c} for a small business?`,
  (c) => `Best ${c} for startups?`,
  (c) => `What are the top alternatives for ${c}?`,
  (c) => `Which ${c} do experts recommend?`,
  (c) => `What ${c} should I use?`,
];

/** Earliest word-boundary index of `name` in `text`, or -1. */
function firstIndex(text: string, name: string): number {
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  try {
    const re = new RegExp(`(^|[^\\p{L}\\p{N}])(${esc})`, "iu");
    const m = re.exec(text);
    return m ? m.index + m[1].length : -1;
  } catch {
    const i = text.toLowerCase().indexOf(name.toLowerCase());
    return i;
  }
}

async function discoverCompetitors(
  brand: string,
  category: string,
): Promise<string[]> {
  const { object } = await generateObject({
    model: DISCOVERY_MODEL,
    schema: z.object({
      brands: z
        .array(z.string())
        .describe("Distinct brand/product names, no descriptions"),
    }),
    prompt: `List up to 8 well-known brand or product names in the category "${category}" that a buyer would realistically compare. Return names only (e.g. "Notion"), most prominent first. Include "${brand}" if it belongs in this category.`,
  });

  const names = new Map<string, string>();
  const add = (n: string) => {
    const t = n.trim();
    if (t && t.length <= 40) names.set(t.toLowerCase(), t);
  };
  add(brand);
  object.brands.forEach(add);
  return [...names.values()].slice(0, 9);
}

type Cell = {
  engine: string;
  prompt: string;
  text: string | null;
  ranks: Record<string, number>; // brand(lowercased) -> 1-based position
};

export async function measureVisibility(
  brand: string,
  category: string,
): Promise<{ live: boolean; result: VisibilityResult }> {
  const eng = engines();
  const prompts = PROMPT_TEMPLATES.map((t) => t(category));

  const brands = await discoverCompetitors(brand, category);
  const brandKey = brand.toLowerCase();
  if (!brands.some((b) => b.toLowerCase() === brandKey)) brands.unshift(brand);

  // Query every (engine, prompt) cell concurrently.
  const cells: Cell[] = await Promise.all(
    eng.flatMap((e) =>
      prompts.map(async (p): Promise<Cell> => {
        try {
          const { text } = await generateText({
            model: e.model,
            prompt: `${p}\n\nName specific products or brands.`,
          });
          const found = brands
            .map((b) => ({ b, idx: firstIndex(text, b) }))
            .filter((x) => x.idx >= 0)
            .sort((a, b) => a.idx - b.idx);
          const ranks: Record<string, number> = {};
          found.forEach((f, i) => (ranks[f.b.toLowerCase()] = i + 1));
          return { engine: e.name, prompt: p, text, ranks };
        } catch {
          return { engine: e.name, prompt: p, text: null, ranks: {} };
        }
      }),
    ),
  );

  const valid = cells.filter((c) => c.text !== null);
  if (valid.length === 0) {
    throw new Error("All engine queries failed");
  }

  // Position weight: rank 1 -> 1.0, rank 2 -> 0.5, ...
  const w = (rank?: number) => (rank ? 1 / rank : 0);

  // Overall + per-engine visibility for the tracked brand.
  const brandWeighted = valid.reduce((s, c) => s + w(c.ranks[brandKey]), 0);
  const visibility = (brandWeighted / valid.length) * 100;
  const appeared = valid.filter((c) => c.ranks[brandKey]).length;

  const engineNames = [...new Set(valid.map((c) => c.engine))];
  const engineStats = engineNames.map((name) => {
    const ec = valid.filter((c) => c.engine === name);
    const score = (ec.reduce((s, c) => s + w(c.ranks[brandKey]), 0) / ec.length) * 100;
    return { name, mentioned: score > 0, score: Math.round(score) };
  });

  // Share of voice across the full competitive set (position-weighted).
  const scoreByBrand = new Map<string, number>();
  for (const b of brands) scoreByBrand.set(b, 0);
  for (const c of valid) {
    for (const b of brands) {
      scoreByBrand.set(b, (scoreByBrand.get(b) || 0) + w(c.ranks[b.toLowerCase()]));
    }
  }
  const totalScore = [...scoreByBrand.values()].reduce((a, b) => a + b, 0) || 1;
  const competitors = brands
    .map((b) => ({
      name: b,
      share: Math.round(((scoreByBrand.get(b) || 0) / totalScore) * 1000) / 10,
      you: b.toLowerCase() === brandKey,
    }))
    .filter((c) => c.share > 0 || c.you)
    .sort((a, b) => b.share - a.share);

  const rank = competitors.findIndex((c) => c.you) + 1;

  // Prompts you're absent from (no engine mentioned you).
  const promptStats = prompts.map((p) => {
    const pc = valid.filter((c) => c.prompt === p);
    const hits = pc.filter((c) => c.ranks[brandKey]).length;
    return { prompt: p, hits, total: pc.length };
  });
  const absent = promptStats.filter((p) => p.total > 0 && p.hits === 0);

  const topRival = competitors.find((c) => !c.you);
  const weakest = [...engineStats].sort((a, b) => a.score - b.score)[0];

  // Data-driven recommended actions.
  const actions: VisibilityResult["actions"] = [];
  if (absent.length) {
    actions.push({
      title: `You're invisible for ${absent.length} key ${absent.length === 1 ? "prompt" : "prompts"}`,
      detail: `No engine mentioned you for e.g. "${absent[0].prompt}". Publish content that directly answers it — and earn citations in the sources those answers pull from.`,
      impact: "high",
    });
  }
  if (topRival && topRival.share > (competitors.find((c) => c.you)?.share ?? 0)) {
    actions.push({
      title: `${topRival.name} is beating you on share of voice`,
      detail: `${topRival.name} holds ${topRival.share}% vs your ${
        competitors.find((c) => c.you)?.share ?? 0
      }%. Study the answers they win and get listed in the third-party sources those answers cite.`,
      impact: "high",
    });
  }
  if (weakest && weakest.score < 50) {
    actions.push({
      title: `Weakest on ${weakest.name}`,
      detail: `Your visibility on ${weakest.name} is ${weakest.score}%. Content structure and citations that engine favors will lift this fastest.`,
      impact: "medium",
    });
  }
  while (actions.length < 3) {
    actions.push({
      title: "Tighten your category language",
      detail: `State plainly that you are ${category} in the exact words buyers use, so retrieval matches you.`,
      impact: "medium",
    });
  }

  const summary = `${brand} appeared in ${appeared} of ${valid.length} AI answers we sampled across ${engineNames.length} engines (${Math.round(
    visibility,
  )}% visibility). You rank #${rank} of ${competitors.length} for share of voice.`;

  const result = {
    score: Math.round(visibility),
    summary,
    engines: engineStats,
    competitors,
    actions: actions.slice(0, 3),
    // Extra measurement metadata (persisted in JSONB for richer views later).
    meta: {
      method: "measured",
      enginesQueried: engineNames,
      promptCount: prompts.length,
      cellsSampled: valid.length,
      cellsTotal: cells.length,
      prompts: promptStats,
    },
  };

  return { live: true, result: result as unknown as VisibilityResult };
}
