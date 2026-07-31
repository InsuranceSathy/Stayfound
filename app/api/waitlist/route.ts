import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { notifyLead } from "@/lib/notify";

let tableReady = false;

async function ensureTable() {
  if (tableReady) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS waitlist_signup (
      id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email        text NOT NULL,
      business     text NOT NULL,
      domain       text,
      competitors  text,
      created_at   timestamptz NOT NULL DEFAULT now()
    );
    ALTER TABLE waitlist_signup ADD COLUMN IF NOT EXISTS industry text;
    ALTER TABLE waitlist_signup ALTER COLUMN business DROP NOT NULL;
  `);
  tableReady = true;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let email = "";
  let business = "";
  let domain = "";
  let industry = "";
  let competitors = "";
  try {
    const body = await req.json();
    email = String(body.email ?? "").trim().slice(0, 160);
    business = String(body.business ?? "").trim().slice(0, 160);
    // The report form asks for the site; the older dialog asked for a domain.
    domain = String(body.website ?? body.domain ?? "").trim().slice(0, 200);
    industry = String(body.industry ?? "").trim().slice(0, 160);
    competitors = String(body.competitors ?? "").trim().slice(0, 600);
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!email || !domain) {
    return NextResponse.json(
      { error: "Please share your website and email." },
      { status: 400 },
    );
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "That email doesn't look right." },
      { status: 400 },
    );
  }

  try {
    await ensureTable();
    await pool.query(
      `INSERT INTO waitlist_signup (email, business, domain, industry, competitors)
       VALUES ($1, $2, $3, $4, $5)`,
      [email, business || null, domain, industry || null, competitors || null],
    );
    await notifyLead("New report request", {
      Website: domain,
      Industry: industry,
      Competitors: competitors,
      Email: email,
      Business: business,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("waitlist insert failed:", err);
    return NextResponse.json(
      { error: "Couldn't save your request. Please try again." },
      { status: 500 },
    );
  }
}
