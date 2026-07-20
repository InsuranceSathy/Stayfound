import { analyzeVisibility, type AnalyzeOutput } from "@/lib/visibility";

export type ScoreSource = "self-hosted" | "cloud" | "sample";
export type ResolveOutput = AnalyzeOutput & { source: ScoreSource };

async function withTimeout(
  url: string,
  opts: RequestInit,
  ms: number,
): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal, cache: "no-store" });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Resolves a visibility score with graceful degradation:
 *   1. If a self-hosted scoring backend is configured AND reachable, use it.
 *   2. Otherwise fall back to the in-process cloud pipeline (Gemini / gateway).
 *   3. Which itself falls back to a sample estimate when no key is present.
 *
 * The self-hosted backend (e.g. your Mac via Cloudflare Tunnel) can be off at
 * any time — a fast health check keeps the fallback near-instant.
 */
export async function resolveVisibility(
  brand: string,
  category: string,
): Promise<ResolveOutput> {
  const base = process.env.SCORING_BACKEND_URL?.replace(/\/$/, "");
  const secret = process.env.SCORING_SECRET;

  if (base) {
    try {
      // Fast liveness check so an offline Mac fails over in ~2.5s, not 90s.
      const health = await withTimeout(
        `${base}/health`,
        { headers: { "ngrok-skip-browser-warning": "true" } },
        2500,
      );
      if (health.ok) {
        const res = await withTimeout(
          `${base}/score`,
          {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "ngrok-skip-browser-warning": "true",
              ...(secret ? { authorization: `Bearer ${secret}` } : {}),
            },
            body: JSON.stringify({ brand, category }),
          },
          90000,
        );
        if (res.ok) {
          const data = await res.json();
          if (data?.result) {
            return { live: !!data.live, result: data.result, source: "self-hosted" };
          }
        }
      }
    } catch (err) {
      console.warn(
        "[resolve] self-hosted scoring backend unavailable, falling back:",
        (err as Error).message,
      );
    }
  }

  const out = await analyzeVisibility(brand, category);
  return { ...out, source: out.live ? "cloud" : "sample" };
}
