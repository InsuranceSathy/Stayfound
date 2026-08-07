// Reporting conversions to Endorsely, the affiliate platform.
//
// SERVER ONLY — it reads ENDORSELY_API_SECRET.
//
// Endorsely has no Dodo Payments integration, so nothing tells it a referred
// visitor paid except us: the referral id rides along in Dodo's payment
// metadata (set in lib/dodo.ts) and comes back on the webhook, which calls
// this. Repeat calls for the same referral id accumulate on Endorsely's side,
// which is what makes a renewal just another call rather than a special case.
//
// The amount we report is our own list price, not what Dodo charged. Dodo bills
// in the buyer's currency with local tax on top, and commission is owed on the
// pre-tax sale — reporting the gross INR figure would pay affiliates a
// commission on Nepali/Indian tax.

import { getPlan, periodPrice, type BillingInterval, type PlanId } from "./plans";

const ENDPOINT = "https://app.endorsely.com/api/public/refer";

function config(): { secret: string; orgId: string } | null {
  const secret = process.env.ENDORSELY_API_SECRET;
  const orgId = process.env.NEXT_PUBLIC_ENDORSELY_ORG_ID;
  return secret && orgId ? { secret, orgId } : null;
}

/**
 * Tell Endorsely a referred account paid.
 *
 * Never throws. The only caller is the Dodo webhook, and Dodo retries on a
 * 500 — so letting an Endorsely outage bubble up would turn one missed
 * commission into a retry loop that also re-applies subscription state. A
 * dropped commission is recoverable by hand from Dodo's payment metadata; a
 * webhook that will not stay delivered is not.
 */
export async function reportConversion(opts: {
  referralId: string;
  plan: PlanId;
  interval: BillingInterval;
  customerId?: string | null;
}): Promise<void> {
  const cfg = config();
  if (!cfg) return;

  const plan = getPlan(opts.plan);
  if (!plan) return;

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        referralId: opts.referralId,
        organizationId: cfg.orgId,
        // Endorsely takes cents.
        amount: Math.round(periodPrice(plan, opts.interval) * 100),
        customerId: opts.customerId ?? undefined,
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(
        `endorsely: conversion not recorded — ${res.status} ${await res.text()}`,
      );
    }
  } catch (err) {
    console.error("endorsely: conversion request failed —", err);
  }
}
