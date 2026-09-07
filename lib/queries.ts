import { pool } from "@/lib/db";
import type { VisibilityResult } from "@/lib/visibility";

export type Brand = {
  id: string;
  user_id: string;
  name: string;
  category: string;
  /**
   * Who the answers should be about — "USA, Canada, UK". Nullable because
   * brands created before the column existed have no market, and a scan reads
   * it through `scanScope`, which treats absent as "no market clause".
   */
  market: string | null;
  created_at: string;
};

export type Snapshot = {
  id: string;
  brand_id: string;
  score: number;
  live: boolean;
  data: VisibilityResult;
  created_at: string;
};

let schemaReady = false;

export async function ensureSchema() {
  if (schemaReady) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS brand (
      id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id     text NOT NULL,
      name        text NOT NULL,
      category    text NOT NULL,
      created_at  timestamptz NOT NULL DEFAULT now()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS visibility_snapshot (
      id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      brand_id    uuid NOT NULL REFERENCES brand(id) ON DELETE CASCADE,
      score       integer NOT NULL,
      live        boolean NOT NULL DEFAULT false,
      data        jsonb NOT NULL,
      created_at  timestamptz NOT NULL DEFAULT now()
    )
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_brand_user ON brand(user_id)`,
  );
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_snapshot_brand ON visibility_snapshot(brand_id, created_at DESC)`,
  );
  await pool.query(`
    CREATE TABLE IF NOT EXISTS score_cache (
      cache_key   text PRIMARY KEY,
      live        boolean NOT NULL,
      source      text NOT NULL,
      data        jsonb NOT NULL,
      created_at  timestamptz NOT NULL DEFAULT now()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS scan_job (
      id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      cache_key   text NOT NULL,
      brand       text NOT NULL,
      category    text NOT NULL,
      status      text NOT NULL DEFAULT 'pending',
      live        boolean,
      source      text,
      data        jsonb,
      error       text,
      created_at  timestamptz NOT NULL DEFAULT now(),
      updated_at  timestamptz NOT NULL DEFAULT now()
    )
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_job_key_status ON scan_job(cache_key, status)`,
  );
  await pool.query(`
    CREATE TABLE IF NOT EXISTS device_usage (
      device_id   text PRIMARY KEY,
      free_used   integer NOT NULL DEFAULT 0,
      last_brand  text,
      created_at  timestamptz NOT NULL DEFAULT now(),
      updated_at  timestamptz NOT NULL DEFAULT now()
    )
  `);

  // Columns added after their tables shipped. `CREATE TABLE IF NOT EXISTS`
  // above is a no-op on a database that already has the table, so a new column
  // needs its own idempotent statement or it only ever exists on a fresh
  // install. Postgres 9.6+ for ADD COLUMN IF NOT EXISTS.
  //
  // All three exist to carry one thing: the scope a report was measured at, so
  // the reading someone paid to unlock is the reading they saw.
  await pool.query(`ALTER TABLE brand ADD COLUMN IF NOT EXISTS market text`);
  await pool.query(
    `ALTER TABLE device_usage ADD COLUMN IF NOT EXISTS last_category text`,
  );
  await pool.query(
    `ALTER TABLE device_usage ADD COLUMN IF NOT EXISTS last_market text`,
  );

  // The per-answer grid a scan produced, carried on the job so the dashboard
  // can attach it to the snapshot it creates. Without it the grid is computed
  // by the worker and lost before anything durable is written.
  await pool.query(`ALTER TABLE scan_job ADD COLUMN IF NOT EXISTS cells jsonb`);

  // ------------------------------------------------------------------ metrics
  //
  // Everything above stores one aggregated blob per scan, which is enough to
  // render a single report and nothing else. A dashboard asks a different kind
  // of question — "how did this prompt do on this engine last Tuesday" — and
  // that can only be answered from rows.
  //
  // `measureVisibility` already builds exactly the grid these tables want and
  // then discards it, so the expensive part is done; this is where it lands.

  await pool.query(`
    CREATE TABLE IF NOT EXISTS topic (
      id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      brand_id  uuid NOT NULL REFERENCES brand(id) ON DELETE CASCADE,
      name      text NOT NULL,
      UNIQUE (brand_id, name)
    )`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS prompt (
      id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      brand_id   uuid NOT NULL REFERENCES brand(id) ON DELETE CASCADE,
      topic_id   uuid REFERENCES topic(id) ON DELETE SET NULL,
      text       text NOT NULL,
      weight     numeric NOT NULL DEFAULT 1,
      active     boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (brand_id, text)
    )`);

  // One row per prompt x engine x sample. `prompt_id` is nullable on purpose:
  // the hosted scorer reports per-engine totals without saying which prompt
  // produced them, and a row that knows the engine is still worth keeping.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS answer_cell (
      id          bigserial PRIMARY KEY,
      brand_id    uuid NOT NULL REFERENCES brand(id) ON DELETE CASCADE,
      snapshot_id uuid REFERENCES visibility_snapshot(id) ON DELETE CASCADE,
      prompt_id   uuid REFERENCES prompt(id) ON DELETE SET NULL,
      engine      text NOT NULL,
      sample_no   smallint NOT NULL DEFAULT 1,
      mentioned   boolean NOT NULL,
      position    smallint,
      answer_text text,
      measured_at timestamptz NOT NULL DEFAULT now()
    )`);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_cell_brand_time ON answer_cell(brand_id, measured_at DESC)`,
  );
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_cell_prompt ON answer_cell(prompt_id, engine)`,
  );

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cell_mention (
      cell_id    bigint NOT NULL REFERENCES answer_cell(id) ON DELETE CASCADE,
      brand_name text NOT NULL,
      position   smallint NOT NULL,
      PRIMARY KEY (cell_id, brand_name)
    )`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cell_citation (
      id       bigserial PRIMARY KEY,
      brand_id uuid NOT NULL REFERENCES brand(id) ON DELETE CASCADE,
      cell_id  bigint REFERENCES answer_cell(id) ON DELETE CASCADE,
      day      date NOT NULL DEFAULT current_date,
      url      text,
      domain   text NOT NULL,
      is_owned boolean NOT NULL DEFAULT false,
      kind     text,
      note     text
    )`);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_citation_brand_day ON cell_citation(brand_id, day DESC)`,
  );

  // The rollup the charts actually read. A null engine or topic means "all of
  // them", and NULLS NOT DISTINCT is what makes that de-duplicate properly —
  // a plain UNIQUE treats every null as different and the upsert would insert
  // a new "all engines" row on every scan.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS daily_metric (
      brand_id       uuid NOT NULL REFERENCES brand(id) ON DELETE CASCADE,
      day            date NOT NULL,
      engine         text,
      topic_id       uuid REFERENCES topic(id) ON DELETE CASCADE,
      visibility     numeric NOT NULL,
      share_of_voice numeric,
      avg_position   numeric,
      citation_share numeric,
      answers        integer NOT NULL DEFAULT 0,
      UNIQUE NULLS NOT DISTINCT (brand_id, day, engine, topic_id)
    )`);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_metric_brand_day ON daily_metric(brand_id, day)`,
  );

  // Which domains are the customer's own, so "Owned" badges and citation share
  // are computable rather than guessed from the brand string.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS brand_domain (
      brand_id uuid NOT NULL REFERENCES brand(id) ON DELETE CASCADE,
      domain   text NOT NULL,
      PRIMARY KEY (brand_id, domain)
    )`);

  // What the customer actually shipped, and when. Nobody else in this category
  // records this, and it is what turns a recommendation into evidence.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS shipped_action (
      id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      brand_id    uuid NOT NULL REFERENCES brand(id) ON DELETE CASCADE,
      title       text NOT NULL,
      action_kind text,
      shipped_on  date NOT NULL DEFAULT current_date,
      note        text,
      created_at  timestamptz NOT NULL DEFAULT now()
    )`);

  schemaReady = true;
}

/** What this device already spent its free report on, if anything. */
export type DeviceContext = {
  freeUsed: number;
  brand: string;
  category: string;
  market: string;
};

/**
 * The free report this device has already run — brand, category and market.
 *
 * Two callers, one row. The free check compares the stored three against what
 * is being asked for, so re-opening the same report is served rather than
 * gated; the dashboard reads them to prefill onboarding after a purchase, which
 * works because `sf_device` is a year-long cookie that survives both sign-in
 * and the round trip out to Dodo and back.
 *
 * Nulls collapse to empty strings: every caller compares or prefills, and both
 * want "" rather than a null check.
 */
export async function getDeviceContext(
  deviceId: string,
): Promise<DeviceContext | null> {
  await ensureSchema();
  const { rows } = await pool.query<{
    free_used: number;
    last_brand: string | null;
    last_category: string | null;
    last_market: string | null;
  }>(
    `SELECT free_used, last_brand, last_category, last_market
       FROM device_usage WHERE device_id = $1`,
    [deviceId],
  );
  const row = rows[0];
  if (!row) return null;
  return {
    freeUsed: row.free_used,
    brand: row.last_brand ?? "",
    category: row.last_category ?? "",
    market: row.last_market ?? "",
  };
}

/**
 * Record that this device consumed a free report, and on what.
 *
 * The three fields are what make the report re-openable: `free_used` alone
 * cannot tell "back button on the report I just ran" from "a second brand", and
 * the first of those must not be refused.
 */
export async function markFreeUsed(
  deviceId: string,
  brand: string,
  category: string,
  market: string,
): Promise<void> {
  await ensureSchema();
  await pool.query(
    `INSERT INTO device_usage (device_id, free_used, last_brand, last_category, last_market)
     VALUES ($1, 1, $2, $3, $4)
     ON CONFLICT (device_id) DO UPDATE
       SET free_used = device_usage.free_used + 1,
           last_brand = EXCLUDED.last_brand,
           last_category = EXCLUDED.last_category,
           last_market = EXCLUDED.last_market,
           updated_at = now()`,
    [
      deviceId,
      brand.slice(0, 120),
      category.slice(0, 200),
      market.slice(0, 120),
    ],
  );
}

export type JobStatus = "pending" | "running" | "done" | "error";
export type ScanJob = {
  id: string;
  cache_key: string;
  brand: string;
  category: string;
  status: JobStatus;
  live: boolean | null;
  source: string | null;
  data: VisibilityResult | null;
  error: string | null;
  cells: unknown[] | null;
};

/** Reuse an in-flight job for the same key, else create a fresh pending one. */
export async function createOrGetJob(
  key: string,
  brand: string,
  category: string,
): Promise<{ job: ScanJob; created: boolean }> {
  await ensureSchema();
  const existing = await pool.query<ScanJob>(
    `SELECT * FROM scan_job WHERE cache_key = $1 AND status IN ('pending','running')
       AND updated_at > now() - interval '10 minutes' ORDER BY created_at DESC LIMIT 1`,
    [key],
  );
  if (existing.rows[0]) return { job: existing.rows[0], created: false };
  const { rows } = await pool.query<ScanJob>(
    `INSERT INTO scan_job (cache_key, brand, category) VALUES ($1, $2, $3) RETURNING *`,
    [key, brand, category],
  );
  return { job: rows[0], created: true };
}

export async function getJob(id: string): Promise<ScanJob | null> {
  await ensureSchema();
  const { rows } = await pool.query<ScanJob>(`SELECT * FROM scan_job WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function setJobRunning(id: string): Promise<void> {
  await pool.query(
    `UPDATE scan_job SET status = 'running', updated_at = now() WHERE id = $1`,
    [id],
  );
}

