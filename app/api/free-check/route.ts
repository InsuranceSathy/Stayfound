import { NextResponse, after } from "next/server";
import { cookies } from "next/headers";
import {
  getCachedScore,
  createOrGetJob,
  getDeviceContext,
  markFreeUsed,
} from "@/lib/queries";
import { getDemoReport } from "@/lib/demo-fixtures";
import { runScan } from "@/lib/scan";
import { scanScope } from "@/lib/report-derive";

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
  let market = "";
  try {
    const b = await req.json();
    brand = String(b.brand ?? "").trim().slice(0, 80);
    category = String(b.category ?? "").trim().slice(0, 120);
    market = String(b.market ?? "").trim().slice(0, 80);
  } catch {
    return withCookie({ error: "Invalid request." }, 400);
  }
  if (!brand || !category || !market) {
    // Names the three fields as the form labels them, since this string is
    // rendered verbatim under that form.
    return withCookie(
      {
        error:
          "Enter your domain, your category of business and your target customers.",
      },
      400
    );
  }

  // Built by the shared helper so the dashboard measures the same phrase — see
  // `scanScope` in lib/report-derive.ts for why the market rides inside it.
  const scope = scanScope(category, market);

  /**
   * One free *report* per device — not one request.
   *
   * The report lives on a page someone leaves the moment they click a lock to
   * go and look at the price, so counting requests meant that coming back and
   * asking for the same report again was refused as a second one. Same brand,
   * same scope, same device is a re-view: it is served from the cache, or by
   * joining the scan still running for it below. That also un-strands a scan
   * that failed or was abandoned, which the old count spent regardless.
   *
   * A different brand or a different scope is still a second report, and still
   * gated.
   */
  const ctx = await getDeviceContext(deviceId);
  const sameReport =
    !!ctx &&
    ctx.brand.toLowerCase() === brand.toLowerCase() &&
    scanScope(ctx.category, ctx.market).toLowerCase() === scope.toLowerCase();
  if (ctx && ctx.freeUsed >= 1 && !sameReport) {
    return withCookie({ gated: true });
  }
  if (!sameReport) await markFreeUsed(deviceId, brand, category, market);

  // Keyed on the scope, so the same brand asked about a different market is a
  // different reading rather than a cache hit on the wrong one.
  const key = `${brand.toLowerCase()}|${scope.toLowerCase()}`;

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
  const { job, created } = await createOrGetJob(key, brand, scope);
  if (created) after(() => runScan(job.id, brand, scope, key));
  return withCookie({ status: "pending", jobId: job.id });
}
