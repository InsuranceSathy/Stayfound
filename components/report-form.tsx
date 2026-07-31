"use client";

import { useState } from "react";

const EMPTY = { website: "", industry: "", competitors: "", email: "" };

/**
 * Lead capture for the manual-report phase: we collect the four things needed
 * to run a report by hand and email it back, instead of exposing the product.
 */
export function ReportForm() {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Something went wrong.");
      else setDone(true);
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="check" id="report">
        <div className="demo-done">
          <div className="demo-check">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M5 12.5l4.5 4.5L19 7.5"
                stroke="#fff"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h3>We&apos;re on it.</h3>
          <p>
            We&apos;ll run your AI-visibility report for {form.website} and send
            it to {form.email}. Keep an eye on your inbox.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="check" id="report">
      <p className="sec-eyebrow">Get your report</p>
      <h2 className="sec-title" style={{ marginBottom: 8 }}>
        See exactly where you stand in AI search
      </h2>
      <p className="sec-sub">
        Your visibility score, share of voice vs. competitors, how AI describes
        you, the sources it cites, and what to fix — across ChatGPT, Perplexity,
        Gemini, Claude and Grok. Tell us where to look and we&apos;ll run it for
        you.
      </p>

      <form className="demo-form" style={{ marginTop: 24 }} onSubmit={submit}>
        <div className="field">
          <label htmlFor="rf-website">Website</label>
          <input
            id="rf-website"
            value={form.website}
            onChange={set("website")}
            placeholder="yourbrand.com"
            autoComplete="url"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="rf-industry">Industry</label>
          <input
            id="rf-industry"
            value={form.industry}
            onChange={set("industry")}
            placeholder="e.g. corporate compliance software"
            autoComplete="off"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="rf-competitors">Closest competitors</label>
          <textarea
            id="rf-competitors"
            rows={2}
            value={form.competitors}
            onChange={set("competitors")}
            placeholder="Comma-separated — who do you lose deals to?"
          />
        </div>
        <div className="field">
          <label htmlFor="rf-email">Work email</label>
          <input
            id="rf-email"
            type="email"
            value={form.email}
            onChange={set("email")}
            placeholder="you@yourbrand.com"
            autoComplete="email"
            required
          />
        </div>

        {error && <p className="check-error">{error}</p>}

        <button
          type="submit"
          className="btn btn-primary demo-submit btn-lg"
          disabled={loading}
        >
          {loading ? "Sending…" : "Send me the report"}
          {!loading && <span className="arr">→</span>}
        </button>
      </form>

      <p className="check-hint">
        Be specific with the industry — &ldquo;corporate compliance
        software&rdquo; surfaces your real competitors; &ldquo;services&rdquo;
        just returns the biggest companies. Reports go out within one business
        day.
      </p>
    </div>
  );
}
