import { NextResponse } from "next/server";
import { after } from "next/server";
import { getCachedScore, createOrGetJob } from "@/lib/queries";
import { runScan } from "@/lib/scan";
import { getDemoReport } from "@/lib/demo-fixtures";

export const maxDuration = 300;

export async function POST(req: Request) {
  let brand = "";
  let category = "";
  try {
    const body = await req.json();
    brand = String(body.brand ?? "").trim().slice(0, 80);
    // 200, matching `scanScope`: the dashboard sends a scope here ("compliance
    // software for customers in USA, Canada"), not a bare category. Cutting it
    // at 120 would build a different cache key from the same brand and quietly
    // re-measure instead of reusing the reading that is already stored.
    category = String(body.category ?? "").trim().slice(0, 200);
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!brand || !category) {
    return NextResponse.json(
      { error: "Enter both a brand name and a category." },
      { status: 400 },
    );
  }

  const key = `${brand.toLowerCase()}|${category.toLowerCase()}`;

  // Demo fixtures — curated example reports, returned instantly.
  const demo = getDemoReport(brand);
  if (demo) {
    return NextResponse.json({
      status: "done",
      cached: true,
      live: true,
      result: demo,
      source: "cloud",
    });
  }

  // Fresh cached scan → return instantly.
  try {
    const cached = await getCachedScore(key);
    if (cached) {
      return NextResponse.json({
        status: "done",
        cached: true,
        live: cached.live,
        result: cached.data,
        source: cached.source,
        measuredAt: cached.measuredAt,
      });
    }
  } catch {
    /* fall through to enqueue */
  }

  // Otherwise enqueue a background scan and return a job id to poll.
  const { job, created } = await createOrGetJob(key, brand, category);
  if (created) {
    after(() => runScan(job.id, brand, category, key));
  }
  return NextResponse.json({ status: "pending", jobId: job.id });
}
