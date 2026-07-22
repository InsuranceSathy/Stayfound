import { VisibilityChart } from "@/components/visibility-chart";
import { VisibilityCheck } from "@/components/visibility-check";
import { AeoScore } from "@/components/aeo-score";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const RANKS = [
  { name: "Your brand", you: true, val: "61.5%", trend: "↑ 4.2", up: true },
  { name: "Notion", val: "46.3%", trend: "↑ 0.6", up: true },
  { name: "Asana", val: "45.1%", trend: "↓ 0.6", up: false },
  { name: "Linear", val: "31.8%", trend: "↑ 3.8", up: true },
  { name: "Monday", val: "22.6%", trend: "0.0", up: true },
];

export default function Home() {
  return (
    <>
      <SiteHeader />

      <header className="hero">
        <div className="wrap">
          <div className="hero-top">
            <div>
              <p className="eyebrow">AI search visibility suite</p>
              <h1>
                Be the answer
                <br />
                AI <span className="em">gives.</span>
              </h1>
            </div>
            <div className="lead-col">
              <p className="lead">
                See how ChatGPT, Gemini, Perplexity, Claude, and Grok talk about
                your brand — then take action to win the leads before your
                competitors do.
              </p>
              <div className="cta-row">
                <a href="/sign-in" className="btn btn-primary">
                  Get started <span className="arr">→</span>
                </a>
                <a href="#check" className="btn btn-ghost">
                  See a live demo
                </a>
              </div>
              <div className="proof">
                <span className="dot-live" /> Now in private beta — onboarding
                design partners
              </div>
            </div>
          </div>

          <div className="dash-shell">
            <div className="dash">
              <div className="dash-top">
                <div className="dash-icon">
                  <svg width="14" height="14" viewBox="0 0 28 28" aria-hidden="true">
                    <circle cx="14" cy="11" r="4" fill="#FB4D17" />
                    <line
                      x1="6"
                      y1="18"
                      x2="22"
                      y2="18"
                      stroke="#fff"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div className="dash-tabs">
                  <span className="tab on">Visibility</span>
                  <span className="tab">Citations</span>
                  <span className="tab">Prompts</span>
                  <span className="tab">You vs. Competitors</span>
                  <span className="tab">Actions</span>
                  <span className="tab">Analytics</span>
                </div>
                <span className="pill on">
                  <span className="led" />
                  ChatGPT
                </span>
              </div>

              <div className="dash-body">
                <div className="panel left">
                  <div className="panel-head">
                    <div>
                      <p className="metric-label">Visibility score · last 7 days</p>
                      <div className="metric">
                        61.5%<span className="delta">↑ 2.1%</span>
                      </div>
                      <p className="sub-note">Mentioned in 29 / 42 tracked prompts</p>
                    </div>
                    <div className="engines">
                      <span className="pill on">
                        <span className="led" />
                        ChatGPT
                      </span>
                      <span className="pill">
                        <span className="led" />
                        Gemini
                      </span>
                      <span className="pill">
                        <span className="led" />
                        Claude
                      </span>
                    </div>
                  </div>
                  <VisibilityChart />
                </div>

                <div className="panel">
                  <p className="rank-head">Share of voice · ranking</p>
                  <p className="rank-cat">Category: project management software</p>
                  {RANKS.map((r, i) => (
                    <div className={`row ${r.you ? "you" : ""}`} key={r.name}>
                      <span className="rank-n">{i + 1}</span>
                      <span className="rank-name">
                        {r.name}
                        {r.you && <span className="badge-you">You</span>}
                      </span>
                      <span
                        className={`rank-trend ${
                          r.trend === "0.0" ? "" : r.up ? "up" : "down"
                        }`}
                      >
                        {r.trend === "0.0" ? "–" : `${r.trend}%`}
                      </span>
                      <span className="rank-val">{r.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section id="loop" className="section-pad">
        <div className="wrap">
          <p className="sec-eyebrow">The Surfaced loop</p>
          <h2 className="sec-title">Don&apos;t just watch AI search. Win it.</h2>
          <p className="sec-sub">
            Most tools stop at a dashboard. Surfaced closes the loop — from
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
                  stroke="#FB4D17"
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
                  stroke="#FB4D17"
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
                Surfaced reads the sources winning answers cite and tells you
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
                  stroke="#FB4D17"
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

      <section id="engines" className="strip">
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

      <section id="why" className="section-pad">
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
              and you&apos;ll never see it in your analytics. Surfaced makes that
              invisible funnel visible, then helps you win it.
            </p>
          </div>
        </div>
      </section>

      <section id="check" className="section-pad" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <VisibilityCheck />
          <div style={{ height: 20 }} />
          <AeoScore />
        </div>
      </section>

      <section className="section-pad" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="final">
            <h2>Stop losing customers to answers you&apos;re not in.</h2>
            <p>
              Get your AI visibility report in minutes. See where you stand
              across every engine, free.
            </p>
            <div className="cta-row">
              <a href="/sign-in" className="btn btn-primary">
                Get started <span className="arr">→</span>
              </a>
              <a href="#check" className="btn btn-ghost">
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
