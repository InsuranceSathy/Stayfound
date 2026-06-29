"use client";

import { useState } from "react";

export function DemoForm() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
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
        <h3>You&apos;re on the list.</h3>
        <p>
          Thanks, {form.name.split(" ")[0] || "there"}. We&apos;ll reach out at{" "}
          {form.email} within one business day to set up your demo.
        </p>
      </div>
    );
  }

  return (
    <form className="demo-form" onSubmit={submit}>
      <div className="field">
        <label htmlFor="name">Full name</label>
        <input id="name" value={form.name} onChange={set("name")} autoComplete="name" required />
      </div>
      <div className="field">
        <label htmlFor="email">Work email</label>
        <input
          id="email"
          type="email"
          value={form.email}
          onChange={set("email")}
          autoComplete="email"
          required
        />
      </div>
      <div className="field">
        <label htmlFor="company">Company</label>
        <input id="company" value={form.company} onChange={set("company")} autoComplete="organization" />
      </div>
      <div className="field">
        <label htmlFor="message">What do you want to win in AI search?</label>
        <textarea
          id="message"
          rows={3}
          value={form.message}
          onChange={set("message")}
          placeholder="e.g. We're losing to a competitor on ChatGPT for our category."
        />
      </div>
      {error && <p className="check-error">{error}</p>}
      <button type="submit" className="btn btn-primary demo-submit" disabled={loading}>
        {loading ? "Sending…" : "Book my demo"}
        {!loading && <span className="arr">→</span>}
      </button>
    </form>
  );
}
