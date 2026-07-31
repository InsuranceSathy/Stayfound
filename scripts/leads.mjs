/**
 * Prints pending report + demo requests, newest first.
 *
 *   npm run leads          last 20 of each
 *   npm run leads -- 50    last 50 of each
 */
import { Pool } from "pg";

const limit = Number(process.argv[2]) || 20;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
});

const when = (d) => new Date(d).toISOString().slice(0, 16).replace("T", " ");

async function rows(sql) {
  try {
    const res = await pool.query(sql, [limit]);
    return res.rows;
  } catch (err) {
    // Table won't exist until the first submission creates it.
    if (err.code === "42P01") return [];
    throw err;
  }
}

const reports = await rows(
  `SELECT created_at, email, domain, industry, competitors, business
     FROM waitlist_signup ORDER BY created_at DESC LIMIT $1`,
);
const demos = await rows(
  `SELECT created_at, name, email, company, message
     FROM demo_request ORDER BY created_at DESC LIMIT $1`,
);

console.log(`\n=== Report requests (${reports.length}) ===`);
for (const r of reports) {
  console.log(
    `\n${when(r.created_at)}  ${r.email}` +
      `\n  site:        ${r.domain ?? "—"}` +
      `\n  industry:    ${r.industry ?? "—"}` +
      `\n  competitors: ${r.competitors ?? "—"}` +
      (r.business ? `\n  business:    ${r.business}` : ""),
  );
}

console.log(`\n\n=== Demo requests (${demos.length}) ===`);
for (const d of demos) {
  console.log(
    `\n${when(d.created_at)}  ${d.name} <${d.email}>` +
      (d.company ? `\n  company: ${d.company}` : "") +
      (d.message ? `\n  message: ${d.message}` : ""),
  );
}

console.log("");
await pool.end();
