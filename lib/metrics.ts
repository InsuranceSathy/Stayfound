import { pool } from "@/lib/db";
import { ensureSchema } from "@/lib/queries";
import type { VisibilityResult } from "@/lib/visibility";
import { citationKind } from "@/lib/citation-kind";

/**
 * The rows behind the dashboard.
 *
 * `visibility_snapshot` holds one aggregated blob per scan, which answers "how
 * are we doing" and nothing else. Everything here exists to answer the other
 * shape of question — per prompt, per engine, per day, versus last week — which
 * is only possible once the grid a scan computes is written down rather than
 * summarised and dropped.
 *
 * Two things fill these tables:
 *   - `recordScan`, on every new reading, going forward;
 *   - `backfillDaily`, once, from the snapshots already stored, so the charts
 *     have a history on the day this ships instead of in a month's time.
 */

const domainOf = (s: string) =>
  s.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];

/**
 * Turns a v2 payload's `answers[]` into the cell shape the rest of this file
 * works in. Returns empty for a v1 payload, which is the signal to fall back to
 * whatever the scorer threaded through separately.
 */
function answersToCells(result: VisibilityResult): ScanCell[] {
  const answers = result.answers ?? [];
  if (!answers.length) return [];
  const textFor = new Map((result.prompts ?? []).map((p) => [p.id, p.text]));
  return answers.map((a) => ({
    engine: a.engine,
    prompt: textFor.get(a.promptId) ?? a.promptId,
    position: a.position ?? null,
    text: a.text ?? null,
    mentions: (a.brands ?? []).map((b) => ({ name: b.name, position: b.position })),
  }));
}

/* ------------------------------------------------------------------ writes */

/** A cell as `measureVisibility` produces it: one answer from one engine. */
export type ScanCell = {
  engine: string;
  prompt: string;
  /** Position of the tracked brand in the answer, or null if absent. */
  position: number | null;
  /** The answer itself. The receipt — null when the call failed. */
  text: string | null;
  /** Everyone else found in the answer, in the order they appeared. */
  mentions?: { name: string; position: number }[];
};

/**
 * Makes sure every prompt in a scan exists as a row, and hands back the ids.
 *
 * Upsert rather than insert: prompts are stable across scans, and the point of
 * the table is that a customer can eventually edit them. `DO UPDATE` on the
 * conflict is what lets `RETURNING` report an id for rows that already existed —
 * `DO NOTHING` returns nothing for those and the map comes back half empty.
 */
export async function ensurePrompts(
  brandId: string,
  texts: string[],
): Promise<Map<string, string>> {
  await ensureSchema();
  const out = new Map<string, string>();
  const unique = [...new Set(texts.map((t) => t.trim()).filter(Boolean))];
  if (!unique.length) return out;

  const { rows } = await pool.query<{ id: string; text: string }>(
    `INSERT INTO prompt (brand_id, text)
     SELECT $1, t FROM unnest($2::text[]) AS t
     ON CONFLICT (brand_id, text) DO UPDATE SET text = EXCLUDED.text
     RETURNING id, text`,
    [brandId, unique],
  );
  for (const r of rows) out.set(r.text, r.id);
  return out;
}

/**
 * Writes one reading: the per-answer grid, who else was mentioned, the cited
 * domains, and the day's rollup.
 *
 * Best-effort by design. A scan that succeeded must not be lost because a
 * metrics insert failed, so every caller treats a throw here as cosmetic.
 */
