import { NextResponse } from "next/server";
import { after } from "next/server";
import { getCachedScore, createOrGetJob } from "@/lib/queries";
import { runScan } from "@/lib/scan";
import { DEMO_REPORTS } from "@/lib/demo-fixtures";

export const maxDuration = 300;

export async function POST(req: Request) {
  let brand = "";
  let category = "";
  try {
    const body = await req.json();
    brand = String(body.brand ?? "").trim().slice(0, 80);
    category = String(body.category ?? "").trim().slice(0, 120);
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
  const demo = DEMO_REPORTS[key];
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
