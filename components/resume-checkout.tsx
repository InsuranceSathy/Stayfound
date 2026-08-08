"use client";

import { useEffect, useRef, useState } from "react";
import { readReferralId } from "@/lib/referral";
import { getPlan, type BillingInterval, type PlanId } from "@/lib/plans";

/**
 * Reopens the checkout someone started before they signed in.
 *
 * It runs on mount rather than behind a button: they already clicked "Get
 * Solo", and making them click again after a Google round-trip is a step that
 * only exists because of our own redirect. A manual button appears if the
 * automatic attempt fails, so a broken deployment does not leave a dead page.
 */
export function ResumeCheckout({
  plan,
  interval,
}: {
  plan: PlanId;
  interval: BillingInterval;
}) {
  const [error, setError] = useState<string | null>(null);
  // Effects run twice in dev StrictMode; opening two Dodo sessions for one
  // click would be sloppy rather than harmful, but the guard is one line.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    let cancelled = false;

    async function open() {
      try {
        const res = await fetch("/api/billing/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan, interval, referral: readReferralId() }),
        });

        if (res.status === 401) {
          // The session did not survive the round-trip. Sending them back to
          // /sign-in would loop, so say so plainly instead.
          if (!cancelled) setError("Your sign-in didn't stick. Please sign in and try again.");
          return;
        }

        const data = await res.json();
        if (!res.ok || !data.url) {
          if (!cancelled) {
            setError(data.error || "Couldn't open checkout. Please try again.");
          }
          return;
        }
        window.location.assign(data.url);
      } catch {
        if (!cancelled) setError("Couldn't reach the server. Please try again.");
      }
    }

    open();
    return () => {
      cancelled = true;
    };
  }, [plan, interval]);

  const name = getPlan(plan)?.name ?? plan;

  return (
    <div className="auth-shell">
      <div className="auth-card">
        {error ? (
          <>
            <h1 className="auth-title">Checkout didn&apos;t open</h1>
            <p className="auth-sub">{error}</p>
            <a href="/pricing" className="btn btn-primary">
              Back to pricing <span className="arr">→</span>
            </a>
          </>
        ) : (
          <>
            <h1 className="auth-title">Opening checkout…</h1>
            <p className="auth-sub">
              Taking you to the secure payment page for {name}. Don&apos;t
              refresh.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
