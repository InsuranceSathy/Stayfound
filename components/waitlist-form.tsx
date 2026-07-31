"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const EMPTY = { email: "", business: "", domain: "", competitors: "" };

const WaitlistContext = createContext<(() => void) | null>(null);

/**
 * Wraps a page so any `WaitlistButton` inside it opens one shared dialog —
 * rather than each trigger mounting its own copy of the form.
 */
export function WaitlistProvider({ children }: { children: React.ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);

  // <dialog> only gets the top layer + backdrop via showModal(), so drive the
  // element imperatively and keep React state in sync with its close events.
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  const openDialog = useCallback(() => setOpen(true), []);

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function close() {
    setOpen(false);
    // Reset only after a completed signup, so a failed attempt keeps its input.
    if (done) {
      setDone(false);
      setForm(EMPTY);
      setError(null);
    }
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

  return (
    <WaitlistContext.Provider value={openDialog}>
      {children}

      <dialog
        ref={dialogRef}
        className="waitlist-dialog"
        aria-labelledby="waitlist-title"
        onClose={close}
        onClick={(e) => {
          if (e.target === dialogRef.current) close();
        }}
      >
        <div className="waitlist-panel">
          <button
            type="button"
            className="waitlist-close"
            onClick={close}
            aria-label="Close"
          >
            ×
          </button>

          {done ? (
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
              <h3 id="waitlist-title">Your spot is booked.</h3>
              <p>
                Our team will connect with you at {form.email} to walk through
                your AI-search snapshot and get you set up.
              </p>
            </div>
          ) : (
            <>
              <h3 id="waitlist-title" className="waitlist-title">
                Book a spot
              </h3>
              <p className="waitlist-sub">
                We&apos;re onboarding brands in batches. Tell us four things and
                our team will reach out.
              </p>
              <form className="demo-form" onSubmit={submit}>
                <div className="field">
                  <label htmlFor="wl-email">Work email</label>
                  <input
                    id="wl-email"
                    type="email"
                    value={form.email}
                    onChange={set("email")}
                    autoComplete="email"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="wl-business">Business name</label>
                  <input
                    id="wl-business"
                    value={form.business}
                    onChange={set("business")}
                    autoComplete="organization"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="wl-domain">Domain</label>
                  <input
                    id="wl-domain"
                    value={form.domain}
                    onChange={set("domain")}
                    autoComplete="url"
                    placeholder="yourbrand.com"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="wl-competitors">Competitors</label>
                  <textarea
                    id="wl-competitors"
                    rows={2}
                    value={form.competitors}
                    onChange={set("competitors")}
                    placeholder="Comma-separated — who do you lose deals to?"
                  />
                </div>
                {error && <p className="check-error">{error}</p>}
                <button
                  type="submit"
                  className="btn btn-primary demo-submit"
                  disabled={loading}
                >
                  {loading ? "Booking…" : "Book my spot"}
                  {!loading && <span className="arr">→</span>}
                </button>
              </form>
            </>
          )}
        </div>
      </dialog>
    </WaitlistContext.Provider>
  );
}

export function WaitlistButton({
  className = "btn btn-primary",
  children = "Book a Spot",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const open = useContext(WaitlistContext);
  if (!open) throw new Error("WaitlistButton must be inside a WaitlistProvider");

  return (
    <button type="button" className={className} onClick={open}>
      {children} <span className="arr">→</span>
    </button>
  );
}