export async function setJobDone(
  id: string,
  live: boolean,
  source: string,
  data: VisibilityResult,
  /** The per-answer grid, when the scorer produced one. Stored so the row the
   *  dashboard writes can be built from answers rather than a summary. */
  cells?: unknown[],
): Promise<void> {
  await pool.query(
    `UPDATE scan_job SET status = 'done', live = $2, source = $3, data = $4,
            cells = $5, updated_at = now() WHERE id = $1`,
    [id, live, source, JSON.stringify(data), cells ? JSON.stringify(cells) : null],
  );
}

export async function setJobError(id: string, message: string): Promise<void> {
  await pool.query(
    `UPDATE scan_job SET status = 'error', error = $2, updated_at = now() WHERE id = $1`,
    [id, message.slice(0, 500)],
  );
}

const CACHE_TTL_HOURS = Number(process.env.SCORE_CACHE_TTL_HOURS || 24);

export async function getCachedScore(key: string): Promise<{
  live: boolean;
  source: string;
  data: VisibilityResult;
  /** When this reading was actually taken, so the UI can say so. */
  measuredAt: string;
} | null> {
  await ensureSchema();
  const { rows } = await pool.query(
    `SELECT live, source, data, created_at FROM score_cache
     WHERE cache_key = $1 AND created_at > now() - ($2 || ' hours')::interval`,
    [key, String(CACHE_TTL_HOURS)],
  );
  return rows[0]
    ? {
        live: rows[0].live,
        source: rows[0].source,
        data: rows[0].data,
        measuredAt: new Date(rows[0].created_at).toISOString(),
      }
    : null;
}

