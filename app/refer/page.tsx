import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  REFERRAL_COMMISSION_MONTHS,
  REFERRAL_COMMISSION_PERCENT,
  commissionOn,
  referralPortalUrl,
  referralTerms,
} from "@/lib/referral";
import { requirePlan } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Refer & earn — StayFound",
  description:
    "Earn a recurring commission for every brand you send to StayFound. Free to join, paid quarterly.",
};

const FAQS = [
  {
    q: "Who can join?",
    a: "Anyone with an audience that cares about being found in AI search — consultants, SEO agencies, newsletter writers, founders. You don't need to be a StayFound customer.",
  },
  {
    q: "When do I get paid?",
    a: "Quarterly, once your balance clears the minimum. We pay by bank transfer; tell us your details when you join.",
  },
  {
    q: "What if someone I referred refunds or cancels?",
    a: "A refund reverses the commission for that payment. A cancellation simply stops future commissions — you keep everything already earned.",
  },
  {
    q: "How long does the cookie last?",
    a: "90 days from the click. If someone lands on your link and subscribes within that window, it's yours — even if they sign up later.",
  },
];

export default function ReferPage() {
  const url = referralPortalUrl();
  // No portal configured means no program yet. A page describing an offer
  // nobody can accept is worse than no page — and it would rank.
  if (!url) notFound();

  // requirePlan, not getPlan: these are constants, so a miss is a typo that
  // should throw at build rather than quietly render a sentence with a hole.
  const solo = requirePlan("solo");
  const teams = requirePlan("teams");

  return (
    <>
      <SiteHeader />
      <main>
        <section className="page-hero">
          <div className="wrap">
            <h1 className="page-title">
              Send us brands.
              <br />
              Earn every month they stay.
            </h1>
            <p className="page-lead">{referralTerms()} Free to join, no cap on
              how much you can earn, paid quarterly by bank transfer.</p>
            <a
              className="btn btn-primary"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Join the program <span className="arr">→</span>
            </a>
          </div>
        </section>

        <section className="wrap">
          <p className="pricing-note">
            {REFERRAL_COMMISSION_PERCENT}% of every payment means $
            {commissionOn(solo.monthly)}/mo on a {solo.name} account and $
            {commissionOn(teams.monthly)}/mo on a {teams.name} one, for their
            first {REFERRAL_COMMISSION_MONTHS} months.
          </p>
        </section>

        <section className="wrap faq-section">
          <h2 className="sec-title">How it works</h2>
          <div className="faq-list">
            {FAQS.map((f) => (
              <div key={f.q} className="faq">
                <h3>{f.q}</h3>
                <p>{f.a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
