import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WaitlistButton, WaitlistProvider } from "@/components/waitlist-form";
import { PricingPlans } from "@/components/pricing-plans";
import { checkoutOpen } from "@/lib/plans";
import { yearlyConfigured } from "@/lib/dodo";

export const metadata: Metadata = {
  title: "Pricing — StayFound",
  description:
    "Simple pricing for AI-search visibility. Track your brand across every AI engine and act on what you find.",
};

const FAQS = [
  {
    q: "What counts as a “tracked prompt”?",
    a: "A buyer question we run against the AI engines on your behalf — like “best project management software for startups.” We watch whether you’re mentioned and where you rank.",
  },
  {
    q: "Which AI engines do you cover?",
    a: "ChatGPT, Gemini, Perplexity, Claude, and Grok today, plus Copilot and Google AI Overviews. We add engines as they gain traction.",
  },
  {
    q: "Do I need to install anything?",
    a: "No. Add your brand and category and StayFound starts tracking — there is nothing to install.",
  },
  {
    q: "Can I change plans later?",
    a: "Anytime. Upgrade, downgrade, or cancel from your dashboard — changes are prorated.",
  },
];

export default function PricingPage() {
  // The page copy has two versions for the same reason the cards do: while
  // onboarding is manual the hero promises a human, and once checkout is open
  // it promises a working product. See `checkoutOpen` in lib/plans.ts.
  const canBuy = checkoutOpen();

  return (
    <>
      <SiteHeader />
      <main>
        <WaitlistProvider>
          <section className="page-hero">
            <div className="wrap">
              <h1 className="page-title">
                Win AI search.
                <br />
                Pay for what moves the needle.
              </h1>
              <p className="page-lead">
                {canBuy
                  ? "Start free, upgrade when the numbers move. Every plan tracks your brand across every AI engine — cancel from your dashboard anytime."
                  : "We're onboarding brands in batches while we scale. Here's what each plan will cost — book a spot and our team will get you set up."}
              </p>
            </div>
          </section>

          {/* Read on the server: only Dodo knows whether yearly products exist,
              and lib/dodo.ts must never reach the browser. */}
          <PricingPlans yearlyAvailable={yearlyConfigured()} />

          <section className="wrap">
            <p className="pricing-note">
              {canBuy
                ? "Prices in USD. Taxes are calculated at checkout, and your card statement will read StayFound.tech."
                : "No card required today — nothing is charged until our team has you up and running."}
            </p>
          </section>

          <section className="wrap">
            <div className="enterprise">
              <div>
                <h3>Enterprise</h3>
                <p>
                  Unlimited brands, custom prompt volume, SSO/SAML, a security
                  review, and a dedicated strategist. For teams where AI search is
                  a board-level number.
                </p>
              </div>
              <WaitlistButton className="btn btn-ghost">Book a Spot</WaitlistButton>
            </div>
          </section>
        </WaitlistProvider>

        <section className="wrap faq-section">
          <h2 className="sec-title">Questions, answered</h2>
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
