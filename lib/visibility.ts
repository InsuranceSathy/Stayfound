import { z } from "zod";
import { measureVisibility } from "@/lib/measure";
import { enrich } from "@/lib/enrich";

export const ENGINES = ["ChatGPT", "Gemini", "Perplexity", "Claude"];

const ThemeSchema = z.object({
  theme: z.string(),
  quote: z.string(),
  /** Which assistant said it, which prompt drew it out, and the page it came
   *  from. Absent on v1 payloads. */
  engine: z.string().optional(),
  promptId: z.string().optional(),
  sourceUrl: z.string().nullish(),
});

const PromptSchema = z.object({
  id: z.string(),
  text: z.string(),
  topicId: z.string().nullish(),
  intent: z.string().optional(),
  weight: z.number().optional(),
});

/** One answer from one assistant to one prompt. The unit everything else in
 *  the dashboard is aggregated from. */
const AnswerSchema = z.object({
  promptId: z.string(),
  engine: z.string(),
  sample: z.number().optional(),
  askedAt: z.string().optional(),
  text: z.string().nullish(),
  /** Why this prompt produced no answer. Present only on a failed cell — it is
   *  the difference between "the assistant did not mention you" and "we never
   *  got an answer to read", which both otherwise arrive as a zero. */
  error: z.string().nullish(),
  mentioned: z.boolean(),
  /** Rank of the tracked brand inside the answer; null when absent. */
  position: z.number().nullish(),
  brands: z.array(z.object({ name: z.string(), position: z.number() })).optional(),
  citations: z
    .array(
      z.object({
        url: z.string().nullish(),
        domain: z.string(),
        position: z.number().optional(),
      }),
    )
    .optional(),
});

/** How the reading was taken. Without this the numbers cannot be defended on
 *  a sales call, which is the only place they are ever challenged. */
const MetaSchema = z.object({
  measuredAt: z.string().optional(),
  durationMs: z.number().optional(),
  samplesPerPrompt: z.number().optional(),
  answersCollected: z.number().optional(),
  // Either shape is accepted. Our own scorer has always written a plain list
  // of engine names here; v2 asks for the model behind each one, and a payload
  // that predates that must not fail validation over it.
  enginesQueried: z
    .union([
      z.array(z.string()),
      z.array(
        z.object({
          name: z.string(),
          model: z.string().optional(),
          grounded: z.boolean().optional(),
        }),
      ),
    ])
    .optional(),
}).passthrough();

export const ResultSchema = z.object({
  score: z.number().describe("Overall AI-search visibility for the brand, 0-100"),
  summary: z
    .string()
    .describe("One or two sentences on where the brand stands in AI answers"),
  engines: z
    .array(
      z.object({
        name: z.string(),
        mentioned: z.boolean(),
        score: z.number().describe("0-100 visibility on this engine"),
        // v2, all optional so a v1 payload still validates while the hosted
        // engine catches up.
        model: z.string().optional(),
        /** True when this engine was actually queried. False means the number
         *  is an estimate of an assistant we did not ask, which the UI must be
         *  able to say out loud. */
        measured: z.boolean().optional(),
        answers: z.number().optional(),
        mentionRate: z.number().optional(),
        avgPosition: z.number().nullish(),
        citationShare: z.number().nullish(),
      }),
    )
    .describe(`Presence across each of: ${ENGINES.join(", ")}`),
  competitors: z
    .array(
      z.object({
        name: z.string(),
        share: z.number().describe("Share of voice 0-100"),
        you: z.boolean().optional(),
        // `domain` is what makes a logo possible — a display name cannot be
        // turned back into a favicon.
        domain: z.string().nullish(),
        mentions: z.number().optional(),
        avgPosition: z.number().nullish(),
        engines: z.array(z.string()).optional(),
      }),
    )
    .describe(
      "Ranked share of voice. Include the user's brand with you:true, plus 4-5 real competitors.",
    ),
  actions: z
    .array(
      z.object({
        title: z.string(),
        detail: z.string(),
        impact: z.enum(["high", "medium", "low"]),
      }),
    )
    .describe("3 concrete, specific moves to improve visibility"),

  // The hosted scoring backend also returns sentiment, the sources AI answers
  // cite, and content ideas. They're stored on every snapshot, so type them —
  // optional, because the sample fallback and older snapshots predate them.
  sentiment: z
    .object({
      label: z.string(),
      positivePct: z.number(),
      negativePct: z.number(),
      // Attributed in v2. A quote in a client report with no engine, prompt
      // or source behind it is the first thing a competent buyer challenges.
      positiveThemes: z.array(ThemeSchema).optional(),
      negativeThemes: z.array(ThemeSchema).optional(),
    })
    .nullish(),
  citedSources: z
    .array(
      z.object({
        domain: z.string(),
        note: z.string(),
        isYou: z.boolean().optional(),
        // `share` turns a list into a ranking, `kind` turns it into a plan,
        // and `pages` is the drill-down.
        kind: z.string().optional(),
        share: z.number().nullish(),
        /** "counted" when the engine reported real frequencies, "even" when we
         *  split them flat because it did not. The UI must never describe an
         *  even split as a measured share. */
        shareBasis: z.enum(["counted", "even"]).optional(),
        citations: z.number().optional(),
        engines: z.array(z.string()).optional(),
        pages: z
          .array(
            z.object({
              url: z.string(),
              title: z.string().optional(),
              citations: z.number().optional(),
              share: z.number().nullish(),
            }),
          )
          .optional(),
      }),
    )
    .optional(),
  contentIdeas: z
    .array(
      z.object({
        type: z.string(),
        title: z.string(),
        description: z.string(),
        targetPromptIds: z.array(z.string()).optional(),
        modelledOn: z.array(z.string()).optional(),
      }),
    )
    .optional(),

  // -------------------------------------------------------------------- v2
  // The evidence the arrays above were summarised from. Per-prompt visibility,
  // average position, answer export and the prompts table are all derived from
  // `answers`, and none of them are possible without it.
  version: z.number().optional(),
  meta: MetaSchema.optional(),
  topics: z.array(z.object({ id: z.string(), name: z.string() })).optional(),
  prompts: z.array(PromptSchema).optional(),
  answers: z.array(AnswerSchema).optional(),
  citationTypes: z
    .array(
      z.object({
        kind: z.string(),
        label: z.string().optional(),
        share: z.number(),
      }),
    )
    .optional(),
});

