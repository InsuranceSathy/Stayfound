"use client";

import { WaitlistButton } from "@/components/waitlist-form";
import { IntervalToggle, usePlanCheckout } from "@/components/plan-checkout";
import {
  PLANS,
  YEARLY_MONTHS,
  checkoutOpen,
  displayMonthly,
} from "@/lib/plans";

function Check() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12.5l4.5 4.5L19 7.5"
        stroke="currentColor"
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
  // Same checkout the report paywall uses. The two surfaces look nothing alike
  // — a feature grid here, three chips there — but the call, the 401 handoff,
  // the referral tag and the analytics are one implementation, so a fix to
  // buying applies wherever buying happens. `inline` because the fallback for a
  // failed checkout is /pricing, and this *is* /pricing.
  const { interval, setInterval, plan: buying, pending, error, startCheckout } =
    usePlanCheckout({ onFailure: "inline" });

  return (
    <>
      <IntervalToggle
        interval={interval}
        setInterval={setInterval}
        yearlyAvailable={yearlyAvailable}
      />

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
                  onClick={() => startCheckout(t.id)}
                  disabled={pending}
                >
                  {pending && buying === t.id
                    ? "Opening checkout…"
                    : `Get ${t.name}`}
                  {!(pending && buying === t.id) && <span className="arr">→</span>}
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
