"use client";

import { useState } from "react";

type Dim = { dimension: string; score: number; note: string };
type AeoResult = {
  score: number;
  target?: number;
  summary?: string;
  breakdown: Dim[];
  fixes?: string[];
};

function scoreColor(s: number) {
  if (s >= 75) return "var(--good)";
  if (s >= 45) return "var(--accent)";
  return "#c44";
}

export function AeoScore() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AeoResult | null>(null);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/aeo-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Something went wrong.");
      else setResult(data.result);
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="check">
      <p className="sec-eyebrow">AEO content score</p>
      <h2 className="sec-title" style={{ marginBottom: 8 }}>
        Is your content built to be cited?
      </h2>
      <p className="sec-sub">
        Paste a blog post or landing page. We&apos;ll score how likely AI answer
        engines are to cite it — and what to fix.
      </p>

      <form className="check-form" onSubmit={run}>
        <div className="field" style={{ flexBasis: "100%" }}>
          <label htmlFor="aeo-url">Page URL</label>
          <input
            id="aeo-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://yoursite.com/blog/post"
            autoComplete="off"
          />
        </div>
        <button type="submit" className="btn btn-primary check-submit" disabled={loading}>
          {loading ? "Analyzing page…" : "Score my content"}
          {!loading && <span className="arr">→</span>}
        </button>
      </form>

      {error && <p className="check-error">{error}</p>}

      {result && (
        <div className="aeo-result">
          <div className="aeo-gauge">
            <div className="aeo-num" style={{ color: scoreColor(result.score) }}>
              {Math.round(result.score)}
              <span className="aeo-outof">/100</span>
            </div>
            {typeof result.target === "number" && (
              <p className="aeo-target">Target: {result.target}</p>
            )}
            {result.summary && <p className="score-sum">{result.summary}</p>}
          </div>

          <div className="aeo-breakdown">
            <p className="res-h">Score breakdown</p>
            {result.breakdown.map((d) => (
              <div className="aeo-dim" key={d.dimension}>
                <div className="aeo-dim-head">
                  <span className="aeo-dim-name">{d.dimension}</span>
                  <span
                    className="aeo-dim-score"
                    style={{ color: scoreColor(d.score) }}
                  >
                    {Math.round(d.score)}
                  </span>
                </div>
                <span className="bar-track">
                  <span
                    className="bar-fill"
                    style={{
                      width: `${Math.max(0, Math.min(100, d.score))}%`,
                      background: scoreColor(d.score),
                    }}
                  />
                </span>
                <p className="aeo-dim-note">{d.note}</p>
              </div>
            ))}

            {result.fixes && result.fixes.length > 0 && (
              <div className="actions">
                <p className="res-h">Top fixes</p>
                {result.fixes.map((f, i) => (
                  <div className="action" key={i}>
                    <span className="impact high">fix</span>
                    <div className="a-body">
                      <p>{f}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