export async function recordScan(opts: {
  brandId: string;
  snapshotId: string;
  brandName: string;
  result: VisibilityResult;
  cells?: ScanCell[];
}): Promise<void> {
  await ensureSchema();
  const { brandId, snapshotId, brandName, result, cells } = opts;

  // A v2 payload carries the grid itself. Prefer it over the separately
  // threaded `cells`, so the day the hosted engine starts sending `answers[]`
  // the prompt-level tables fill in without another change here.
  const fromPayload = answersToCells(result);
  const grid = fromPayload.length ? fromPayload : (cells ?? []);

  const promptIds = grid.length
    ? await ensurePrompts(brandId, grid.map((c) => c.prompt))
    : new Map<string, string>();

  if (grid.length) {
    // Samples of the same prompt on the same engine are numbered so the grid
    // stays addressable: without it, three samples look like one row written
    // three times.
    const seen = new Map<string, number>();
    for (const c of grid) {
      const k = `${c.engine}|${c.prompt}`;
      const n = (seen.get(k) ?? 0) + 1;
      seen.set(k, n);
      const { rows } = await pool.query<{ id: string }>(
        `INSERT INTO answer_cell
           (brand_id, snapshot_id, prompt_id, engine, sample_no, mentioned, position, answer_text)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [
          brandId,
          snapshotId,
          promptIds.get(c.prompt.trim()) ?? null,
          c.engine,
          n,
          c.position !== null,
          c.position,
          c.text ? c.text.slice(0, 4000) : null,
        ],
      );
      for (const m of c.mentions ?? []) {
        await pool.query(
          `INSERT INTO cell_mention (cell_id, brand_name, position) VALUES ($1,$2,$3)
           ON CONFLICT (cell_id, brand_name) DO NOTHING`,
          [rows[0].id, m.name, m.position],
        );
      }
    }
  } else {
    // The hosted scorer reports per-engine totals without saying which prompt
    // produced them. One row per engine still supports the Platforms tab and
    // the engine series; it just cannot support the Prompts tab.
    for (const e of result.engines) {
      await pool.query(
        `INSERT INTO answer_cell (brand_id, snapshot_id, engine, mentioned, position)
         VALUES ($1,$2,$3,$4,NULL)`,
        [brandId, snapshotId, e.name, e.mentioned],
      );
    }
  }

  await recordCitations(brandId, result, undefined, brandName);
  await rollupDay(brandId, brandName, result, grid);
}

async function recordCitations(
  brandId: string,
  result: VisibilityResult,
  day?: string,
  brandName = "",
) {
  const sources = result.citedSources ?? [];
  if (!sources.length) return;
  const when = day ?? new Date().toISOString().slice(0, 10);
  // One row per source per day. Re-running a scan on the same day replaces the
  // day's rows rather than doubling them.
  await pool.query(
    `DELETE FROM cell_citation WHERE brand_id = $1 AND day = $2`,
    [brandId, when],
  );
  for (const s of sources) {
    await pool.query(
      `INSERT INTO cell_citation (brand_id, day, url, domain, is_owned, kind, note)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        brandId,
        when,
        s.pages?.[0]?.url ?? (s.domain.includes("/") ? s.domain : null),
        domainOf(s.domain),
        !!s.isYou,
        // Classified at write time so the breakdown is a GROUP BY rather than
        // a pass over every row on every page load.
        s.kind ?? (s.isYou ? "own" : citationKind(s.domain, [brandName])),
        s.note ?? null,
      ],
    );
  }
}

/** The single row per brand per day that every chart reads. */
export async function rollupDay(
  brandId: string,
  brandName: string,
  result: VisibilityResult,
  cells?: ScanCell[],
  day?: string,
): Promise<void> {
  await ensureSchema();
  const when = day ?? new Date().toISOString().slice(0, 10);

  const mine = findMine(result, brandName);
  const share = mine?.share ?? null;
  const cites = result.citedSources ?? [];
  const citationShare = cites.length
    ? Math.round((cites.filter((c) => c.isYou).length / cites.length) * 1000) / 10
    : null;

  const positions = (cells ?? [])
    .map((c) => c.position)
    .filter((p): p is number => typeof p === "number");
  const avgPos = positions.length
    ? Math.round((positions.reduce((a, b) => a + b, 0) / positions.length) * 100) / 100
    : null;

  await upsertMetric({
    brandId, day: when, engine: null,
    visibility: result.score, share, avgPos, citationShare,
    answers: cells?.length ?? result.engines.length,
  });

  // A row per engine as well, so the Platforms tab and per-engine series are a
  // filter on the same table rather than a different query.
  for (const e of result.engines) {
    const own = (cells ?? []).filter((c) => c.engine === e.name);
    const p = own.map((c) => c.position).filter((x): x is number => typeof x === "number");
    await upsertMetric({
      brandId, day: when, engine: e.name,
      visibility: e.score, share: null,
      avgPos: p.length ? Math.round((p.reduce((a, b) => a + b, 0) / p.length) * 100) / 100 : null,
      citationShare: null,
      answers: own.length || 1,
    });
  }
}

