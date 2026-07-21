import { generateText, generateObject } from "ai";
import { z } from "zod";
import type { VisibilityResult } from "@/lib/visibility";

/**
 * The real measurement pipeline.
 *
 * Two modes:
 *  - "gemini": direct Google Gemini API (free tier) — set GOOGLE_GENERATIVE_AI_API_KEY.
 *  - "gateway": Vercel AI Gateway multi-engine — set AI_GATEWAY_API_KEY / OIDC.
 *
 * 1. Discover the competitive set for the category.
 * 2. Run a prompt set against the engine(s).
 * 3. Detect brand + competitor mentions and their position in each answer.
 * 4. Aggregate into a position-weighted visibility score + share of voice.
 *
 * Throws on total failure; callers fall back to a sample estimate.
 */

const GEMINI_KEY =
  process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const MODE: "gemini" | "gateway" = GEMINI_KEY ? "gemini" : "gateway";

type EngineDef = { name: string; model: string; kind: "gemini" | "gateway" };

// Gateway "engines" (each a model routed through the Vercel AI Gateway).
const GATEWAY_ENGINES: EngineDef[] = [
  { name: "ChatGPT", model: "openai/gpt-4o-mini", kind: "gateway" },
  { name: "Gemini", model: "google/gemini-2.0-flash", kind: "gateway" },
  { name: "Claude", model: "anthropic/claude-haiku-4-5", kind: "gateway" },
];

function engines(): EngineDef[] {
  if (MODE === "gemini") {
    return [{ name: "Gemini", model: GEMINI_MODEL, kind: "gemini" }];
  }
  const raw = process.env.SURFACED_ENGINES;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as EngineDef[];
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch {
      /* use defaults */
    }
  }
  return GATEWAY_ENGINES;
}

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

const PROMPT_COUNT = Number(process.env.SCORING_PROMPTS || 8);

/** Direct Google Gemini call (free tier), no SDK provider package needed. */
async function callGemini(model: string, prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  if (!res.ok) throw new Error(`gemini ${res.status}`);
  const data = await res.json();
  return (
    data?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? "")
      .join("") ?? ""
  );
}

async function runEngine(engine: EngineDef, prompt: string): Promise<string> {
  const full = `${prompt}\n\nName specific products or brands.`;
  if (engine.kind === "gemini") return callGemini(engine.model, full);
  const { text } = await generateText({ model: engine.model, prompt: full });
  return text;
}

/** Earliest word-boundary index of `name` in `text`, or -1. */
function firstIndex(text: string, name: string): number {
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  try {
    const re = new RegExp(`(^|[^\\p{L}\\p{N}])(${esc})`, "iu");
    const m = re.exec(text);
    return m ? m.index + m[1].length : -1;
  } catch {
    return text.toLowerCase().indexOf(name.toLowerCase());
  }
}

/** Strip a trailing TLD so "corpsec.io" also matches "corpsec"/"CorpSec". */
function baseName(name: string): string {
  return name
    .replace(/\.(io|com|ai|co|app|dev|org|net|xyz|tech|so|inc|cloud)$/i, "")
    .trim();
}

/** Earliest index of a brand OR its name variants (domain-stripped). */
function matchIndex(text: string, name: string): number {
  const cands = new Set([name]);
  const b = baseName(name);
  if (b && b !== name) cands.add(b);
  let best = -1;
  for (const c of cands) {
    const i = firstIndex(text, c);
    if (i >= 0 && (best < 0 || i < best)) best = i;
  }
  return best;
}

async function discoverCompetitors(
  brand: string,
  category: string,
): Promise<string[]> {
  const promptText = `List up to 8 well-known brand or product names in the category "${category}" that a buyer would realistically compare. Reply with ONLY a comma-separated list of names. Include "${brand}" if it belongs in this category.`;

  const names = new Map<string, string>();
  const add = (n: string) => {
    const t = n.replace(/^[\d.\-*\s]+/, "").trim();
    if (t && t.length <= 40) names.set(t.toLowerCase(), t);
  };
  add(brand);

  try {
    if (MODE === "gemini") {
      const text = await callGemini(GEMINI_MODEL, promptText);
      text.split(/[,\n]/).forEach(add);
    } else {
      const { object } = await generateObject({
        model: process.env.SURFACED_DISCOVERY_MODEL || "anthropic/claude-haiku-4-5",
        schema: z.object({ brands: z.array(z.string()) }),
        prompt: promptText,
      });
      object.brands.forEach(add);
    }
  } catch {
    /* keep at least the brand */
  }
  return [...names.values()].slice(0, 9);
}

