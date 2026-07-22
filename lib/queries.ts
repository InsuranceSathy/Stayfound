import { pool } from "@/lib/db";
import type { VisibilityResult } from "@/lib/visibility";

export type Brand = {
  id: string;
  user_id: string;
  name: string;
  category: string;
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
  schemaReady = true;
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
): Promise<void> {
  await pool.query(
    `UPDATE scan_job SET status = 'done', live = $2, source = $3, data = $4, updated_at = now() WHERE id = $1`,
    [id, live, source, JSON.stringify(data)],
  );
}

export async function setJobError(id: string, message: string): Promise<void> {
  await pool.query(
    `UPDATE scan_job SET status = 'error', error = $2, updated_at = now() WHERE id = $1`,
    [id, message.slice(0, 500)],
  );
}

const CACHE_TTL_HOURS = Number(process.env.SCORE_CACHE_TTL_HOURS || 24);

export async function getCachedScore(
  key: string,
): Promise<{ live: boolean; source: string; data: VisibilityResult } | null> {
  await ensureSchema();
  const { rows } = await pool.query(
    `SELECT live, source, data FROM score_cache
     WHERE cache_key = $1 AND created_at > now() - ($2 || ' hours')::interval`,
    [key, String(CACHE_TTL_HOURS)],
  );
  return rows[0]
    ? { live: rows[0].live, source: rows[0].source, data: rows[0].data }
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

export async function getBrandForUser(userId: string): Promise<Brand | null> {
  await ensureSchema();
  const { rows } = await pool.query<Brand>(
    `SELECT * FROM brand WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1`,
    [userId],
  );
  return rows[0] ?? null;
}

export async function createBrand(
  userId: string,
  name: string,
  category: string,
): Promise<Brand> {
  await ensureSchema();
  const { rows } = await pool.query<Brand>(
    `INSERT INTO brand (user_id, name, category) VALUES ($1, $2, $3) RETURNING *`,
    [userId, name, category],
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
): Promise<void> {
  await ensureSchema();
  await pool.query(
    `INSERT INTO visibility_snapshot (brand_id, score, live, data) VALUES ($1, $2, $3, $4)`,
    [brandId, Math.round(score), live, JSON.stringify(data)],
  );
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
