"use client";

import { useCallback, useEffect, useState } from "react";
import {
  PLANS,
  YEARLY_MONTHS,
  checkoutOpen,
  getPlan,
  type BillingInterval,
  type PlanId,
} from "@/lib/plans";
import { readReferralId } from "@/lib/referral";

type BillingInfo = {
  plan: PlanId;
  effectivePlan: PlanId;
  entitled: boolean;
  state: "free" | "active" | "never_started" | "lapsed";
  interval: BillingInterval;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  hasBillingAccount: boolean;
  checkoutAvailable: boolean;
  yearlyAvailable: boolean;
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * The dashboard's Billing panel.
 *
 * Client-side because it has to reflect a checkout that just completed: Dodo
 * returns the browser to /dashboard?checkout=complete before the webhook has
 * necessarily landed, so the panel polls briefly rather than showing the old
 * plan to someone who has just paid.
 */
export function BillingPanel() {
  const [info, setInfo] = useState<BillingInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Read once, at mount, rather than in an effect — the query string does not
  // change under us, and setting it from an effect is a cascading render. Safe
  // to touch `window` in the initializer only because the panel renders null
  // until `info` arrives, so the server and the first client render agree.
  const [justPaid] = useState(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("checkout") === "complete",
  );

  const load = useCallback(async (): Promise<BillingInfo | null> => {
    try {
      const res = await fetch("/api/billing/subscription", { cache: "no-store" });
      if (!res.ok) return null;
      const data: BillingInfo = await res.json();
      setInfo(data);
      return data;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let tries = 0;

    async function poll() {
      const data = await load();
      if (cancelled) return;
      // Stop as soon as the webhook has granted something, or after ~20s. A
      // webhook that never arrives is a configuration problem, and spinning
      // forever would hide it.
      if (!justPaid || (data && data.plan !== "free") || ++tries >= 10) return;
      setTimeout(poll, 2000);
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [load, justPaid]);

  async function subscribe(plan: PlanId, interval: BillingInterval) {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval, referral: readReferralId() }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error || "Couldn't start checkout. Please try again.");
        setBusy(false);
        return;
      }
      window.location.assign(data.url);
    } catch {
      setError("Couldn't reach the server. Please try again.");
      setBusy(false);
    }
  }

  async function openPortal() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error || "Couldn't open the billing portal.");
        setBusy(false);
        return;
      }
      window.location.assign(data.url);
    } catch {
      setError("Couldn't reach the server. Please try again.");
      setBusy(false);
    }
  }

  // Nothing to show until the plans are actually for sale.
  if (!checkoutOpen()) return null;
  if (!info) return null;

  const plan = getPlan(info.plan);
  const paying = info.plan !== "free";

  return (
    <section className="panel panel-billing">
      <div className="panel-head">
        <p className="res-h">Billing</p>
        <span className={`plan-chip ${info.entitled && paying ? "on" : ""}`}>
          {plan?.name ?? "Free"}
          {paying && ` · ${info.interval}`}
        </span>
      </div>

      {justPaid && !paying && (
        <p className="sec-sub">
          Payment received — we&apos;re waiting on Dodo to confirm it. This
          usually takes a few seconds.
        </p>
      )}

      {info.state === "active" && (
        <p className="sec-sub">
          {info.cancelAtPeriodEnd
            ? `Cancelled — you keep ${plan?.name} until ${formatDate(info.currentPeriodEnd)}.`
            : `Renews ${formatDate(info.currentPeriodEnd)}.`}
          {info.status === "on_hold" &&
            " Your last renewal charge didn't go through — update your card to avoid losing access."}
        </p>
      )}

      {info.state === "never_started" && (
        <p className="sec-sub">
          The first charge for {plan?.name} was declined, so the plan never
          started. You&apos;re on Free — try again with another card.
        </p>
      )}

      {info.state === "lapsed" && (
        <p className="sec-sub">
          Your {plan?.name} plan ended on {formatDate(info.currentPeriodEnd)}.
          You&apos;re on Free until you resubscribe.
        </p>
      )}

      {info.state === "free" && !justPaid && (
        <p className="sec-sub">
          You&apos;re on the Free plan — 1 brand, 15 tracked prompts, ChatGPT
          only. Upgrade for every engine and a daily refresh.
        </p>
      )}

      {!info.checkoutAvailable ? (
        <p className="check-error">
          Billing isn&apos;t configured on this deployment yet.
        </p>
      ) : (
        <div className="billing-actions">
          {PLANS.filter((p) => p.monthly > 0 && p.id !== info.plan).map((p) => (
            <button
              key={p.id}
              type="button"
              className={`btn ${p.featured ? "btn-primary" : "btn-ghost"} btn-sm`}
              disabled={busy}
              onClick={() => subscribe(p.id, info.interval)}
            >
              {paying ? `Switch to ${p.name}` : `Get ${p.name}`} — ${p.monthly}/mo
            </button>
          ))}
          {info.hasBillingAccount && (
            <button
              type="button"
              className="btn btn-bare btn-sm"
              disabled={busy}
              onClick={openPortal}
            >
              Manage billing
            </button>
          )}
        </div>
      )}

      {info.yearlyAvailable && info.interval === "monthly" && !paying && (
        <p className="billing-note">
          Yearly billing gives you {12 - YEARLY_MONTHS} months free — pick it on
          the <a href="/pricing">pricing page</a>.
        </p>
      )}

      {error && <p className="check-error">{error}</p>}
    </section>
  );
}
