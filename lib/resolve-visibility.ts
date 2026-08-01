import { analyzeVisibility, type AnalyzeOutput } from "@/lib/visibility";
import { getDemoReport } from "@/lib/demo-fixtures";
import type { VisibilityResult } from "@/lib/visibility";

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
  // Demo fixtures win everywhere (public check + dashboard) so the numbers
  // are identical across surfaces.
  const demo = getDemoReport(brand);
  if (demo) {
    return {
      live: true,
      result: demo as unknown as VisibilityResult,
      source: "cloud",
    };
  }

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
          240000, // web-grounded scans take ~100-120s
        );
        if (res.ok) {
          const data = await res.json();
          if (data?.result) {
            // A real result from the scoring backend is a live measurement.
            return {
              live: data.live !== false,
              result: data.result,
              source: "self-hosted",
            };
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
