import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WaitlistButton, WaitlistProvider } from "@/components/waitlist-form";

export const metadata: Metadata = {
  title: "Pricing — StayFound",
  description:
    "Simple pricing for AI-search visibility. Book a spot on the waitlist and our team will get you set up.",
};

const TIERS = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    blurb: "See where you stand. No card required.",
    featured: false,
    features: [
      "1 brand",
      "15 tracked prompts",
      "ChatGPT only",
      "Weekly refresh",
      "Visibility score + competitor ranking",
    ],
  },
  {
    name: "Growth",
    price: "$149",
    cadence: "per month",
    blurb: "For teams ready to win AI search.",
    featured: true,
    features: [
      "3 brands",
      "150 tracked prompts",
      "All engines — ChatGPT, Gemini, Perplexity, Claude, Grok",
      "Daily refresh",
      "Citations + You-vs-Competitors",
      "Optimization recommendations",
      "Email + Slack alerts",
    ],
  },
  {
    name: "Scale",
    price: "$499",
    cadence: "per month",
    blurb: "Close the loop — on autopilot.",
    featured: false,
    features: [
      "10 brands",
      "Unlimited tracked prompts",
      "Everything in Growth",
      "Agentic Actions — autopublish fixes",
      "AI referral + ROI analytics",
      "API access & integrations",
      "Priority support",
    ],
  },
];

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
    a: "No. Add your brand and category and StayFound starts tracking. Connecting your CMS is optional and only needed for autopublish.",
  },
  {
    q: "Can I change plans later?",
    a: "Anytime. Upgrade, downgrade, or cancel from your dashboard — changes are prorated.",
  },
];

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

export default function PricingPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <WaitlistProvider>
          <section className="page-hero">
            <div className="wrap">
              <p className="eyebrow">Pricing</p>
              <h1 className="page-title">
                Win AI search.
                <br />
                Pay for what moves the needle.
              </h1>
              <p className="page-lead">
                We&apos;re onboarding brands in batches while we scale. Here&apos;s
                what each plan will cost — book a spot and our team will get you
                set up.
              </p>
            </div>
          </section>

          <section className="wrap pricing-grid">
            {TIERS.map((t) => (
              <div key={t.name} className={`tier ${t.featured ? "tier-featured" : ""}`}>
                {t.featured && <span className="tier-badge">Most popular</span>}
                <h2 className="tier-name">{t.name}</h2>
                <div className="tier-price">
                  <span className="tier-amount">{t.price}</span>
                  <span className="tier-cadence">/ {t.cadence}</span>
                </div>
                <p className="tier-blurb">{t.blurb}</p>
                <WaitlistButton
                  className={`btn ${t.featured ? "btn-primary" : "btn-ghost"} tier-cta`}
                >
                  Book a Spot
                </WaitlistButton>
                <ul className="tier-features">
                  {t.features.map((f) => (
                    <li key={f}>
                      <Check />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>

          <section className="wrap">
            <p className="pricing-note">
              No card required today — nothing is charged until our team has you
              up and running.
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
