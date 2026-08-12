"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlanPicker, usePlanCheckout } from "@/components/paywall-cta";
import { capture, EVENTS } from "@/lib/analytics";
import { ScanProgress } from "@/components/scan-progress";
import { measuredAgo } from "@/lib/report-derive";

/**
 * How many items in each locked block keep a readable heading. Everything past
 * the count blurs whole, heading included.
 *
 * This is the one dial for how much of the report the free check gives away —
 * change these numbers rather than the JSX. `themes` counts per column, so 1
 * shows one ✓ and one ✕.
 */
const REVEAL = { actions: 2, themes: 1, cited: 1, ideas: 1 };

type Engine = { name: string; mentioned: boolean; score: number };
type Competitor = { name: string; share: number; you?: boolean };
type Action = { title: string; detail: string; impact: "high" | "medium" | "low" };
type Theme = { theme: string; quote: string };
type Sentiment = {
  label: string;
  positivePct: number;
  negativePct: number;
  positiveThemes: Theme[];
  negativeThemes: Theme[];
} | null;
type ContentIdea = { type: string; title: string; description: string };
type CitedSource = { domain: string; note: string; isYou?: boolean };
type Result = {
  score: number;
  summary: string;
  engines: Engine[];
  competitors: Competitor[];
  actions: Action[];
  sentiment?: Sentiment;
  contentIdeas?: ContentIdea[];
  citedSources?: CitedSource[];
};

/**
 * The blur that makes the free report a sample rather than the product.
 *
 * Wraps body copy — a move's detail, a theme's quote — or, for everything past
 * the first item in a block, the whole item. It is `aria-hidden` because
 * unreadable text is noise to a screen reader; the unlock button below each
 * block is the accessible way through, so nothing is announced that cannot be
 * acted on.
 *
 * This hides the words from the eye, not from the DOM: the copy is still in the
 * page source. That is the deliberate trade for keeping the whole gate on the
 * client — the shape and length of the real answer is what sells the upgrade.
 */
function LockedText({ children }: { children: React.ReactNode }) {
  return (
    <span className="sf-locked" aria-hidden="true">
      {children}
    </span>
  );
}

/**
 * Props for an item past its block's reveal count: the whole card blurs as one
 * shape. Spread onto the item root alongside its own classes, so each block
 * keeps `theme pos`, `cited-row you` and friends.
 */
function lockedItem(i: number, reveal: number) {
  const past = i >= reveal;
  return {
    className: past ? "sf-locked" : "",
    "aria-hidden": past || undefined,
  } as const;
}

