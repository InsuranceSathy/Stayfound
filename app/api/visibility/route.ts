import { NextResponse } from "next/server";
import { resolveVisibility } from "@/lib/resolve-visibility";

export const maxDuration = 120;

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

  const { live, result, source } = await resolveVisibility(brand, category);
  return NextResponse.json({ live, result, source });
}