export async function putCachedScore(
  key: string,
  live: boolean,
  source: string,
  data: VisibilityResult,
): Promise<void> {
  await ensureSchema();
  await pool.query(
    `INSERT INTO score_cache (cache_key, live, source, data)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (cache_key) DO UPDATE
       SET live = EXCLUDED.live, source = EXCLUDED.source,
           data = EXCLUDED.data, created_at = now()`,
    [key, live, source, JSON.stringify(data)],
  );
}

/**
 * The account's first brand, and the fallback when no brand is selected.
 *
 * Kept for the single-brand paths (onboarding, the scan actions) even though an
 * account may now hold several — "the one to show when nothing was asked for"
 * is still a real question, and oldest-first keeps that answer stable as
 * brands are added and removed.
 */
export async function getBrandForUser(userId: string): Promise<Brand | null> {
  await ensureSchema();
  const { rows } = await pool.query<Brand>(
    `SELECT * FROM brand WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1`,
    [userId],
  );
  return rows[0] ?? null;
}

/** Every brand on the account, oldest first — the order the switcher shows. */
export async function getBrandsForUser(userId: string): Promise<Brand[]> {
  await ensureSchema();
  const { rows } = await pool.query<Brand>(
    `SELECT * FROM brand WHERE user_id = $1 ORDER BY created_at ASC`,
    [userId],
  );
  return rows;
}

