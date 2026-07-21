import { NextResponse } from "next/server";
import { resolveVisibility } from "@/lib/resolve-visibility";
import { getCachedScore, putCachedScore } from "@/lib/queries";

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

  // Serve a recent cached scan instantly (dodges the slow rescan + rate limits).
  try {
    const cached = await getCachedScore(key);
    if (cached) {
      return NextResponse.json({
        live: cached.live,
        result: cached.data,
        source: cached.source,
        cached: true,
      });
    }
  } catch {
    /* cache miss on error — fall through to a live scan */
  }

  const { live, result, source } = await resolveVisibility(brand, category);

  // Only cache real measurements, not the placeholder sample.
  if (live) {
    try {
      await putCachedScore(key, live, source, result);
    } catch {
      /* non-fatal */
    }
  }

  return NextResponse.json({ live, result, source, cached: false });
}
