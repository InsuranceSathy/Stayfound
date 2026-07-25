import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

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
    )
  `);
  tableReady = true;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let email = "";
  let business = "";
  let domain = "";
  let competitors = "";
  try {
    const body = await req.json();
    email = String(body.email ?? "").trim().slice(0, 160);
    business = String(body.business ?? "").trim().slice(0, 160);
    domain = String(body.domain ?? "").trim().slice(0, 200);
    competitors = String(body.competitors ?? "").trim().slice(0, 600);
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!email || !business) {
    return NextResponse.json(
      { error: "Please share your email and business name." },
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
      `INSERT INTO waitlist_signup (email, business, domain, competitors)
       VALUES ($1, $2, $3, $4)`,
      [email, business, domain || null, competitors || null],
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("waitlist insert failed:", err);
    return NextResponse.json(
      { error: "Couldn't save your spot. Please try again." },
      { status: 500 },
    );
  }
}
