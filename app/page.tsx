import { VisibilityChart } from "@/components/visibility-chart";
import { AnswerScroller } from "@/components/answer-scroller";
import { AnswerHero } from "@/components/answer-hero";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { VisibilityCheck } from "@/components/visibility-check";

const RANKS = [
  { name: "Your brand", you: true, val: 61.5, trend: "+4.2", up: true },
  { name: "Notion", val: 46.3, trend: "+0.6", up: true },
  { name: "Asana", val: 45.1, trend: "-0.6", up: false },
  { name: "Linear", val: 31.8, trend: "+3.8", up: true },
];

// Answer share per engine — shown as stat chips in the chart header rather than
// its own panel, so the fold still reaches the prompt and competitor tables.
const ENGINE_ROWS = [
  { name: "ChatGPT", val: 71 },
  { name: "Perplexity", val: 64 },
  { name: "Gemini", val: 48 },
  { name: "Claude", val: 39 },
  { name: "Grok", val: 22 },
];

const KPIS = [
  {
    l: "Answer share",
    v: "61.5%",
    d: "↑ 2.1",
    good: true,
    sub: "named in 29 / 42",
  },
  { l: "Avg. position", v: "2.3", d: "↑ 0.4", good: true, sub: "when named" },
  { l: "Citation rate", v: "38%", d: "↑ 6", good: true, sub: "answers linking you" },
  { l: "Answers lost", v: "13", d: "↓ 3", good: true, sub: "rival named, you weren't" },
  { l: "AI referrals", v: "1,284", d: "↑ 31%", good: true, sub: "clicks out of answers" },
];

// Prompt-level truth: AI search is won or lost one question at a time, so the
// unit of analysis is the prompt, not the day.
const PROMPTS = [
  {
    q: "best project management software for startups",
    pos: 1,
    engines: 5,
    val: 84,
    first: "You win it",
  },
  {
    q: "tools to track team workload across projects",
    pos: 2,
    engines: 4,
    val: 61,
    first: "Asana first",
  },
  {
    q: "notion vs asana for a small product team",
    pos: 3,
    engines: 4,
    val: 52,
    first: "Notion first",
  },
  {
    q: "cheapest alternative to monday.com",
    pos: null,
    engines: 1,
    val: 9,
    first: "Linear wins it",
  },
];
const ENGINE_COUNT = 5;

export default function Home() {
  return (
    <>
      <SiteHeader />

      <AnswerHero />

      <section id="engines" className="strip" style={{ marginTop: 90 }}>
        <div className="wrap strip-inner">
          <span className="strip-label">Tracking every answer engine</span>
          {["ChatGPT", "Gemini", "Perplexity", "Claude", "Grok", "Copilot", "AI Overviews"].map(
            (e) => (
              <span className="engine-name" key={e}>
                <span className="gd" />
                {e}
              </span>
            ),
          )}
        </div>
      </section>

      <AnswerScroller />

      <section id="loop" className="section-pad">
        <div className="wrap band">
          <div className="band-head">
            <h2 className="sec-title">Don&apos;t just watch AI search. Win it.</h2>
            <p className="sec-sub">
              Most tools stop at a dashboard. StayFound closes the loop — from
              seeing where you lose, to fixing it, to shipping the fix on its
              own.
            </p>
          </div>
          <div className="loop">
            <div className="step">
              <div className="n">
                <span className="n-num">01</span>
                <span className="n-lab">Monitor</span>
              </div>
              <div className="ic">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 17l5-5 4 3 8-8" />
                  <path d="M16 4h5v5" />
                </svg>
              </div>
              <h3>Track every mention</h3>
              <p>
                See exactly which prompts surface your brand across every major
                AI engine — and which competitor wins the ones you don&apos;t.
              </p>
              <div className="tag">ChatGPT · Gemini · Perplexity · Claude · Grok</div>
            </div>
            <div className="step">
              <div className="n">
                <span className="n-num">02</span>
                <span className="n-lab">Optimize</span>
              </div>
              <div className="ic">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
                  <circle cx="12" cy="12" r="3.4" />
                </svg>
              </div>
              <h3>Find the highest-leverage moves</h3>
              <p>
                StayFound reads the sources winning answers cite and tells you
                exactly what to change — the page, the claim, the comparison.
              </p>
              <div className="tag">Citation gaps · content briefs · prioritized by lift</div>
            </div>
            <div className="step">
              <div className="n">
                <span className="n-num">03</span>
                <span className="n-lab">Autopublish</span>
              </div>
              <div className="ic">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12l4 4L19 6" />
                  <path d="M3 19h18" />
                </svg>
              </div>
              <h3>Ship it automatically</h3>
              <p>
                Agentic actions publish the content and fixes that move your
                visibility — then measure the lift in leads, not vanity metrics.
              </p>
              <div className="tag">Agentic actions · ROI from AI search</div>
            </div>
          </div>
        </div>
      </section>

      <section id="why" className="statband">
        <div className="wrap why">
          <div>
            <div className="stat-big">60%</div>
            <p className="stat-cap">
              of Google searches now end without a click — the answer is the
              destination. AI assistants are next.
            </p>
          </div>
          <div>
            <p>
              Your buyers stopped scrolling ten blue links. They ask an
              assistant <em>&ldquo;what&apos;s the best tool for this?&rdquo;</em>{" "}
              and get one answer with a short list of names.
            </p>
            <p className="muted">
              If you&apos;re not on that list, you never enter the conversation —
              and you&apos;ll never see it in your analytics. StayFound makes that
              invisible funnel visible, then helps you win it.
            </p>
          </div>
        </div>
      </section>

      <section id="check" className="section-pad" style={{ paddingTop: 0 }}>
        <div className="wrap" id="report">
          <VisibilityCheck />
        </div>
      </section>

      {/* Tight bottom padding: the footer is the end-cap now, so the CTA card
          should sit close to it instead of floating in dead space. */}
      <section className="section-pad" style={{ paddingTop: 0, paddingBottom: 56 }}>
        <div className="wrap">
          <div className="final">
            <h2>Stop losing customers to answers you&apos;re not in.</h2>
            <p>
              Send us your domain and we&apos;ll run your AI-visibility report —
              no setup, no account.
            </p>
            <div className="cta-row">
              <a href="#report" className="btn btn-primary btn-lg">
                Get my free report <span className="arr">→</span>
              </a>
              <a href="/demo" className="btn btn-ghost btn-lg">
                Book a demo
              </a>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
