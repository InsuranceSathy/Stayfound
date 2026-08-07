// Dodo webhook — the only thing that grants a StayFound account a paid plan.
//
// Point Dodo (Settings -> Webhooks) at:
//   https://<your-domain>/api/billing/webhook
// and put its signing secret in DODO_WEBHOOK_SECRET.
//
// Events to subscribe: subscription.active, subscription.renewed,
// subscription.on_hold, subscription.paused, subscription.plan_changed,
// subscription.cancelled, subscription.expired, subscription.failed.
//
// StayFound shares a Dodo business with NumberHill, so deliveries for
// NumberHill's products arrive here too, correctly signed. They are dropped by
// product id in lib/billing.ts — the signature proves who sent the event, not
// which brand it is about.

import { NextResponse } from "next/server";
import { applySubscriptionUpdate, parseSubscriptionEvent } from "@/lib/billing";
import { verifyStandardWebhook } from "@/lib/standard-webhooks";
import { reportConversion } from "@/lib/endorsely";

export async function POST(req: Request) {
  // Must be the raw text: the signature covers the exact bytes Dodo sent, so
  // parsing first and re-serialising would never verify.
  const raw = await req.text();

  const secret = process.env.DODO_WEBHOOK_SECRET;
  if (!secret) {
    // Fails closed even in development. An unsigned subscription webhook is a
    // free upgrade for anyone who can POST to this URL.
    console.error("billing webhook: DODO_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "billing webhook not configured" }, { status: 500 });
  }

  if (!verifyStandardWebhook(raw, req.headers, secret)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let event: unknown;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const type = (event as { type?: string })?.type;
  const update = parseSubscriptionEvent(event as Parameters<typeof parseSubscriptionEvent>[0]);
  if (!update) {
    // Payment-level events, and products this deployment does not sell. A 200
    // is correct: retrying would not make them relevant.
    return NextResponse.json({ received: true, ignored: true });
  }

  const result = await applySubscriptionUpdate(update);

  switch (result.status) {
    case "applied":
      // Money actually changed hands only on these two. `plan_changed` and the
      // cancel/pause family also apply cleanly to the row, but reporting them
      // would credit an affiliate a second commission for a plan switch.
      // Reported after the row is written, and never allowed to throw — see
      // lib/endorsely.ts for why a retry here would be worse than a miss.
      if (
        update.referralId &&
        (type === "subscription.active" || type === "subscription.renewed")
      ) {
        await reportConversion({
          referralId: update.referralId,
          plan: update.plan,
          interval: update.interval,
          customerId: update.customerId,
        });
      }
      return NextResponse.json({ received: true });
    case "stale":
      // A redelivery of an event that newer state has already superseded.
      return NextResponse.json({ received: true, ignored: true, reason: "out of order" });
    case "unknown-account":
      // Checkout metadata was missing and the subscription id matches no row —
      // a subscription created outside our checkout. Nothing to retry into.
      console.error("billing webhook: no account for subscription", update.subscriptionId);
      return NextResponse.json({ received: true, ignored: true, reason: "unknown account" });
    case "error":
      // 500 so Dodo retries: this event says someone has paid us.
      console.error("billing webhook: recording failed —", result.message);
      return NextResponse.json({ error: "recording failed" }, { status: 500 });
  }
}
