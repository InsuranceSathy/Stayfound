import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { DemoForm } from "@/components/demo-form";

export const metadata: Metadata = {
  title: "Book a demo — StayFound",
  description:
    "See StayFound on your own brand. We'll show you exactly where you stand in AI search and how to win.",
};

const POINTS = [
  {
    h: "Your real visibility, live",
    p: "We run your brand against ChatGPT, Gemini, Perplexity, Claude, and Grok before the call — you see exactly where you stand.",
  },
  {
    h: "Where competitors beat you",
    p: "We'll show the prompts you're losing and the citations winning answers rely on.",
  },
  {
    h: "A plan to win",
    p: "Leave with the three highest-leverage moves to climb the answers — whether or not you buy.",
  },
];

export default function DemoPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="page-hero">
          <div className="wrap">
            <h1 className="page-title">See StayFound on your brand.</h1>
            <p className="page-lead">
              A 30-minute walkthrough on your real data. No slideware — just where
              you stand in AI search and how to win.
            </p>
          </div>
        </section>

        <section className="wrap demo-layout">
          <div className="demo-points">
            {POINTS.map((pt) => (
              <div key={pt.h} className="demo-point">
                <span className="demo-dot" />
                <div>
                  <h3>{pt.h}</h3>
                  <p>{pt.p}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="demo-card">
            <DemoForm />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
