"use client";

import { useState } from "react";
import { readReferralId } from "@/lib/referral";
import { signInThenCheckout } from "@/lib/checkout-intent";
import { capture, EVENTS } from "@/lib/analytics";
import {
  PLANS,
  YEARLY_MONTHS,
  checkoutOpen,
  displayMonthly,
  isPaidPlan,
  periodPrice,
  requirePlan,
  type BillingInterval,
  type PlanId,
} from "@/lib/plans";

/**
 * What the free-report paywall opens with. Solo, because someone who just ran
 * one report on one brand has shown they want that brand tracked — but it is
 * now a starting position rather than the only thing on sale.
 */
const DEFAULT_PLAN: PlanId = "solo";

const PAID = PLANS.filter((p) => isPaidPlan(p.id));

/**
 * The checkout the paywall and every locked block share.
 *
 * One hook rather than per-button state, because the plan chips live in the
 * paywall while the unlock bars sit hundreds of pixels above it: a visitor who
 * picks Agencies and then clicks a blurred paragraph has to reach the Agencies
 * checkout, not the default one.
 */
export function usePlanCheckout() {
  const [plan, setPlan] = useState<PlanId>(DEFAULT_PLAN);
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * The paywall CTA, on the subscription checkout that the rest of the app
   * uses. It replaced a separate /api/checkout route that opened a one-time
   * `/payments` link: that one recorded nothing, so a customer who paid got no
   * entitlement, and its single product id was not tied to a plan.
   *
   * This is a public page, so most people clicking are signed out — checkout
   * needs an account to attach the subscription to. Every failure falls back to
   * /pricing rather than dead-ending on an error: whatever went wrong, the page
   * that lists the plans is somewhere useful to be.
   */
  async function startCheckout() {
    capture(EVENTS.PAYWALL_CTA_CLICKED, { plan, interval });
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval, referral: readReferralId() }),
      });

      if (res.status === 401) {
        // Signed out, which is the normal case on a public marketing page. The
        // chosen plan travels through sign-in so they come back to *this*
        // purchase rather than the default one.
        window.location.assign(signInThenCheckout(plan, interval));
        return;
      }

      const data = await res.json();
      if (data.url) window.location.assign(data.url);
      else window.location.assign("/pricing");
    } catch {
      window.location.assign("/pricing");
    }
  }

  return {
    plan,
    setPlan,
    interval,
    setInterval,
    pending,
    error,
    setError,
    startCheckout,
    selected: requirePlan(plan),
  };
}

type PickerProps = ReturnType<typeof usePlanCheckout> & {
  /** Whether Dodo has yearly products configured — resolved on the server. */
  yearlyAvailable?: boolean;
};

/**
 * Plan chips, billing period, and the one button that buys whatever they add up
 * to. Every plan is reachable here; the compare-plans link beside it is for
 * reading the feature lists, not for finding a second way to pay.
 */
export function PlanPicker({
  plan,
  setPlan,
  interval,
  setInterval,
  pending,
  startCheckout,
  selected,
  yearlyAvailable = false,
}: PickerProps) {
  // A chooser that cannot buy is worse than no chooser: while checkout is
  // closed the whole thing collapses to the page that explains the plans.
  if (!checkoutOpen()) {
    return (
      <div className="cta-row" style={{ justifyContent: "center" }}>
        <a href="/pricing" className="btn btn-primary btn-lg">
          See plans <span className="arr">→</span>
        </a>
        <a href="https://app.stayfound.tech" className="btn btn-bare btn-lg">
          Log in
        </a>
      </div>
    );
  }

  return (
    <>
      {yearlyAvailable && (
        <div className="interval-toggle" role="group" aria-label="Billing period">
          <button
            type="button"
            className={`interval ${interval === "monthly" ? "on" : ""}`}
            aria-pressed={interval === "monthly"}
            onClick={() => setInterval("monthly")}
          >
            Monthly
          </button>
          <button
            type="button"
            className={`interval ${interval === "yearly" ? "on" : ""}`}
            aria-pressed={interval === "yearly"}
            onClick={() => setInterval("yearly")}
          >
            Yearly
            <span className="save-tag">{12 - YEARLY_MONTHS} months free</span>
          </button>
        </div>
      )}

      <div className="plan-pick" role="group" aria-label="Plan">
        {PAID.map((p) => (
          <button
            key={p.id}
            type="button"
            className={p.id === plan ? "on" : ""}
            aria-pressed={p.id === plan}
            onClick={() => setPlan(p.id)}
          >
            <span className="plan-pick-name">{p.name}</span>
            <span className="plan-pick-price">
              ${displayMonthly(p, interval)}
            </span>
          </button>
        ))}
      </div>

      <div className="cta-row" style={{ justifyContent: "center" }}>
        <button
          className="btn btn-primary btn-lg"
          onClick={startCheckout}
          disabled={pending}
        >
          {pending
            ? "Opening checkout…"
            : `Get ${selected.name} — $${displayMonthly(selected, interval)}/mo`}
          {!pending && <span className="arr">→</span>}
        </button>
        <a href="https://app.stayfound.tech" className="btn btn-bare btn-lg">
          Log in
        </a>
      </div>

      {interval === "yearly" && (
        <p className="plan-pick-billed">
          ${periodPrice(selected, "yearly")} billed yearly
        </p>
      )}
    </>
  );
}
