// The referral program, in one place because three things have to agree about
// it: the public /refer page, the dashboard panel, and the checkout route that
// forwards a referral id to Dodo.
//
// Attribution, commission calculation and payouts all live in a third-party
// affiliate platform. Dodo has no native affiliate management — it offers only
// cookies, checkout metadata and webhooks as integration points — and the part
// we would be building ourselves is not the tracking, it is affiliate KYC,
// refund clawbacks, payout rails and tax paperwork. So this module holds the
// terms we display and the switch that reveals the program; the referral id
// itself is read from the vendor's cookie in the checkout route and forwarded
// to Dodo as payment metadata, where the vendor picks it up from the webhook.
//
// Client-safe on purpose: nothing here reads a server-only env var, so the
// dashboard panel and the marketing page can both import it.

/**
 * Share of each payment a referrer earns.
 *
 * Must match the Commission Percentage on the Endorsely campaign — Endorsely
 * calculates what is actually owed, this number only decides what we promise.
 * A mismatch is a pricing page that lies to affiliates.
 */
export const REFERRAL_COMMISSION_PERCENT = 30;

/**
 * How long they keep earning it. Mirrors the campaign's Time Period (Months);
 * with Include Trial Period off, the clock starts at the first paid invoice.
 */
export const REFERRAL_COMMISSION_MONTHS = 12;

/**
 * Where an affiliate signs up and checks their balance — the vendor's portal,
 * not a page we host.
 *
 * Unset until a vendor is chosen, and that is what keeps the whole program
 * hidden: a "Refer & earn" button that leads nowhere is worse than no button,
 * the same reasoning as `checkoutOpen` in lib/plans.ts.
 *
 * NEXT_PUBLIC_ because the dashboard panel renders it client-side. Inlined at
 * build time, so changing it needs a rebuild rather than a restart.
 */
export function referralPortalUrl(): string | null {
  return process.env.NEXT_PUBLIC_REFERRAL_PORTAL_URL || null;
}

/**
 * Endorsely organisation id for the tracking script. Unset means no script,
 * which means no attribution — the program is simply off.
 */
export function endorselyOrgId(): string | null {
  return process.env.NEXT_PUBLIC_ENDORSELY_ORG_ID || null;
}

/**
 * The referral id for the visitor in this browser, or null.
 *
 * Endorsely's script exposes it as a global rather than a readable cookie —
 * `window.endorsely_referral` is the documented access path — so this has to be
 * read client-side and sent with the checkout request. That is the one thing
 * /api/billing/checkout accepts from a request body beyond plan and interval,
 * and it is safe because a referral id grants no entitlement: it decides who is
 * credited a commission, never what the payer receives.
 */
export function readReferralId(): string | null {
  if (typeof window === "undefined") return null;
  const id = (window as { endorsely_referral?: unknown }).endorsely_referral;
  return typeof id === "string" && id ? id : null;
}

/** What a referrer earns each month on a plan at `monthlyUsd`, as "8.70". */
export function commissionOn(monthlyUsd: number): string {
  return ((monthlyUsd * REFERRAL_COMMISSION_PERCENT) / 100).toFixed(2);
}

/**
 * The offer in one sentence, so the page and the panel cannot disagree.
 *
 * Built at call time rather than as a module constant, and as a single
 * template literal rather than two joined with `+`. The obvious form —
 * `` `…${PERCENT}% of every payment…` + `…${MONTHS} months.` `` — is
 * mis-folded by the build: the compiled chunk came out as
 * "Earn 30for their first 12 months.", silently dropping everything between
 * the `%` and the next substitution. Verified by grepping .next/server/chunks
 * after a clean build; the source bytes were correct.
 */
export function referralTerms(): string {
  const pct = `${REFERRAL_COMMISSION_PERCENT}%`;
  return `Earn ${pct} of every payment your referrals make, for their first ${REFERRAL_COMMISSION_MONTHS} months.`;
}
