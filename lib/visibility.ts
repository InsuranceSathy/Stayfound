import { z } from "zod";
import { measureVisibility } from "@/lib/measure";

export const ENGINES = ["ChatGPT", "Gemini", "Perplexity", "Claude"];

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
      }),
    )
    .describe(`Presence across each of: ${ENGINES.join(", ")}`),
  competitors: z
    .array(
      z.object({
        name: z.string(),
        share: z.number().describe("Share of voice 0-100"),
        you: z.boolean().optional(),
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
      positiveThemes: z
        .array(z.object({ theme: z.string(), quote: z.string() }))
        .optional(),
      negativeThemes: z
        .array(z.object({ theme: z.string(), quote: z.string() }))
        .optional(),
    })
    .nullish(),
  citedSources: z
    .array(
      z.object({
        domain: z.string(),
        note: z.string(),
        isYou: z.boolean().optional(),
      }),
    )
    .optional(),
  contentIdeas: z
    .array(
      z.object({
        type: z.string(),
        title: z.string(),
        description: z.string(),
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

export type AnalyzeOutput = { live: boolean; result: VisibilityResult };

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
    return await measureVisibility(brand, category);
  } catch (err) {
    console.error("Measurement failed, using sample:", err);
    return { live: false, result: sampleResult(brand, category) };
  }
}