/**
 * One brand, scoped to its owner.
 *
 * The user id is in the WHERE clause rather than checked afterwards: a brand id
 * arrives from the query string, so this is the boundary that stops one account
 * reading another's report by guessing a uuid.
 */
export async function getBrandById(
  userId: string,
  brandId: string,
): Promise<Brand | null> {
  await ensureSchema();
  const { rows } = await pool.query<Brand>(
    `SELECT * FROM brand WHERE id = $1 AND user_id = $2`,
    [brandId, userId],
  );
  return rows[0] ?? null;
}

export async function countBrandsForUser(userId: string): Promise<number> {
  await ensureSchema();
  const { rows } = await pool.query<{ n: number }>(
    `SELECT count(*)::int AS n FROM brand WHERE user_id = $1`,
    [userId],
  );
  return rows[0]?.n ?? 0;
}

export async function createBrand(
  userId: string,
  name: string,
  category: string,
  market: string | null = null,
): Promise<Brand> {
  await ensureSchema();
  const { rows } = await pool.query<Brand>(
    `INSERT INTO brand (user_id, name, category, market)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    // Empty market stored as NULL, so "no market given" is one value rather
    // than two that `scanScope` would have to agree about.
    [userId, name, category, market || null],
  );
  return rows[0];
}

export async function deleteBrand(userId: string, brandId: string) {
  await ensureSchema();
  await pool.query(`DELETE FROM brand WHERE id = $1 AND user_id = $2`, [
    brandId,
    userId,
  ]);
}

export async function saveSnapshot(
  brandId: string,
  score: number,
  live: boolean,
  data: VisibilityResult,
): Promise<string> {
  await ensureSchema();
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO visibility_snapshot (brand_id, score, live, data)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [brandId, Math.round(score), live, JSON.stringify(data)],
  );
  return rows[0].id;
}

export async function getLatestSnapshot(
  brandId: string,
): Promise<Snapshot | null> {
  await ensureSchema();
  const { rows } = await pool.query<Snapshot>(
    `SELECT * FROM visibility_snapshot WHERE brand_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [brandId],
  );
  return rows[0] ?? null;
}

export async function getSnapshotHistory(
  brandId: string,
  limit = 14,
): Promise<Snapshot[]> {
  await ensureSchema();
  const { rows } = await pool.query<Snapshot>(
    `SELECT * FROM visibility_snapshot WHERE brand_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [brandId, limit],
  );
  return rows;
}
