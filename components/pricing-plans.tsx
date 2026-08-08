"use client";

import { useState } from "react";
import { WaitlistButton } from "@/components/waitlist-form";
import { readReferralId } from "@/lib/referral";
import { signInThenCheckout } from "@/lib/checkout-intent";
import {
  PLANS,
  YEARLY_MONTHS,
  checkoutOpen,
  displayMonthly,
  type BillingInterval,
  type PlanId,
} from "@/lib/plans";

function Check() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12.5l4.5 4.5L19 7.5"
        stroke="#FB4D17"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The pricing grid.
 *
 * Two modes, chosen by `checkoutOpen()`: while onboarding is done by hand every
 * CTA books a waitlist spot and the interval toggle is hidden — there is no
 * point choosing a billing period for something you cannot buy. Once checkout
 * is open the same cards sell the plans through Dodo.
 */
export function PricingPlans({ yearlyAvailable = false }: { yearlyAvailable?: boolean }) {
  const canBuy = checkoutOpen();
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [pending, setPending] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function subscribe(plan: PlanId) {
    setError(null);
    setPending(plan);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval, referral: readReferralId() }),
      });

      if (res.status === 401) {
        // Checkout needs an account to attach the subscription to. The chosen
        // plan rides along, so sign-in returns them to this purchase instead of
        // dumping them on the dashboard.
        window.location.assign(signInThenCheckout(plan, interval));
        return;
      }

      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error || "Couldn't start checkout. Please try again.");
        setPending(null);
        return;
      }
      // Dodo's hosted checkout — a full navigation, not a popup, so the card
      // form is on Dodo's origin where it belongs.
      window.location.assign(data.url);
    } catch {
      setError("Couldn't reach the server. Please try again.");
      setPending(null);
    }
  }

  return (
    <>
      {canBuy && yearlyAvailable && (
        <div className="interval-toggle" role="group" aria-label="Billing period">
          <button
            type="button"
            className={interval === "monthly" ? "on" : ""}
            aria-pressed={interval === "monthly"}
            onClick={() => setInterval("monthly")}
          >
            Monthly
          </button>
          <button
            type="button"
            className={interval === "yearly" ? "on" : ""}
            aria-pressed={interval === "yearly"}
            onClick={() => setInterval("yearly")}
          >
            Yearly
            <span className="save-tag">{12 - YEARLY_MONTHS} months free</span>
          </button>
        </div>
      )}

      <section className="wrap pricing-grid">
        {PLANS.map((t) => {
          const price = displayMonthly(t, interval);
          const free = t.monthly === 0;
          return (
            <div key={t.id} className={`tier ${t.featured ? "tier-featured" : ""}`}>
              {t.featured && <span className="tier-badge">Most popular</span>}
              <h2 className="tier-name">{t.name}</h2>
              <div className="tier-price">
                <span className="tier-amount">${price}</span>
                <span className="tier-cadence">
                  / {free ? "forever" : "per month"}
                </span>
              </div>
              {canBuy && !free && interval === "yearly" && (
                <p className="tier-billed">
                  ${t.monthly * YEARLY_MONTHS} billed yearly
                </p>
              )}
              <p className="tier-blurb">{t.blurb}</p>

              {!canBuy ? (
                <WaitlistButton
                  className={`btn ${t.featured ? "btn-primary" : "btn-ghost"} tier-cta`}
                >
                  Book a Spot
                </WaitlistButton>
              ) : free ? (
                <a
                  href="/sign-in"
                  className={`btn btn-ghost tier-cta`}
                >
                  Start for free <span className="arr">→</span>
                </a>
              ) : (
                <button
                  type="button"
                  className={`btn ${t.featured ? "btn-primary" : "btn-ghost"} tier-cta`}
                  onClick={() => subscribe(t.id)}
                  disabled={pending !== null}
                >
                  {pending === t.id ? "Opening checkout…" : `Get ${t.name}`}
                  {pending !== t.id && <span className="arr">→</span>}
                </button>
              )}

              <ul className="tier-features">
                {t.features.map((f) => (
                  <li key={f}>
                    <Check />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>

      {error && (
        <section className="wrap">
          <p className="check-error" style={{ textAlign: "center" }}>
            {error}
          </p>
        </section>
      )}
    </>
  );
}
