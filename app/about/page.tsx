import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "About — StayFound",
  description:
    "StayFound makes sure great companies aren't invisible to AI. We help brands win customers in AI search.",
};

const PRINCIPLES = [
  {
    n: "01",
    h: "Outcomes over dashboards",
    p: "A pretty chart that tells you you're losing isn't a product. We measure success in leads won, not metrics watched.",
  },
  {
    n: "02",
    h: "Close the loop",
    p: "Monitor, optimize, prove. We don't stop at the problem — we hand you the fix and measure whether it landed.",
  },
  {
    n: "03",
    h: "Honest by default",
    p: "AI answers change fast. We show you what we actually observe, label estimates as estimates, and never inflate a number.",
  },
];

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="page-hero">
          <div className="wrap">
            <h1 className="page-title">
              Great companies shouldn&apos;t be
              <br />
              invisible to AI.
            </h1>
            <p className="page-lead">
              Search is becoming answers. We make sure the brands that deserve to
              be recommended actually are.
            </p>
          </div>
        </section>

        <section className="wrap prose-section">
          <div className="prose">
            <p>
              For twenty years, winning customers online meant winning Google.
              You earned a rank, you earned a click. That bargain is ending.
            </p>
            <p>
              Buyers now ask ChatGPT, Gemini, Perplexity, Claude, and Grok{" "}
              <em>&ldquo;what&apos;s the best tool for this?&rdquo;</em> and get a
              single answer with a short list of names. There&apos;s no page two.
              If you&apos;re not in the answer, you never enter the conversation —
              and you won&apos;t even see it happen in your analytics.
            </p>
            <p>
              We built <strong>StayFound</strong> because that invisible funnel is
              already costing companies real revenue, and the tools to fight back
              didn&apos;t exist. Most of what shipped first just watches the
              problem. We wanted something that wins.
            </p>
            <p>
              So StayFound does the whole loop: it shows you exactly where you lose
              across every AI engine, finds the highest-leverage moves to fix it,
              and ships those fixes for you — then measures the lift in customers,
              not vanity scores.
            </p>
          </div>
        </section>

        <section className="wrap principles-section">
          <h2 className="sec-title">What we believe</h2>
          <div className="principles">
            {PRINCIPLES.map((pr) => (
              <div key={pr.n} className="principle">
                <span className="principle-n">{pr.n}</span>
                <h3>{pr.h}</h3>
                <p>{pr.p}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="wrap">
          <div className="status-card">
            <p className="status-text">
              StayFound is in <strong>private beta</strong>, onboarding design
              partners in 2026. We&apos;re building in the open with the teams
              feeling this shift first. Want in?
            </p>
            <div className="cta-row">
              <Link href="/sign-in" className="btn btn-primary">
                Get started <span className="arr">→</span>
              </Link>
              <Link href="/demo" className="btn btn-ghost">
                Talk to a founder
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
