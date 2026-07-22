import { NextResponse } from "next/server";
import { askModel } from "@/lib/measure";

export const maxDuration = 60;

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function parseJsonLoose(raw: string): unknown {
  const s = raw.indexOf("{");
  const e = raw.lastIndexOf("}");
  if (s < 0 || e < 0) return null;
  try {
    return JSON.parse(raw.slice(s, e + 1));
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  let url = "";
  try {
    url = String((await req.json()).url ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  let parsed: URL;
  try {
    parsed = new URL(url);
    if (!/^https?:$/.test(parsed.protocol)) throw new Error("bad protocol");
  } catch {
    return NextResponse.json({ error: "Enter a valid URL." }, { status: 400 });
  }

  // Fetch the page.
  let text = "";
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    const res = await fetch(parsed.toString(), {
      signal: ctrl.signal,
      headers: { "user-agent": "SurfacedBot/1.0 (+https://www.stayfound.tech)" },
    });
    clearTimeout(t);
    if (!res.ok) {
      return NextResponse.json(
        { error: `Couldn't fetch that page (${res.status}).` },
        { status: 400 },
      );
    }
    text = htmlToText(await res.text()).slice(0, 8000);
  } catch {
    return NextResponse.json(
      { error: "Couldn't reach that URL. Check the link and try again." },
      { status: 400 },
    );
  }

  if (text.length < 200) {
    return NextResponse.json(
      { error: "That page has too little readable content to score." },
      { status: 400 },
    );
  }

  const prompt = `You are an Answer Engine Optimization (AEO) analyst. Score how likely AI answer engines (ChatGPT, Perplexity, Gemini, Google AI Overviews) are to CITE the page content below.

Return ONLY valid JSON, exactly this shape:
{"score":0,"target":80,"summary":"one sentence verdict","breakdown":[{"dimension":"Answerability","score":0,"note":"short, specific"},{"dimension":"Structure","score":0,"note":"..."},{"dimension":"Depth & authority","score":0,"note":"..."},{"dimension":"Readability","score":0,"note":"..."},{"dimension":"Extractability","score":0,"note":"..."}],"fixes":["specific fix","specific fix","specific fix"]}

Scoring guidance (0-100 each):
- Answerability: does it directly answer real buyer questions up front?
- Structure: headings, lists, tables, Q&A, scannability.
- Depth & authority: data, stats, citations, expertise signals.
- Readability: clear, concise, plain language.
- Extractability: self-contained facts, schema-friendly, quotable.
"score" is the overall 0-100. Give 3 concrete fixes.

PAGE CONTENT:
${text}`;

  try {
    const raw = await askModel(prompt, 1200);
    const data = parseJsonLoose(raw) as {
      score?: number;
      breakdown?: unknown[];
    } | null;
    if (!data || typeof data.score !== "number" || !Array.isArray(data.breakdown)) {
      return NextResponse.json(
        { error: "Couldn't analyze that page. Try another URL." },
        { status: 502 },
      );
    }
    return NextResponse.json({ url: parsed.toString(), result: data });
  } catch {
    return NextResponse.json(
      { error: "Analysis failed. Please try again." },
      { status: 502 },
    );
  }
}
