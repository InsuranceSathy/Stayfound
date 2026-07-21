"use client";

import { useState } from "react";

type Engine = { name: string; mentioned: boolean; score: number };
type Competitor = { name: string; share: number; you?: boolean };
type Action = { title: string; detail: string; impact: "high" | "medium" | "low" };
type Result = {
  score: number;
  summary: string;
  engines: Engine[];
  competitors: Competitor[];
  actions: Action[];
};

export function VisibilityCheck() {
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [live, setLive] = useState(true);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/visibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand, category }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Try again.");
      } else {
        setResult(data.result);
        setLive(data.live);
      }
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
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
      )}
    </div>
  );
}
