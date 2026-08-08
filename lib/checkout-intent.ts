// Carrying "I was trying to buy X" through a sign-in.
//
// Checkout needs an account to attach the subscription to, but the pricing page
// and the free-report paywall are public, so most people who click Get Solo are
// signed out. The first version sent them to /sign-in and stopped there — and
// /sign-in always finishes at /dashboard, so the purchase they started
// evaporated and they landed on a dashboard they had not asked for. From the
// outside that looks exactly like "checkout doesn't work".
//
// So the plan travels with them: CTA -> /sign-in?next=/billing/resume?plan=…
// -> Google -> /billing/resume, which opens the Dodo checkout they originally
// clicked. Client-safe; no env access.

import type { BillingInterval, PlanId } from "./plans";

/** Where a signed-in browser is sent to actually open checkout. */
export const RESUME_PATH = "/billing/resume";

/** The resume url for a plan — also the `next` value handed to /sign-in. */
export function resumeUrl(plan: PlanId, interval: BillingInterval): string {
  return `${RESUME_PATH}?plan=${encodeURIComponent(plan)}&interval=${encodeURIComponent(interval)}`;
}

/**
 * Where to send a 401 from the checkout route: sign in, then come back and buy.
 */
export function signInThenCheckout(plan: PlanId, interval: BillingInterval): string {
  return `/sign-in?next=${encodeURIComponent(resumeUrl(plan, interval))}`;
}

/**
 * A `next` value that is safe to redirect to after sign-in.
 *
 * Only same-origin paths. Without this check, `?next=https://evil.example` would
 * turn our own sign-in page into an open redirect that arrives with the user's
 * trust — and the credential-phishing version of that is indistinguishable from
 * the real thing. `//host` and `/\host` are rejected too: both are
 * protocol-relative urls that browsers happily send off-site.
 */
export function safeNext(next: string | null | undefined, fallback = "/dashboard"): string {
  if (!next) return fallback;
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
