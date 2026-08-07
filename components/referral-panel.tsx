import { referralPortalUrl, referralTerms } from "@/lib/referral";

/**
 * "Refer & earn" on the dashboard overview.
 *
 * A server component, because it has nothing to fetch and no state: the
 * affiliate's clicks, conversions and balance live in the affiliate platform's
 * own portal. Mirroring them here would create a second source of truth that
 * drifts from the one that decides what we actually pay out — the same reason
 * lib/billing.ts keeps one subscription row rather than a second ledger.
 *
 * Renders nothing until a portal url is configured, so the program cannot be
 * advertised before there is somewhere for it to lead.
 */
export function ReferralPanel() {
  const url = referralPortalUrl();
  if (!url) return null;

  return (
    <section className="panel">
      <div className="panel-head">
        <p className="res-h">Refer &amp; earn</p>
      </div>

      <p className="sec-sub">{referralTerms()}</p>

      <div className="billing-actions">
        <a
          className="btn btn-primary btn-sm"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Get your referral link <span className="arr">→</span>
        </a>
      </div>

      <p className="billing-note">
        Paid out quarterly, and reversed if a referred account refunds.{" "}
        <a href="/refer">Full terms</a>.
      </p>
    </section>
  );
}
