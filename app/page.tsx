import { VisibilityChart } from "@/components/visibility-chart";
import { AnswerScroller } from "@/components/answer-scroller";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WaitlistButton, WaitlistProvider } from "@/components/waitlist-form";

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
    <WaitlistProvider>
      <SiteHeader />

      <header className="hero">
        <div className="wrap">
          <div className="hero-top">
            <a
              href="https://www.producthunt.com/products/stayfound?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-stayfound"
              target="_blank"
              rel="noopener noreferrer"
              className="ph-badge"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1203821&theme=light&t=1784742393771"
                alt="StayFound - We help your site to be visible for every ai engine. | Product Hunt"
                width={250}
                height={54}
              />
            </a>
            <h1>
              Be the brand AI keeps <span className="em">recommending</span>
            </h1>
            <div className="cta-row">
              <WaitlistButton className="btn btn-primary btn-lg">
                Join the waitlist <span className="arr">→</span>
              </WaitlistButton>
              <a href="#inside" className="btn btn-bare btn-lg">
                See what&apos;s inside
              </a>
            </div>
            <p className="hero-sub">
              Early access is rolling out in batches. Join the waitlist — we&apos;ll
              run your first AI-visibility report as we onboard you.
            </p>
          </div>
        </div>

        <div className="annot" aria-hidden="true">
          <span>your real answers</span>
          <svg width="112" height="52" viewBox="0 0 112 52" fill="none">
            <path
              d="M2 8c34-6 68 2 88 24"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeDasharray="0 0"
            />
            <path
              d="M78 34l14 2-2-14"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="wrap">
          <div className="dash-shell">
            <div className="browser">
              <div className="browser-bar">
                <div className="lights">
                  <i />
                  <i />
                  <i />
                </div>
                <div className="browser-url">
                  stayfound.ai/<b>acme.com</b>
                </div>
                <svg
                  className="browser-exp"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                </svg>
              </div>

              <div className="dash">
                <div className="dash-bar">
                  <span className="dash-chip">
                    <span className="dot" />
                    acme.com
                  </span>
                  <span className="seg">
                    <span className="arw">‹</span>
                    <span>Last 7d</span>
                    <span className="on">Last 30d</span>
                    <span>Last 90d</span>
                    <span className="arw">›</span>
                  </span>
                  <span className="icon-btn">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M21 12a9 9 0 1 1-3-6.7" />
                      <path d="M21 3v6h-6" />
                    </svg>
                  </span>
                  <span className="dash-date">Jun 22 – Jul 21</span>
                </div>

                <div className="dash-kpis">
                  {KPIS.map((k) => (
                    <div key={k.l}>
                      <p className="kpi-l">{k.l}</p>
                      <div className="kpi-v">
                        {k.v}
                        <span
                          className="kv-d"
                          style={{ color: k.good ? "var(--good)" : "var(--bad)" }}
                        >
                          {k.d}
                        </span>
                      </div>
                      <p className="kpi-sub">{k.sub}</p>
                    </div>
                  ))}
                </div>

                <div className="panel-full">
                  <div className="panel-head">
                    <div>
                      <p className="metric-label" style={{ margin: 0 }}>
                        Answer share
                        <span className="metric-note">
                          {" "}
                          · 42 prompts × 5 engines, re-asked every 5 days
                        </span>
                      </p>
                    </div>
                    <div className="engines">
                      {ENGINE_ROWS.map((e) => (
                        <span className="pill" key={e.name}>
                          {e.name}
                          <b>{e.val}%</b>
                        </span>
                      ))}
                    </div>
                  </div>
                  <VisibilityChart />
                </div>

                <div className="dash-body">
                  <div className="panel left">
                    <div className="panel-tabs">
                      <span className="ptabs">
                        <span className="on">Prompt</span>
                        <span>Page</span>
                        <span>Topic</span>
                      </span>
                      <span className="sort-l">Answer share ↓</span>
                    </div>
                    <div className="prows">
                      {PROMPTS.map((p) => (
                        <div
                          className={`prow ${p.pos === null ? "lost" : ""}`}
                          key={p.q}
                        >
                          <span
                            className="prow-fill"
                            style={{ width: `${(p.val / 84) * 100}%` }}
                          />
                          <span className="prow-q">&ldquo;{p.q}&rdquo;</span>
                          <span
                            className="prow-eng"
                            title={`Named in ${p.engines} of ${ENGINE_COUNT} engines`}
                          >
                            {p.engines}/{ENGINE_COUNT}
                          </span>
                          <span
                            className="prow-pos"
                            title={
                              p.pos === null
                                ? `Not named — ${p.first}`
                                : `Ranked #${p.pos} — ${p.first}`
                            }
                          >
                            {p.pos === null ? "—" : `#${p.pos}`}
                          </span>
                          <span className="prow-val">{p.val}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="panel">
                    <div className="panel-tabs">
                      <span className="ptabs">
                        <span className="on">Competitor</span>
                        <span>Category</span>
                        <span>Source</span>
                      </span>
                      <span className="sort-l">Share of voice ↓</span>
                    </div>
                    <div className="hbars blue">
                      {RANKS.map((r, i) => (
                        <div
                          className={`hbar ${r.you ? "you" : ""}`}
                          key={r.name}
                        >
                          <span
                            className="hbar-fill"
                            style={{ width: `${(r.val / 61.5) * 100}%` }}
                          />
                          <span className="hbar-n">{i + 1}</span>
                          <span className="hbar-name">
                            {r.name}
                            {r.you && <span className="badge-you">You</span>}
                          </span>
                          <span
                            className="hbar-d"
                            style={{
                              color:
                                r.trend === "0.0"
                                  ? "var(--muted-2)"
                                  : r.up
                                    ? "var(--good)"
                                    : "var(--bad)",
                            }}
                          >
                            {r.trend === "0.0" ? "–" : `${r.trend}%`}
                          </span>
                          <span className="hbar-val">{r.val}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </header>

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
        <div className="wrap centered">
          <p className="sec-eyebrow">The StayFound loop</p>
          <h2 className="sec-title">Don&apos;t just watch AI search. Win it.</h2>
          <p className="sec-sub">
            Most tools stop at a dashboard. StayFound closes the loop — from
            seeing where you lose, to fixing it, to shipping the fix on its own.
          </p>
          <div className="loop">
            <div className="step">
              <div className="n">01 — Monitor</div>
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
              <div className="n">02 — Optimize</div>
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
              <div className="n">03 — Autopublish</div>
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

      <section id="why" className="section-pad" style={{ paddingTop: 0 }}>
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
        <div className="wrap">
          <div className="check">
            <p className="sec-eyebrow">Get your report</p>
            <h2 className="sec-title" style={{ marginBottom: 8 }}>
              See exactly where you stand in AI search
            </h2>
            <p className="sec-sub">
              Your visibility score, share of voice vs. competitors, how AI
              describes you, the sources it cites, and what to fix — across
              ChatGPT, Perplexity, Gemini, Claude and Grok. Join the waitlist and
              we&apos;ll run your first report as we onboard.
            </p>
            <div className="cta-row" style={{ marginTop: 24 }}>
              <WaitlistButton className="btn btn-primary btn-lg">
                Join the waitlist <span className="arr">→</span>
              </WaitlistButton>
              <a href="/demo" className="btn btn-bare btn-lg">
                Book a demo
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="final">
            <h2>Stop losing customers to answers you&apos;re not in.</h2>
            <p>
              We&apos;re onboarding brands in batches. Join the waitlist and get
              your AI-visibility report while you wait.
            </p>
            <div className="cta-row">
              <WaitlistButton className="btn btn-primary btn-lg">
                Join the waitlist <span className="arr">→</span>
              </WaitlistButton>
              <a href="/demo" className="btn btn-ghost btn-lg">
                Book a demo
              </a>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </WaitlistProvider>
  );
}
