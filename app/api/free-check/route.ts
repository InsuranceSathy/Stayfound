import { NextResponse, after } from "next/server";
import { cookies } from "next/headers";
import {
  getCachedScore,
  createOrGetJob,
  getFreeUsed,
  markFreeUsed,
} from "@/lib/queries";
import { getDemoReport } from "@/lib/demo-fixtures";
import { runScan } from "@/lib/scan";

export const maxDuration = 300;

const YEAR = 60 * 60 * 24 * 365;

export async function POST(req: Request) {
  const jar = await cookies();
  let deviceId = jar.get("sf_device")?.value;
  let newDevice = false;
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    newDevice = true;
  }

  const withCookie = (body: unknown, status = 200) => {
    const res = NextResponse.json(body, { status });
    if (newDevice) {
      res.cookies.set("sf_device", deviceId!, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: YEAR,
      });
    }
    return res;
  };

  let brand = "";
  let category = "";
  try {
    const b = await req.json();
    brand = String(b.brand ?? "").trim().slice(0, 80);
    category = String(b.category ?? "").trim().slice(0, 120);
  } catch {
    return withCookie({ error: "Invalid request." }, 400);
  }
  if (!brand || !category) {
    return withCookie({ error: "Enter both a brand and a category." }, 400);
  }

  // One free report per device.
  const used = await getFreeUsed(deviceId);
  if (used >= 1) {
    return withCookie({ gated: true });
  }
  await markFreeUsed(deviceId, brand);

  const key = `${brand.toLowerCase()}|${category.toLowerCase()}`;

  // Demo fixtures → instant.
  const demo = getDemoReport(brand);
  if (demo) {
    return withCookie({ status: "done", live: true, result: demo, source: "cloud" });
  }

  // Fresh cache → instant.
  try {
    const cached = await getCachedScore(key);
    if (cached) {
      // measuredAt is only set on this path. Its presence is what tells the
      // page it is showing an earlier reading rather than one it just ran, so
      // the result can say when it was taken instead of implying it is live.
      return withCookie({
        status: "done",
        live: cached.live,
        result: cached.data,
        source: cached.source,
        measuredAt: cached.measuredAt,
      });
    }
  } catch {
    /* fall through */
  }

  // Otherwise enqueue a background scan.
  const { job, created } = await createOrGetJob(key, brand, category);
  if (created) after(() => runScan(job.id, brand, category, key));
  return withCookie({ status: "pending", jobId: job.id });
}
