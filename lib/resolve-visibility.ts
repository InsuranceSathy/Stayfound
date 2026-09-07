import { analyzeVisibility, ResultSchema, type AnalyzeOutput } from "@/lib/visibility";
import { enrich } from "@/lib/enrich";
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
      // Liveness check. Generous timeout so a scaled-to-zero host (e.g. Railway)
      // has time to cold-start instead of falling back to a sample.
      const health = await withTimeout(
        `${base}/health`,
        { headers: { "ngrok-skip-browser-warning": "true" } },
        20000,
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
            // Validate at the boundary. Until now the backend's payload was
            // trusted whole and written straight to the database, so a shape
            // change there surfaced as a crash in a React component rather
            // than as a bad response — which is where it actually happened.
            const parsed = ResultSchema.safeParse(data.result);
            if (!parsed.success) {
              console.warn(
                "[resolve] backend payload rejected:",
                parsed.error.issues.slice(0, 3).map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
              );
              throw new Error("backend returned a payload we cannot read");
            }
            // A reading that measured nothing is not a reading. When the
            // backend has no credentials every assistant call fails, and it
            // still returns a well-formed payload: score 0, empty summary,
            // every answer flagged failed. That parses, so it used to be
            // stored as a successful scan — spending the visitor's one free
            // report to show them a zero. Treated as a backend failure so the
            // fallback scorer gets a turn.
            const m = parsed.data.meta as
              | { partial?: boolean; answersCollected?: number; answersFailed?: number }
              | undefined;
            const nothingMeasured =
              m?.partial === true &&
              (m.answersFailed ?? 0) > 0 &&
              (m.answersFailed ?? 0) >= (m.answersCollected ?? 0);
            if (nothingMeasured) {
              console.warn(
                `[resolve] backend measured nothing (${m?.answersFailed}/${m?.answersCollected} answers failed) — falling back`,
              );
              throw new Error("backend returned an empty measurement");
            }

            // Fills what is derivable from the payload itself — citation kinds,
            // shares, engine stats — so the newer dashboard panels work before
            // the backend starts sending them.
            return {
              live: data.live !== false,
              result: enrich(parsed.data, brand),
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
