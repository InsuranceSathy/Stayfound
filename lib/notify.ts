/**
 * Lead notifications.
 *
 * While reports are run by hand, a new signup only matters if a human sees it.
 * Every lead is logged to the server output, and — if the matching env vars are
 * set — pushed to a chat webhook and/or emailed via Resend.
 *
 *   LEAD_WEBHOOK_URL   Slack or Discord incoming webhook
 *   RESEND_API_KEY     Resend API key
 *   LEAD_NOTIFY_TO     comma-separated recipients (required for email)
 *   LEAD_NOTIFY_FROM   verified sender, defaults to onboarding@resend.dev
 *
 * Notification failures never fail the request — the row is already saved.
 */

type Fields = Record<string, string | null | undefined>;

const TIMEOUT_MS = 5000;

function lines(fields: Fields) {
  return Object.entries(fields)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`);
}

async function postWebhook(title: string, body: string[]) {
  const url = process.env.LEAD_WEBHOOK_URL;
  if (!url) return;

  const text = [`*${title}*`, ...body].join("\n");
  // Discord and Slack disagree on the payload key for a plain message.
  const payload = url.includes("discord.com")
    ? { content: `**${title}**\n${body.join("\n")}` }
    : { text };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`webhook ${res.status}: ${await res.text()}`);
  }
}

async function sendEmail(title: string, body: string[]) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_NOTIFY_TO;
  if (!key || !to) return;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.LEAD_NOTIFY_FROM || "onboarding@resend.dev",
      to: to.split(",").map((a) => a.trim()).filter(Boolean),
      subject: title,
      text: body.join("\n"),
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`resend ${res.status}: ${await res.text()}`);
  }
}

export async function notifyLead(title: string, fields: Fields) {
  const body = lines(fields);
  console.info(`[lead] ${title} — ${body.join(" | ")}`);

  // Settled, not all: one broken channel shouldn't silence the other.
  const results = await Promise.allSettled([
    postWebhook(title, body),
    sendEmail(title, body),
  ]);
  for (const r of results) {
    if (r.status === "rejected") console.error("lead notify failed:", r.reason);
  }
}
