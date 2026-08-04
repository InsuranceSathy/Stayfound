"use client";

import { useState } from "react";

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

export function VisibilityCheck() {
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [live, setLive] = useState(true);
  const [gated, setGated] = useState(false);

  function finish(data: { result: Result; live: boolean }) {
    setResult(data.result);
    setLive(data.live);
    setLoading(false);
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
    setLoading(true);
    try {
      const res = await fetch("/api/free-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand, category }),
      });
      const data = await res.json();
      if (data.gated) {
        setGated(true);
        setLoading(false);
      } else if (!res.ok) {
        setError(data.error || "Something went wrong. Try again.");
        setLoading(false);
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

  async function startCheckout() {
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else window.location.href = "https://app.stayfound.tech";
    } catch {
      window.location.href = "https://app.stayfound.tech";
    }
  }

  const maxShare = result
    ? Math.max(...result.competitors.map((c) => c.share), 1)
    : 1;

  return (
    <div className="check">
      <p className="sec-eyebrow">Free AI visibility check</p>
      <h2 className="sec-title" style={{ marginBottom: 8 }}>
        How visible is your brand in AI search?
      </h2>
      <p className="sec-sub">
        Enter your brand and what you sell. We&apos;ll estimate where you stand
        across the major AI assistants — in seconds.
      </p>

      <form className="check-form" onSubmit={run}>
        <div className="field">
          <label htmlFor="brand">Brand name</label>
          <input
            id="brand"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="e.g. Linear"
            autoComplete="off"
          />
        </div>
        <div className="field">
          <label htmlFor="category">Category</label>
          <input
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. project management software"
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
        Tip: be specific. &ldquo;Corporate compliance software&rdquo; surfaces
        your real competitors; &ldquo;services&rdquo; just returns the biggest
        companies.
      </p>

      {error && <p className="check-error">{error}</p>}

      {gated && (
        <div className="paywall">
          <h3>You&apos;ve used your free report.</h3>
          <p>
            Get unlimited scans, daily tracking, competitor alerts, and the
            fixes to climb — for every brand you own.
          </p>
          <div className="cta-row" style={{ justifyContent: "center" }}>
            <button className="btn btn-primary btn-lg" onClick={startCheckout}>
              Get full access <span className="arr">→</span>
            </button>
            <a
              href="https://app.stayfound.tech"
              className="btn btn-bare btn-lg"
            >
              Log in
            </a>
          </div>
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

            <div className="actions">
              <p className="res-h">Recommended moves</p>
              {result.actions.map((a, i) => (
                <div className="action" key={i}>
                  <span className={`impact ${a.impact}`}>{a.impact}</span>
                  <div className="a-body">
                    <h4>{a.title}</h4>
                    <p>{a.detail}</p>
                  </div>
                </div>
              ))}
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
            <div className="sentiment-block">
              <p className="res-h">How AI talks about you — {result.sentiment.label}</p>
              <div className="sentiment-cols">
                <div>
                  <p className="senti-pct pos">
                    {result.sentiment.positivePct}% positive
                  </p>
                  {result.sentiment.positiveThemes.map((t, i) => (
                    <div className="theme pos" key={i}>
                      <span className="theme-tag">✓ {t.theme}</span>
                      {t.quote && <p className="theme-quote">“{t.quote}”</p>}
                    </div>
                  ))}
                </div>
                <div>
                  <p className="senti-pct neg">
                    {result.sentiment.negativePct}% negative
                  </p>
                  {result.sentiment.negativeThemes.map((t, i) => (
                    <div className="theme neg" key={i}>
                      <span className="theme-tag">✕ {t.theme}</span>
                      {t.quote && <p className="theme-quote">“{t.quote}”</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        {result.citedSources && result.citedSources.length > 0 && (
          <div className="ideas-block">
            <p className="res-h">
              Likely cited sources <span className="est-tag">estimated</span>
            </p>
            <p className="check-hint" style={{ margin: "0 0 14px" }}>
              Where AI answers in this category tend to pull from. Getting listed
              in these is the fastest way to get cited.
            </p>
            <div className="cited-list">
              {result.citedSources.map((s, i) => (
                <div className={`cited-row ${s.isYou ? "you" : ""}`} key={i}>
                  <span className="cited-rank">{i + 1}</span>
                  <span className="cited-domain">
                    {s.domain}
                    {s.isYou && <span className="badge-you">You</span>}
                  </span>
                  <span className="cited-note">{s.note}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {result.contentIdeas && result.contentIdeas.length > 0 && (
          <div className="ideas-block">
            <p className="res-h">Content suggestions to boost your visibility</p>
            <div className="ideas-grid">
              {result.contentIdeas.map((idea, i) => (
                <div className="idea" key={i}>
                  <span className="idea-type">{idea.type}</span>
                  <h4>{idea.title}</h4>
                  <p>{idea.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="paywall" style={{ marginTop: 30 }}>
          <h3>That&apos;s your one free report.</h3>
          <p>
            Track this score over time, add every brand you own, get alerts when
            a competitor overtakes you, and let us ship the fixes.
          </p>
          <div className="cta-row" style={{ justifyContent: "center" }}>
            <button className="btn btn-primary btn-lg" onClick={startCheckout}>
              Get full access <span className="arr">→</span>
            </button>
            <a href="https://app.stayfound.tech" className="btn btn-bare btn-lg">
              Log in
            </a>
          </div>
        </div>
        </>
      )}
    </div>
  );
}