type Cell = {
  engine: string;
  prompt: string;
  text: string | null;
  ranks: Record<string, number>;
};

export async function measureVisibility(
  brand: string,
  category: string,
): Promise<{ live: boolean; result: VisibilityResult }> {
  const eng = engines();
  const prompts = PROMPT_TEMPLATES.slice(0, PROMPT_COUNT).map((t) => t(category));

  const brands = await discoverCompetitors(brand, category);
  const brandKey = brand.toLowerCase();
  if (!brands.some((b) => b.toLowerCase() === brandKey)) brands.unshift(brand);

  const cells: Cell[] = await Promise.all(
    eng.flatMap((e) =>
      prompts.map(async (p): Promise<Cell> => {
        try {
          const text = await runEngine(e, p);
          const found = brands
            .map((b) => ({ b, idx: matchIndex(text, b) }))
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
  if (valid.length === 0) throw new Error("All engine queries failed");

  const w = (rank?: number) => (rank ? 1 / rank : 0);
  const brandWeighted = valid.reduce((s, c) => s + w(c.ranks[brandKey]), 0);
  const visibility = (brandWeighted / valid.length) * 100;
  const appeared = valid.filter((c) => c.ranks[brandKey]).length;

  const engineNames = [...new Set(valid.map((c) => c.engine))];
  const engineStats = engineNames.map((name) => {
    const ec = valid.filter((c) => c.engine === name);
    const score = (ec.reduce((s, c) => s + w(c.ranks[brandKey]), 0) / ec.length) * 100;
    return { name, mentioned: score > 0, score: Math.round(score) };
  });

  const scoreByBrand = new Map<string, number>();
  for (const b of brands) scoreByBrand.set(b, 0);
  for (const c of valid)
    for (const b of brands)
      scoreByBrand.set(b, (scoreByBrand.get(b) || 0) + w(c.ranks[b.toLowerCase()]));
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

  const promptStats = prompts.map((p) => {
    const pc = valid.filter((c) => c.prompt === p);
    const hits = pc.filter((c) => c.ranks[brandKey]).length;
    return { prompt: p, hits, total: pc.length };
  });
  const absent = promptStats.filter((p) => p.total > 0 && p.hits === 0);
  const topRival = competitors.find((c) => !c.you);
  const weakest = [...engineStats].sort((a, b) => a.score - b.score)[0];
  const yourShare = competitors.find((c) => c.you)?.share ?? 0;

  const actions: VisibilityResult["actions"] = [];
  if (absent.length)
    actions.push({
      title: `You're invisible for ${absent.length} key ${absent.length === 1 ? "prompt" : "prompts"}`,
      detail: `No engine mentioned you for e.g. "${absent[0].prompt}". Publish content that answers it and earn citations in the sources those answers use.`,
      impact: "high",
    });
  if (topRival && topRival.share > yourShare)
    actions.push({
      title: `${topRival.name} is beating you on share of voice`,
      detail: `${topRival.name} holds ${topRival.share}% vs your ${yourShare}%. Study the answers they win and get into the sources cited there.`,
      impact: "high",
    });
  if (weakest && weakest.score < 50)
    actions.push({
      title: `Weakest on ${weakest.name}`,
      detail: `Your visibility on ${weakest.name} is ${weakest.score}%. Content structure and citations that engine favors lift this fastest.`,
      impact: "medium",
    });
  while (actions.length < 3)
    actions.push({
      title: "Tighten your category language",
      detail: `State plainly that you are ${category} in the exact words buyers use, so retrieval matches you.`,
      impact: "medium",
    });

  const summary = `${brand} appeared in ${appeared} of ${valid.length} AI answers we sampled across ${engineNames.length} engine(s) (${Math.round(
    visibility,
  )}% visibility). You rank #${rank} of ${competitors.length} for share of voice.`;

  const result = {
    score: Math.round(visibility),
    summary,
    engines: engineStats,
    competitors,
    actions: actions.slice(0, 3),
    meta: {
      method: "measured",
      mode: MODE,
      enginesQueried: engineNames,
      promptCount: prompts.length,
      cellsSampled: valid.length,
      cellsTotal: cells.length,
      prompts: promptStats,
    },
  };

  return { live: true, result: result as unknown as VisibilityResult };
}