export function VisibilityCheck({
  yearlyAvailable = false,
}: {
  /** Whether Dodo has yearly products configured — resolved by the page. */
  yearlyAvailable?: boolean;
}) {
  // Shared by both paywalls and every unlock bar, so the plan a visitor picks
  // is the plan every route to checkout buys.
  const checkout = usePlanCheckout();
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  // Who the answers should be about. The engines recommend different brands to
  // a buyer in the UK than to one in the USA, so without this the score
  // measures the wrong market.
  const [market, setMarket] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [live, setLive] = useState(true);
  const [gated, setGated] = useState(false);
  // Set only when the result came from the 24h cache — its presence is what
  // makes the page say when the reading was taken.
  const [measuredAt, setMeasuredAt] = useState<string | null>(null);
  // Real elapsed seconds and the job's real state — the progress panel shows
  // these rather than a simulated bar.
  const [elapsed, setElapsed] = useState(0);
  const [queued, setQueued] = useState(true);

  // The hero hands over the name typed into the answer. Fill it in and put the
  // cursor on the category, which is the only thing still missing — and the
  // field whose specificity decides whether the competitors come back right.
  useEffect(() => {
    function onBrand(e: Event) {
      const value = (e as CustomEvent<string>).detail;
      if (!value) return;
      setBrand(value);
      requestAnimationFrame(() => {
        const el = document.getElementById("category") as HTMLInputElement | null;
        el?.focus();
      });
    }
    window.addEventListener("sf:brand", onBrand);
    return () => window.removeEventListener("sf:brand", onBrand);
  }, []);

  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [loading]);

  function finish(data: { result: Result; live: boolean; measuredAt?: string }) {
    setResult(data.result);
    setLive(data.live);
    setMeasuredAt(data.measuredAt ?? null);
    setLoading(false);
    // The score is the whole reason someone came: tracking it lets us ask
    // whether a bad score converts better than a good one.
    capture(EVENTS.REPORT_COMPLETED, {
      brand,
      category,
      score: data.result?.score,
      live: data.live,
    });
    // Every finished report now renders with locked blocks in it, so the
    // paywall is seen here — not only on the hard gate at the second report.
    // Without this the funnel would count the blurred report as a free win and
    // read the click-through rate against the wrong denominator.
    capture(EVENTS.PAYWALL_SHOWN, {
      plan: checkout.plan,
      reason: "locked_report",
    });
  }

  async function pollJob(jobId: string, attempt = 0) {
    // ~5 min ceiling (100 × 3s)
    if (attempt > 100) {
      setError("This scan is taking longer than expected. Please try again.");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/visibility/status?job=${jobId}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.status === "done") return finish(data);
      if (data.status === "error") {
        setError("Scan failed. Please try again.");
        setLoading(false);
        return;
      }
    } catch {
      /* transient — keep polling */
    }
    setTimeout(() => pollJob(jobId, attempt + 1), 3000);
  }

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setGated(false);
    setElapsed(0);
    setQueued(true);
    setMeasuredAt(null);
    setLoading(true);
    capture(EVENTS.REPORT_STARTED, { brand, category, market });
    try {
      const res = await fetch("/api/free-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand, category, market }),
      });
      const data = await res.json();
      if (data.gated) {
        setGated(true);
        setLoading(false);
        // Their one free report is spent — this is the paywall being seen,
        // and the denominator for everything that follows.
        capture(EVENTS.PAYWALL_SHOWN, { brand, category, reason: "free_used" });
      } else if (!res.ok) {
        setError(data.error || "Something went wrong. Try again.");
        setLoading(false);
        capture(EVENTS.REPORT_FAILED, { brand, category, reason: "request" });
      } else if (data.status === "done") {
        finish(data);
      } else if (data.status === "pending" && data.jobId) {
        pollJob(data.jobId);
      } else {
        setError("Unexpected response. Please try again.");
        setLoading(false);
      }
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setLoading(false);
    }
  }

  const { startCheckout, selected } = checkout;

  const maxShare = result
    ? Math.max(...result.competitors.map((c) => c.share), 1)
    : 1;

  /**
   * The way out of a locked block. Called rather than rendered as a component
   * so it does not get a fresh element type on every render of the parent.
   *
   * Every locked block gets its own, at the point where the reader has just hit
   * the blur — asking them to scroll to the bottom paywall to act on what they
   * are looking at right now is a step that loses people.
   */
  function unlockBar(label = "Unlock the full report") {
    return (
      <button type="button" className="sf-unlock" onClick={startCheckout}>
        <span className="sf-unlock-ico" aria-hidden="true">
          🔒
        </span>
        {label}
        <span className="arr">→</span>
      </button>
    );
  }

  return (
    <div className="check">
      <p className="sec-eyebrow">Free AI visibility check</p>
      <h2 className="sec-title" style={{ marginBottom: 8 }}>
        How visible is your brand in AI search?
      </h2>
      <p className="sec-sub">
        Enter your domain, what you sell and who you sell it to. We&apos;ll
        estimate where you stand across the major AI assistants — in seconds.
      </p>

      {/* The ids stay `brand` and `category` whatever the labels say: they are
          internal, and the hero handoff focuses #category by id. */}
      <form className="check-form" onSubmit={run}>
        <div className="field">
          <label htmlFor="brand">Domain name</label>
          <input
            id="brand"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="yourbrand.com"
            autoComplete="off"
          />
        </div>
        <div className="field">
          <label htmlFor="category">Category of business</label>
          <input
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. project management software"
            autoComplete="off"
          />
        </div>
        <div className="field">
          <label htmlFor="market">Target customers</label>
          <input
            id="market"
            value={market}
            onChange={(e) => setMarket(e.target.value)}
            placeholder="e.g. USA, Canada, UK"
            autoComplete="off"
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary check-submit"
          disabled={loading}
        >
          {loading ? "Analyzing…" : "Check visibility"}
          {!loading && <span className="arr">→</span>}
        </button>
      </form>

      <p className="check-hint">
        All three are needed. Be specific: &ldquo;corporate compliance
        software&rdquo; surfaces your real competitors where &ldquo;services&rdquo;
        just returns the biggest companies, and naming the market is what makes
        the assistants answer for your buyers rather than everyone&apos;s.
      </p>

      {error && <p className="check-error">{error}</p>}

      {gated && (
        <div className="paywall">
          <h3>You&apos;ve used your free report.</h3>
          <p>
            {selected.name} tracks your brand across every AI engine — daily
            scans, competitor alerts, cited sources, and the fixes to climb.
          </p>
          <PlanPicker {...checkout} yearlyAvailable={yearlyAvailable} />
          <p className="paywall-alt">
            Want the feature lists side by side?{" "}
            <a href="/pricing">Compare plans</a>.
          </p>
        </div>
      )}

      {loading && (
        <>
          <p className="check-note" style={{ marginTop: 18 }}>
            Querying the AI engines across several buyer prompts. A new brand can
            take up to a minute — results are cached instantly after.
          </p>
          <div className="skeleton" aria-hidden="true">
            <div className="sk-line" style={{ width: "30%", height: 40 }} />
            <div className="sk-line" style={{ width: "80%" }} />
            <div className="sk-line" style={{ width: "65%" }} />
            <div className="sk-line" style={{ width: "72%" }} />
          </div>
        </>
      )}

      {result && (
        <>
        {/* Only when this came from the stored reading rather than a scan we
            just ran. It states the age and offers the newer one — it does not
            call the result stale, because a reading from this morning is a
            perfectly good reading of answers that move over weeks. */}
        {measuredAt && (
          <p className="freshness">
            <span className="freshness-k">
              Measured {measuredAgo(measuredAt)}
            </span>
            <span className="freshness-sep" aria-hidden="true">·</span>
            <span className="freshness-note">
              answers change slowly, but not never
            </span>
            <Link href="/pricing" className="freshness-cta">
              Track it daily <span className="arr">→</span>
            </Link>
          </p>
        )}
        <div className="result">
          <div className="score-block">
            <p className="res-h">Visibility score</p>
            <div className="score-num">{Math.round(result.score)}</div>
            <p className="score-sum">{result.summary}</p>
            <div className="engine-grid">
              {result.engines.map((eng) => (
                <span
                  key={eng.name}
                  className={`eng-chip ${eng.mentioned ? "in" : "out"}`}
                >
                  <span className="led" />
                  {eng.name}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="res-h">Share of voice vs. competitors</p>
            {result.competitors.map((c) => (
              <div key={c.name} className={`bar-row ${c.you ? "you" : ""}`}>
                <span className="nm">
                  {c.name}
                  {c.you && <span className="badge-you">You</span>}
                </span>
                <span className="bar-track">
                  <span
                    className="bar-fill"
                    style={{ width: `${(c.share / maxShare) * 100}%` }}
                  />
                </span>
                <span className="bar-val">{Math.round(c.share)}%</span>
              </div>
            ))}

            {/* Two named problems is enough to prove the advice is specific;
                the third, and the how under all of them, is the purchase. */}
            <div className="actions sf-lockable" onClick={startCheckout}>
              <p className="res-h">Recommended moves</p>
              {result.actions.map((a, i) => {
                const lock = lockedItem(i, REVEAL.actions);
                return (
                  <div
                    className={`action ${lock.className}`}
                    aria-hidden={lock["aria-hidden"]}
                    key={i}
                  >
                    <span className={`impact ${a.impact}`}>{a.impact}</span>
                    <div className="a-body">
                      <h4>{a.title}</h4>
                      <p>
                        <LockedText>{a.detail}</LockedText>
                      </p>
                    </div>
                  </div>
                );
              })}
              {unlockBar(`Unlock how to make all ${result.actions.length} moves`)}
            </div>

            <p className="check-note">
              {live
                ? "Live estimate generated across AI engines."
                : "Showing a sample estimate."}
              {!live && <span className="badge-sample">sample data</span>}
            </p>
          </div>
        </div>

        {result.sentiment &&
          (result.sentiment.positiveThemes.length > 0 ||
            result.sentiment.negativeThemes.length > 0) && (
            <div className="sentiment-block sf-lockable" onClick={startCheckout}>
              <p className="res-h">How AI talks about you — {result.sentiment.label}</p>
              {/* One theme readable per column: the good news and the bad news
                  are different questions, so a reader who sees only one of them
                  has not seen the block. */}
              <div className="sentiment-cols">
                <div>
                  <p className="senti-pct pos">
                    {result.sentiment.positivePct}% positive
                  </p>
                  {result.sentiment.positiveThemes.map((t, i) => {
                    const lock = lockedItem(i, REVEAL.themes);
                    return (
                      <div
                        className={`theme pos ${lock.className}`}
                        aria-hidden={lock["aria-hidden"]}
                        key={i}
                      >
                        <span className="theme-tag">✓ {t.theme}</span>
                        {t.quote && (
                          <p className="theme-quote">
                            <LockedText>“{t.quote}”</LockedText>
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div>
                  <p className="senti-pct neg">
                    {result.sentiment.negativePct}% negative
                  </p>
                  {result.sentiment.negativeThemes.map((t, i) => {
                    const lock = lockedItem(i, REVEAL.themes);
                    return (
                      <div
                        className={`theme neg ${lock.className}`}
                        aria-hidden={lock["aria-hidden"]}
                        key={i}
                      >
                        <span className="theme-tag">✕ {t.theme}</span>
                        {t.quote && (
                          <p className="theme-quote">
                            <LockedText>“{t.quote}”</LockedText>
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              {unlockBar("Unlock what AI actually says about you")}
            </div>
          )}

        {result.citedSources && result.citedSources.length > 0 && (
          <div className="ideas-block sf-lockable" onClick={startCheckout}>
            <p className="res-h">
              Likely cited sources <span className="est-tag">estimated</span>
            </p>
            <p className="check-hint" style={{ margin: "0 0 14px" }}>
              Where AI answers in this category tend to pull from. Getting listed
              in these is the fastest way to get cited.
            </p>
            {/* The ranks stay legible down the whole list, so the reader can
                count what is hidden even where the domain is not. */}
            <div className="cited-list">
              {result.citedSources.map((s, i) => {
                const lock = lockedItem(i, REVEAL.cited);
                return (
                  <div
                    className={`cited-row ${s.isYou ? "you" : ""} ${lock.className}`}
                    aria-hidden={lock["aria-hidden"]}
                    key={i}
                  >
                    <span className="cited-rank">{i + 1}</span>
                    <span className="cited-domain">
                      {s.domain}
                      {s.isYou && <span className="badge-you">You</span>}
                    </span>
                    <span className="cited-note">
                      <LockedText>{s.note}</LockedText>
                    </span>
                  </div>
                );
              })}
            </div>
            {unlockBar(
              `Unlock why all ${result.citedSources.length} sources get cited`
            )}
          </div>
        )}

        {result.contentIdeas && result.contentIdeas.length > 0 && (
          <div className="ideas-block sf-lockable" onClick={startCheckout}>
            <p className="res-h">Content suggestions to boost your visibility</p>
            {/* One readable brief; the rest of the backlog is the product. */}
            <div className="ideas-grid">
              {result.contentIdeas.map((idea, i) => {
                const lock = lockedItem(i, REVEAL.ideas);
                return (
                  <div
                    className={`idea ${lock.className}`}
                    aria-hidden={lock["aria-hidden"]}
                    key={i}
                  >
                    <span className="idea-type">{idea.type}</span>
                    <h4>{idea.title}</h4>
                    <p>
                      <LockedText>{idea.description}</LockedText>
                    </p>
                  </div>
                );
              })}
            </div>
            {unlockBar(
              `Unlock all ${result.contentIdeas.length} article briefs`
            )}
          </div>
        )}

        <div className="paywall" style={{ marginTop: 30 }}>
          <h3>That&apos;s your one free report.</h3>
          <p>
            {selected.name} tracks this score over time, tells you when a
            competitor overtakes you, and hands you the fixes to win the answer
            back.
          </p>
          <PlanPicker {...checkout} yearlyAvailable={yearlyAvailable} />
          <p className="paywall-alt">
            Want the feature lists side by side?{" "}
            <a href="/pricing">Compare plans</a>.
          </p>
        </div>
        </>
      )}
    </div>
  );
}
