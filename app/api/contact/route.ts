import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { notifyLead } from "@/lib/notify";

let tableReady = false;

async function ensureTable() {
  if (tableReady) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS demo_request (
      id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name        text NOT NULL,
      email       text NOT NULL,
      company     text,
      message     text,
      created_at  timestamptz NOT NULL DEFAULT now()
    )
  `);
  tableReady = true;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let name = "";
  let email = "";
  let company = "";
  let message = "";
  try {
    const body = await req.json();
    name = String(body.name ?? "").trim().slice(0, 120);
    email = String(body.email ?? "").trim().slice(0, 160);
    company = String(body.company ?? "").trim().slice(0, 160);
    message = String(body.message ?? "").trim().slice(0, 2000);
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!name || !email) {
    return NextResponse.json(
      { error: "Please share your name and email." },
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
      `INSERT INTO demo_request (name, email, company, message)
       VALUES ($1, $2, $3, $4)`,
      [name, email, company || null, message || null],
    );
    await notifyLead("New demo request", {
      Name: name,
      Email: email,
      Company: company,
      Message: message,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("contact insert failed:", err);
    return NextResponse.json(
      { error: "Couldn't save your request. Please try again." },
      { status: 500 },
    );
  }
}
