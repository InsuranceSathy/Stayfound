"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";
import { RESUME_PATH, safeNext } from "@/lib/checkout-intent";
import {
  getPlan,
  formatUSD,
  periodPrice,
  type BillingInterval,
  type Plan,
} from "@/lib/plans";
import { BrandMark } from "@/components/brand-mark";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.34A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.01-2.34z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.94l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}

export default function SignInPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buying, setBuying] = useState<
    { plan: Plan; interval: BillingInterval } | null
  >(null);

  // Someone arriving from a Get-<plan> button is mid-purchase, but the page
  // said nothing about it — a generic sign-in screen in the middle of a
  // checkout reads like the purchase was dropped. Read the plan out of `next`
  // after mount rather than with useSearchParams, which would pull this
  // statically prerendered page into a Suspense boundary.
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("next");
    if (!raw) return;
    try {
      const url = new URL(raw, window.location.origin);
      if (url.pathname !== RESUME_PATH) return;
      const plan = getPlan(url.searchParams.get("plan") ?? "");
      if (!plan) return;
      const interval: BillingInterval =
        url.searchParams.get("interval") === "yearly" ? "yearly" : "monthly";
      setBuying({ plan, interval });
    } catch {
      /* a malformed next is simply not a purchase */
    }
  }, []);

  async function continueWithGoogle() {
    setError(null);
    setLoading(true);
    try {
      // Read at click time rather than via useSearchParams, which would drag
      // this statically prerendered page into a Suspense boundary for a value
      // nothing renders. `safeNext` keeps it to same-origin paths — an
      // attacker-supplied `next` would otherwise make our sign-in page an open
      // redirect that arrives carrying our own credibility.
      const next = safeNext(
        new URLSearchParams(window.location.search).get("next"),
      );
      await signIn.social({ provider: "google", callbackURL: next });
    } catch {
      setError("Couldn't start sign-in. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <Link href="/" className="auth-brand">
          <BrandMark size={34} />
          StayFound
        </Link>
        {buying ? (
          <>
            <div className="auth-intent">
              <span className="auth-intent-k">continuing to</span>
              <span className="auth-intent-plan">{buying.plan.name}</span>
              <span className="auth-intent-price">
                ${formatUSD(periodPrice(buying.plan, buying.interval))}
                <span className="auth-intent-cadence">
                  {buying.interval === "yearly" ? "/year" : "/month"}
                </span>
              </span>
            </div>
            <h1 className="auth-title">One step before checkout</h1>
            <p className="auth-sub">
              Sign in so the subscription attaches to your account. You&apos;ll
              go straight to payment.
            </p>
          </>
        ) : (
          <>
            <h1 className="auth-title">Win customers in AI search</h1>
            <p className="auth-sub">
              Sign in to track your brand across every AI engine and take
              action.
            </p>
          </>
        )}

        <button
          className="google-btn"
          onClick={continueWithGoogle}
          disabled={loading}
        >
          <GoogleIcon />
          {loading
            ? "Redirecting to Google…"
            : buying
              ? "Continue with Google to pay"
              : "Continue with Google"}
        </button>

        {error && <p className="auth-error">{error}</p>}

        <p className="auth-fine">
          By continuing you agree to the{" "}
          <Link href="/terms" className="legal-link">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="legal-link">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
      <Link href="/" className="auth-back">
        ← Back to home
      </Link>
    </div>
  );
}