async function upsertMetric(m: {
  brandId: string; day: string; engine: string | null;
  visibility: number; share: number | null; avgPos: number | null;
  citationShare: number | null; answers: number;
}) {
  await pool.query(
    `INSERT INTO daily_metric
       (brand_id, day, engine, topic_id, visibility, share_of_voice, avg_position, citation_share, answers)
     VALUES ($1,$2,$3,NULL,$4,$5,$6,$7,$8)
     ON CONFLICT (brand_id, day, engine, topic_id) DO UPDATE SET
       visibility     = EXCLUDED.visibility,
       share_of_voice = COALESCE(EXCLUDED.share_of_voice, daily_metric.share_of_voice),
       avg_position   = COALESCE(EXCLUDED.avg_position, daily_metric.avg_position),
       citation_share = COALESCE(EXCLUDED.citation_share, daily_metric.citation_share),
       answers        = EXCLUDED.answers`,
    [m.brandId, m.day, m.engine, Math.round(m.visibility), m.share, m.avgPos, m.citationShare, m.answers],
  );
}

function findMine(result: VisibilityResult, brandName: string) {
  const squash = (s: string) =>
    s.toLowerCase().replace(/^www\./, "").replace(/\.[a-z.]+$/, "").replace(/[^a-z0-9]/g, "");
  const me = squash(brandName);
  return (
    result.competitors.find((c) => c.you) ??
    result.competitors.find((c) => squash(c.name) === me)
  );
}

/**
 * Fills `daily_metric` from the snapshots already on record.
 *
 * Without this the first chart is a single dot and stays that way for a month.
 * The stored blobs already hold a score, a competitor set and a citation list
 * per reading, which is every series the Visibility tab draws.
 */
export async function backfillDaily(): Promise<{ days: number; brands: number }> {
  await ensureSchema();
  const { rows } = await pool.query<{
    brand_id: string; name: string; created_at: string; data: VisibilityResult;
  }>(
    `SELECT s.brand_id, b.name, s.created_at, s.data
       FROM visibility_snapshot s JOIN brand b ON b.id = s.brand_id
      WHERE s.data IS NOT NULL
      ORDER BY s.created_at ASC`,
  );
  const brands = new Set<string>();
  for (const r of rows) {
    brands.add(r.brand_id);
    const day = new Date(r.created_at).toISOString().slice(0, 10);
    await rollupDay(r.brand_id, r.name, r.data, undefined, day);
    await recordCitations(r.brand_id, r.data, day, r.name);
  }
  return { days: rows.length, brands: brands.size };
}

/* ------------------------------------------------------------------- reads */

export type Point = { day: string; value: number | null };
export type RankRow = {
  name: string; value: number; delta: number | null; owned: boolean;
};

/** `Last 7 days` and the window before it, so a delta is one query apart. */
export function windowFor(days: number, endISO?: string) {
  const end = endISO ? new Date(endISO) : new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));
  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - (days - 1));
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { start: iso(start), end: iso(end), prevStart: iso(prevStart), prevEnd: iso(prevEnd) };
}

/** The visibility line, optionally for one engine. */
export async function visibilitySeries(
  brandId: string, start: string, end: string, engine?: string | null,
): Promise<Point[]> {
  await ensureSchema();
  const { rows } = await pool.query<{ day: string; visibility: string }>(
    `SELECT day::text, visibility FROM daily_metric
      WHERE brand_id = $1 AND day BETWEEN $2 AND $3
        AND engine IS NOT DISTINCT FROM $4
      ORDER BY day ASC`,
    [brandId, start, end, engine ?? null],
  );
  return rows.map((r) => ({ day: r.day, value: Number(r.visibility) }));
}

/** One number for a window, plus the change against the window before it. */
export async function metricSummary(
  brandId: string, w: ReturnType<typeof windowFor>,
  column: "visibility" | "share_of_voice" | "citation_share" | "avg_position" = "visibility",
): Promise<{ value: number | null; delta: number | null }> {
  await ensureSchema();
  const avg = async (from: string, to: string) => {
    const { rows } = await pool.query<{ v: string | null }>(
      `SELECT avg(${column})::numeric(10,2) AS v FROM daily_metric
        WHERE brand_id = $1 AND day BETWEEN $2 AND $3 AND engine IS NULL`,
      [brandId, from, to],
    );
    return rows[0]?.v === null || rows[0]?.v === undefined ? null : Number(rows[0].v);
  };
  const now = await avg(w.start, w.end);
  const before = await avg(w.prevStart, w.prevEnd);
  return {
    value: now,
    delta: now !== null && before !== null ? Math.round((now - before) * 10) / 10 : null,
  };
}

