import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { ensureSchema, saveSnapshot, getBrandsForUser } from "@/lib/queries";
import { resolveVisibility } from "@/lib/resolve-visibility";
import { recordScan } from "@/lib/metrics";
import { scanScope } from "@/lib/report-derive";
import { getSubscription, effectivePlan } from "@/lib/billing";

export const maxDuration = 300;

/**
 * The daily refresh.
 *
 * Every plan above Free advertises a daily reading, and until now nothing ran
 * one — the score only moved when somebody clicked. This is the job that makes
 * the claim true, and it is also what every chart in the insights tabs needs:
 * a series is only a series if a reading lands on days nobody logged in.
 *
 * Authenticated by a shared secret rather than left open, because it spends
 * real inference money on every call. Vercel Cron sends the secret as a bearer
 * token; a manual run can pass `?key=`.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not set; refusing to run." },
      { status: 503 },
    );
  }
  const url = new URL(req.url);
  const auth = req.headers.get("authorization");
  const ok = auth === `Bearer ${secret}` || url.searchParams.get("key") === secret;
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await ensureSchema();

  // Only brands whose owner is paying. A free account is weekly at most, and
  // scanning brands nobody pays for is the fastest way to spend a month of
  // margin in a night.
  const { rows } = await pool.query<{ id: string; user_id: string }>(
    `SELECT DISTINCT b.id, b.user_id FROM brand b ORDER BY b.id`,
  );

  const done: string[] = [];
  const skipped: string[] = [];
  const failed: { brand: string; error: string }[] = [];

  for (const row of rows) {
    try {
      const plan = effectivePlan(await getSubscription(row.user_id));
      if (plan === "free") {
        skipped.push(row.id);
        continue;
      }
      // Re-read the brand through the owner's own query, which is also the
      // access check: a brand that no longer belongs to them is not scanned.
      const brand = (await getBrandsForUser(row.user_id)).find((b) => b.id === row.id);
      if (!brand) {
        skipped.push(row.id);
        continue;
      }

      // One reading a day. A second call on the same day is a no-op rather than
      // a second charge — cron retries and manual runs both hit this.
      const { rows: already } = await pool.query<{ n: string }>(
        `SELECT count(*) AS n FROM visibility_snapshot
          WHERE brand_id = $1 AND created_at::date = current_date`,
        [brand.id],
      );
      if (Number(already[0].n) > 0) {
        skipped.push(brand.name);
        continue;
      }

      const scope = scanScope(brand.category, brand.market);
      const { live, result, cells } = await resolveVisibility(brand.name, scope);
      const snapshotId = await saveSnapshot(brand.id, result.score, live, result);
      await recordScan({
        brandId: brand.id,
        snapshotId,
        brandName: brand.name,
        result,
        cells,
      });
      done.push(brand.name);
    } catch (err) {
      failed.push({ brand: row.id, error: (err as Error).message });
    }
  }

  return NextResponse.json({
    ran: done.length,
    skipped: skipped.length,
    failed,
    brands: done,
  });
}
