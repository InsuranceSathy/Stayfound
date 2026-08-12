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
export function usePlanCheckout({
  /**
   * Where a failed checkout lands. The paywall sends people to /pricing — the
   * page that lists the plans is somewhere useful to be whatever went wrong.
   * The pricing page itself cannot do that (it *is* /pricing), so it shows the
   * error in place instead.
   */
  onFailure = "navigate",
}: { onFailure?: "navigate" | "inline" } = {}) {
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
  async function startCheckout(choice?: PlanId) {
    // A pricing card names its own plan; the paywall CTA buys whatever chip is
    // selected. Same call either way.
    const buying = choice ?? plan;
    if (choice && choice !== plan) setPlan(choice);

    capture(EVENTS.PAYWALL_CTA_CLICKED, { plan: buying, interval });
    setPending(true);
    setError(null);

    function fail(message: string) {
      if (onFailure === "navigate") window.location.assign("/pricing");
      else {
        setError(message);
        setPending(false);
      }
    }

    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: buying, interval, referral: readReferralId() }),
      });

      if (res.status === 401) {
        // Signed out, which is the normal case on a public marketing page. The
        // chosen plan travels through sign-in so they come back to *this*
        // purchase rather than the default one.
        window.location.assign(signInThenCheckout(buying, interval));
        return;
      }

      const data = await res.json().catch(() => null);
      // Dodo's hosted checkout — a full navigation, not a popup, so the card
      // form is on Dodo's origin where it belongs.
      if (res.ok && data?.url) window.location.assign(data.url);
      else fail(data?.error || "Couldn't start checkout. Please try again.");
    } catch {
      fail("Couldn't reach the server. Please try again.");
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
    /**
     * Buy whatever is currently selected. Separate from `startCheckout` so it
     * can be handed straight to an onClick without React passing the click
     * event in as the plan id.
     */
    buySelected: () => startCheckout(),
    selected: requirePlan(plan),
  };
}

type PickerProps = ReturnType<typeof usePlanCheckout> & {
  /** Whether Dodo has yearly products configured — resolved on the server. */
  yearlyAvailable?: boolean;
};

/**
 * The monthly/yearly switch, shared by the pricing grid and the report paywall
 * so the billing period is chosen the same way wherever it is offered.
 *
 * Renders nothing unless yearly products exist and checkout is open: there is
 * no point choosing a billing period for something that cannot be bought.
 */
export function IntervalToggle({
  interval,
  setInterval,
  yearlyAvailable = false,
}: {
  interval: BillingInterval;
  setInterval: (i: BillingInterval) => void;
  yearlyAvailable?: boolean;
}) {
  if (!yearlyAvailable || !checkoutOpen()) return null;
  return (
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
  );
}

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
  buySelected,
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
      <IntervalToggle
        interval={interval}
        setInterval={setInterval}
        yearlyAvailable={yearlyAvailable}
      />

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
          onClick={buySelected}
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