export type VisibilityResult = z.infer<typeof ResultSchema>;

// Deterministic per-brand fallback so the product works without an API key.
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function sampleResult(brand: string, category: string): VisibilityResult {
  const h = hash(brand.toLowerCase() + "|" + category.toLowerCase());
  const score = 28 + (h % 46); // 28-73
  const pick = (seed: number, lo: number, hi: number) =>
    lo + ((h >> seed) % (hi - lo));

  const generic = ["Acme", "Northwind", "Lumen", "Vertex", "Brightline", "Cobalt"];
  const comps = generic
    .map((n, i) => ({ name: n, share: 30 + ((h >> (i * 2)) % 45) }))
    .sort((a, b) => b.share - a.share)
    .slice(0, 4);

  const competitors = [{ name: brand, share: score, you: true }, ...comps].sort(
    (a, b) => b.share - a.share,
  );

  return {
    score,
    summary: `${brand} shows partial presence in AI answers for "${category}". You're cited in some responses but lose the top recommendation to competitors on key buying-intent prompts.`,
    engines: ENGINES.map((name, i) => {
      const s = Math.max(0, Math.min(100, score + pick(i + 1, -18, 18)));
      return { name, mentioned: s > 35, score: s };
    }),
    competitors,
    actions: [
      {
        title: "Win the comparison prompts",
        detail: `Publish a clear, factual "${brand} vs. alternatives" page — AI assistants lean on comparison content when ranking options in ${category}.`,
        impact: "high",
      },
      {
        title: "Earn third-party citations",
        detail:
          "Get listed in the roundup articles and review sites the engines already cite. These sources drive most AI recommendations.",
        impact: "high",
      },
      {
        title: "Tighten your category language",
        detail: `Make sure your site states plainly what you do in the exact terms buyers use for "${category}", so retrieval matches you.`,
        impact: "medium",
      },
    ],
  };
}

import type { ScanCell } from "@/lib/metrics";

export type AnalyzeOutput = {
  live: boolean;
  result: VisibilityResult;
  /** The per-answer grid, when the local scorer produced it. The hosted
   *  scorer reports aggregates only, so this is absent there. */
  cells?: ScanCell[];
};

export async function analyzeVisibility(
  brand: string,
  category: string,
): Promise<AnalyzeOutput> {
  const hasKey =
    !!process.env.GLM_API_KEY ||
    !!process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    !!process.env.GEMINI_API_KEY ||
    !!process.env.AI_GATEWAY_API_KEY ||
    !!process.env.VERCEL_OIDC_TOKEN;

  if (!hasKey) return { live: false, result: sampleResult(brand, category) };

  try {
    // Real measurement: query multiple engines and detect actual mentions.
    const out = await measureVisibility(brand, category);
    // Same derivations the hosted path gets — citation kinds, shares, the
    // types breakdown — so both scorers produce the same shape.
    return { ...out, result: enrich(out.result, brand) };
  } catch (err) {
    console.error("Measurement failed, using sample:", err);
    return { live: false, result: sampleResult(brand, category) };
  }
}