/** Engine rows for the Platforms tab, newest reading in the window. */
export async function engineRows(
  brandId: string, w: ReturnType<typeof windowFor>,
): Promise<RankRow[]> {
  await ensureSchema();
  const { rows } = await pool.query<{ engine: string; v: string; prev: string | null }>(
    `WITH now AS (
       SELECT engine, avg(visibility) v FROM daily_metric
        WHERE brand_id = $1 AND day BETWEEN $2 AND $3 AND engine IS NOT NULL
        GROUP BY engine),
     before AS (
       SELECT engine, avg(visibility) v FROM daily_metric
        WHERE brand_id = $1 AND day BETWEEN $4 AND $5 AND engine IS NOT NULL
        GROUP BY engine)
     SELECT n.engine, n.v::numeric(10,1) AS v, b.v::numeric(10,1) AS prev
       FROM now n LEFT JOIN before b USING (engine)
      ORDER BY n.v DESC`,
    [brandId, w.start, w.end, w.prevStart, w.prevEnd],
  );
  return rows.map((r) => ({
    name: r.engine,
    value: Number(r.v),
    delta: r.prev === null ? null : Math.round((Number(r.v) - Number(r.prev)) * 10) / 10,
    owned: false,
  }));
}

export type PromptRow = {
  id: string; text: string; topic: string | null;
  visibility: number; avgPosition: number | null; answers: number; engines: number;
};

/** The Prompts tab: one row per tracked prompt, grouped by topic. */
export async function promptRows(
  brandId: string, w: ReturnType<typeof windowFor>,
): Promise<PromptRow[]> {
  await ensureSchema();
  const { rows } = await pool.query<{
    id: string; text: string; topic: string | null;
    hit: string; total: string; avgpos: string | null; engines: string;
  }>(
    `SELECT p.id, p.text, t.name AS topic,
            count(*) FILTER (WHERE c.mentioned) AS hit,
            count(*) AS total,
            avg(c.position)::numeric(10,2) AS avgpos,
            count(DISTINCT c.engine) AS engines
       FROM prompt p
       LEFT JOIN topic t ON t.id = p.topic_id
       JOIN answer_cell c ON c.prompt_id = p.id
      WHERE p.brand_id = $1 AND p.active
        AND c.measured_at::date BETWEEN $2 AND $3
      GROUP BY p.id, p.text, t.name
      ORDER BY count(*) FILTER (WHERE c.mentioned)::float / count(*) DESC`,
    [brandId, w.start, w.end],
  );
  return rows.map((r) => ({
    id: r.id,
    text: r.text,
    topic: r.topic,
    visibility: Math.round((Number(r.hit) / Math.max(1, Number(r.total))) * 1000) / 10,
    avgPosition: r.avgpos === null ? null : Number(r.avgpos),
    answers: Number(r.total),
    engines: Number(r.engines),
  }));
}

/** Cited domains for the window, most cited first. */
export async function citationRows(
  brandId: string, w: ReturnType<typeof windowFor>,
): Promise<RankRow[]> {
  await ensureSchema();
  const { rows } = await pool.query<{ domain: string; n: string; owned: boolean }>(
    `SELECT domain, count(*) AS n, bool_or(is_owned) AS owned
       FROM cell_citation
      WHERE brand_id = $1 AND day BETWEEN $2 AND $3
      GROUP BY domain ORDER BY count(*) DESC, domain ASC`,
    [brandId, w.start, w.end],
  );
  const total = rows.reduce((a, r) => a + Number(r.n), 0) || 1;
  return rows.map((r) => ({
    name: r.domain,
    value: Math.round((Number(r.n) / total) * 1000) / 10,
    delta: null,
    owned: r.owned,
  }));
}

/** How many answers are on record — the "Export N answers" count. */
export async function answerCount(brandId: string): Promise<number> {
  await ensureSchema();
  const { rows } = await pool.query<{ n: string }>(
    `SELECT count(*) AS n FROM answer_cell WHERE brand_id = $1`,
    [brandId],
  );
  return Number(rows[0]?.n ?? 0);
}

/** Verbatim answers, newest first — the receipts. */
export async function recentAnswers(
  brandId: string, limit = 20,
): Promise<{ engine: string; prompt: string | null; mentioned: boolean; position: number | null; text: string; measured_at: string }[]> {
  await ensureSchema();
  const { rows } = await pool.query(
    `SELECT c.engine, p.text AS prompt, c.mentioned, c.position,
            c.answer_text AS text, c.measured_at
       FROM answer_cell c LEFT JOIN prompt p ON p.id = c.prompt_id
      WHERE c.brand_id = $1 AND c.answer_text IS NOT NULL
      ORDER BY c.measured_at DESC, c.id DESC LIMIT $2`,
    [brandId, limit],
  );
  return rows as never;
}
