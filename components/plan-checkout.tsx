"use client";

import { useState } from "react";
import { readReferralId } from "@/lib/referral";
import { signInThenCheckout } from "@/lib/checkout-intent";
import { capture, EVENTS } from "@/lib/analytics";
import {
  YEARLY_MONTHS,
  checkoutOpen,
  type BillingInterval,
  type PlanId,
} from "@/lib/plans";

/**
 * Buying, in one implementation.
 *
 * Prices are presented in exactly one marketing surface — the pricing grid —
 * but the *call* is worth keeping separate from it: the dashboard billing panel
 * upgrades an existing subscription through the same route, and a fix to the
 * 401 handoff or the referral tag has to apply everywhere buying happens.
 */
export function usePlanCheckout({
  /**
   * Where a failed checkout lands. `navigate` sends people to /pricing — the
   * page that lists the plans is somewhere useful to be whatever went wrong.
   * The pricing page itself cannot do that (it *is* /pricing), so it shows the
   * error in place instead.
   */
  onFailure = "navigate",
}: { onFailure?: "navigate" | "inline" } = {}) {
  const [plan, setPlan] = useState<PlanId | null>(null);
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Open Dodo's hosted checkout for a plan.
   *
   * Most callers are public pages, so the buyer is usually signed out —
   * checkout needs an account to attach the subscription to, and the chosen
   * plan travels through sign-in so they come back to the purchase they
   * started rather than landing on a dashboard they did not ask for.
   */
  async function startCheckout(choice: PlanId) {
    setPlan(choice);
    capture(EVENTS.PAYWALL_CTA_CLICKED, { plan: choice, interval });
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
        body: JSON.stringify({
          plan: choice,
          interval,
          referral: readReferralId(),
        }),
      });

      if (res.status === 401) {
        window.location.assign(signInThenCheckout(choice, interval));
        return;
      }

      const data = await res.json().catch(() => null);
      // A full navigation, not a popup, so the card form is on Dodo's origin
      // where it belongs.
      if (res.ok && data?.url) window.location.assign(data.url);
      else fail(data?.error || "Couldn't start checkout. Please try again.");
    } catch {
      fail("Couldn't reach the server. Please try again.");
    }
  }

  return { plan, interval, setInterval, pending, error, startCheckout };
}

/**
 * The monthly/yearly switch.
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
