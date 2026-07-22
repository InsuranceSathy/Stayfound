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

// GLM (Zhipu / z.ai) — OpenAI-compatible. glm-4.5-flash is free.
const GLM_KEY = process.env.GLM_API_KEY || "";
const GLM_BASE = process.env.GLM_BASE_URL || "https://api.z.ai/api/paas/v4";
const GLM_MODEL = process.env.GLM_MODEL || "glm-4.5-flash";

const MODE: "glm" | "gemini" | "gateway" = GLM_KEY
  ? "glm"
  : GEMINI_KEY
    ? "gemini"
    : "gateway";

type EngineDef = {
  name: string;
  model: string;
  kind: "gemini" | "gateway" | "glm";
};

// Gateway "engines" (each a model routed through the Vercel AI Gateway).
const GATEWAY_ENGINES: EngineDef[] = [
  { name: "ChatGPT", model: "openai/gpt-4o-mini", kind: "gateway" },
  { name: "Gemini", model: "google/gemini-2.0-flash", kind: "gateway" },
  { name: "Claude", model: "anthropic/claude-haiku-4-5", kind: "gateway" },
];

function engines(): EngineDef[] {
  if (MODE === "glm") {
    return [{ name: "GLM", model: GLM_MODEL, kind: "glm" }];
  }
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

// Buyer prompts weighted by intent — high-intent "which should I buy" queries
// count more toward the visibility score than generic awareness ones.
type PromptDef = { q: (c: string) => string; w: number };
const PROMPTS: PromptDef[] = [
  { q: (c) => `What are the best ${c}?`, w: 1.0 },
  { q: (c) => `What is the best ${c} for a startup, and why?`, w: 1.3 },
  { q: (c) => `Best ${c} for a small business?`, w: 1.2 },
  { q: (c) => `Which ${c} should I buy in 2026?`, w: 1.3 },
  { q: (c) => `What are the top alternatives for ${c}?`, w: 1.1 },
  { q: (c) => `Can you recommend a good ${c}?`, w: 1.0 },
  { q: (c) => `What is the most popular ${c} right now?`, w: 0.9 },
  { q: (c) => `Which ${c} do experts recommend?`, w: 0.9 },
];

const PROMPT_COUNT = Number(process.env.SCORING_PROMPTS || PROMPTS.length);
// Samples per prompt — averaging smooths LLM run-to-run variance.
const SAMPLES = Number(process.env.SCORING_SAMPLES || (MODE === "glm" ? 2 : 3));

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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Direct GLM (z.ai) call — OpenAI-compatible, with rate-limit backoff. */
async function callGLM(
  model: string,
  prompt: string,
  attempt = 0,
  maxTokens = 300,
): Promise<string> {
  const res = await fetch(`${GLM_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${GLM_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
      thinking: { type: "disabled" },
    }),
  });
  const data = await res.json().catch(() => null);
  const rateLimited = res.status === 429 || data?.error?.code === "1302";
  if (rateLimited && attempt < 3) {
    await sleep(3500 * (attempt + 1));
    return callGLM(model, prompt, attempt + 1, maxTokens);
  }
  if (!res.ok || data?.error) throw new Error(`glm ${data?.error?.code || res.status}`);
  return data?.choices?.[0]?.message?.content ?? "";
}

/** Run tasks with bounded concurrency (rate-limit friendly). */
async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker),
  );
  return results;
}

async function runEngine(engine: EngineDef, prompt: string): Promise<string> {
  const full = `${prompt}\n\nName specific products or brands.`;
  if (engine.kind === "glm") return callGLM(engine.model, full);
  if (engine.kind === "gemini") return callGemini(engine.model, full);
  const { text } = await generateText({ model: engine.model, prompt: full });
  return text;
}

/** Raw single call to the active engine (no prompt suffix). */
export async function askModel(prompt: string, maxTokens = 300): Promise<string> {
  if (MODE === "glm") return callGLM(GLM_MODEL, prompt, 0, maxTokens);
  if (MODE === "gemini") return callGemini(GEMINI_MODEL, prompt);
  const { text } = await generateText({ model: GATEWAY_ENGINES[0].model, prompt });
  return text;
}

type Sentiment = "positive" | "neutral" | "negative" | "unknown";

export type Insights = {
  sentiment: {
    label: Sentiment;
    positivePct: number;
    negativePct: number;
    positiveThemes: { theme: string; quote: string }[];
    negativeThemes: { theme: string; quote: string }[];
  };
  contentIdeas: { type: string; title: string; description: string }[];
  citedSources: { domain: string; note: string; isYou?: boolean }[];
};

function parseJsonLoose(raw: string): unknown {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end < 0) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
}

/** One analysis pass over the collected answers → sentiment + content ideas. */
async function analyzeInsights(
  brand: string,
  category: string,
  answers: string[],
): Promise<Insights | null> {
  if (!answers.length) return null;
  const corpus = answers.join("\n---\n").slice(0, 6000);
  const prompt = `You analyze how AI assistants answer buyer questions about "${category}". Below are real AI answers. Brand in focus: "${brand}".

Return ONLY valid JSON (no markdown fences), exactly this shape:
{"sentiment":{"label":"positive|neutral|negative","positivePct":0,"negativePct":0,"positiveThemes":[{"theme":"short phrase","quote":"<=120 char quote from the answers"}],"negativeThemes":[{"theme":"short phrase","quote":"<=120 char quote"}]},"contentIdeas":[{"type":"Listicle|Problem Solution|Year Specific|Comparison|How-to","title":"compelling blog title","description":"one sentence on why it boosts AI visibility"}],"citedSources":[{"domain":"example.com","note":"why AI answers rely on it","isYou":false}]}

Rules: 2-4 themes per side (empty array if none). positivePct+negativePct should sum to ~100. Give 4-5 contentIdeas tailored to helping "${brand}" get cited in "${category}" answers. For citedSources, list 5-7 websites/domains that AI answers about "${category}" typically rely on (review sites, docs, Reddit, industry publications, listicles); set isYou:true only if a domain clearly belongs to "${brand}". If "${brand}" is barely mentioned, say so via low positivePct and make ideas about earning citations.

ANSWERS:
${corpus}`;
  try {
    const parsed = parseJsonLoose(await askModel(prompt, 1500)) as Insights | null;
    if (!parsed?.sentiment) return null;
    return parsed;
  } catch {
    return null;
  }
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
  const promptText = `List up to 12 well-known brand or product names in the category "${category}" that a buyer would realistically compare. Reply with ONLY a comma-separated list of names. Include "${brand}" if it belongs in this category.`;

  const names = new Map<string, string>();
  const add = (n: string) => {
    const t = n.replace(/^[\d.\-*\s]+/, "").trim();
    if (t && t.length <= 40) names.set(t.toLowerCase(), t);
  };
  add(brand);

  try {
    if (MODE === "glm") {
      const text = await callGLM(GLM_MODEL, promptText);
      text.split(/[,\n]/).forEach(add);
    } else if (MODE === "gemini") {
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
  return [...names.values()].slice(0, 13);
}

type Cell = {
  engine: string;
  prompt: string;
  weight: number;
  text: string | null;
  ranks: Record<string, number>;
};

export async function measureVisibility(
  brand: string,
  category: string,
): Promise<{ live: boolean; result: VisibilityResult }> {
  const eng = engines();
  // GLM free tier is rate-limited — cap prompts and use light concurrency +
  // backoff. Cloud/gateway engines can fan out fully.
  const promptCount = MODE === "glm" ? 6 : PROMPT_COUNT;
  const concurrency = MODE === "glm" ? 2 : 8;
  const prompts = PROMPTS.slice(0, promptCount).map((p) => ({
    text: p.q(category),
    w: p.w,
  }));

  const brands = await discoverCompetitors(brand, category);
  const brandKey = brand.toLowerCase();
  if (!brands.some((b) => b.toLowerCase() === brandKey)) brands.unshift(brand);

  // Each prompt is sampled SAMPLES times per engine to smooth variance.
  const tasks = eng.flatMap((e) =>
    prompts.flatMap((p) =>
      Array.from({ length: SAMPLES }, () => ({ e, p })),
    ),
  );
  const cells: Cell[] = await mapLimit(tasks, concurrency, async ({ e, p }) => {
    try {
      const text = await runEngine(e, p.text);
      const found = brands
        .map((b) => ({ b, idx: matchIndex(text, b) }))
        .filter((x) => x.idx >= 0)
        .sort((a, b) => a.idx - b.idx);
      const ranks: Record<string, number> = {};
      found.forEach((f, i) => (ranks[f.b.toLowerCase()] = i + 1));
      return { engine: e.name, prompt: p.text, weight: p.w, text, ranks };
    } catch {
      return { engine: e.name, prompt: p.text, weight: p.w, text: null, ranks: {} };
    }
  });

  const valid = cells.filter((c) => c.text !== null);
  if (valid.length === 0) throw new Error("All engine queries failed");

  // Position weight (rank 1 = 1.0, rank 2 = 0.5 …) x prompt intent weight.
  const pos = (rank?: number) => (rank ? 1 / rank : 0);
  const totalWeight = valid.reduce((s, c) => s + c.weight, 0) || 1;
  const brandWeighted = valid.reduce(
    (s, c) => s + c.weight * pos(c.ranks[brandKey]),
    0,
  );
  const visibility = (brandWeighted / totalWeight) * 100;
  const appeared = valid.filter((c) => c.ranks[brandKey]).length;

  const engineNames = [...new Set(valid.map((c) => c.engine))];
  const engineStats = engineNames.map((name) => {
    const ec = valid.filter((c) => c.engine === name);
    const wSum = ec.reduce((s, c) => s + c.weight, 0) || 1;
    const score =
      (ec.reduce((s, c) => s + c.weight * pos(c.ranks[brandKey]), 0) / wSum) * 100;
    return { name, mentioned: score > 0, score: Math.round(score) };
  });

  const scoreByBrand = new Map<string, number>();
  for (const b of brands) scoreByBrand.set(b, 0);
  for (const c of valid)
    for (const b of brands)
      scoreByBrand.set(
        b,
        (scoreByBrand.get(b) || 0) + c.weight * pos(c.ranks[b.toLowerCase()]),
      );
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
    const pc = valid.filter((c) => c.prompt === p.text);
    const hits = pc.filter((c) => c.ranks[brandKey]).length;
    return { prompt: p.text, hits, total: pc.length };
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

  // One analysis pass → rich sentiment (themes + quotes) and content ideas.
  const answerTexts = valid
    .map((c) => c.text as string)
    .filter(Boolean)
    .slice(0, 8);
  const insights = await analyzeInsights(brand, category, answerTexts);
  const sentiment = insights?.sentiment.label ?? "unknown";
  const sentimentFactor =
    sentiment === "negative" ? 0.7 : sentiment === "neutral" ? 0.95 : 1.0;
  const score = Math.round(visibility * sentimentFactor);

  const sentimentPhrase =
    sentiment === "unknown"
      ? ""
      : ` When you appear, AI describes you as ${sentiment}.`;
  const summary = `${brand} appeared in ${appeared} of ${valid.length} AI answers across ${SAMPLES} samples (${score}% visibility). You rank #${rank} of ${competitors.length} for share of voice.${sentimentPhrase}`;

  const result = {
    score,
    summary,
    engines: engineStats,
    competitors,
    actions: actions.slice(0, 3),
    sentiment: insights?.sentiment ?? null,
    contentIdeas: insights?.contentIdeas ?? [],
    citedSources: insights?.citedSources ?? [],
    meta: {
      method: "measured",
      mode: MODE,
      sentiment,
      samples: SAMPLES,
      enginesQueried: engineNames,
      promptCount: prompts.length,
      cellsSampled: valid.length,
      cellsTotal: cells.length,
      prompts: promptStats,
    },
  };

  return { live: true, result: result as unknown as VisibilityResult };
}
