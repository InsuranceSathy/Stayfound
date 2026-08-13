"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { NAV_LINKS } from "@/components/nf-shared";

const MENU_LINKS = [
  ...NAV_LINKS,
  { href: "/demo", label: "Book a demo" },
  { href: "/sign-in", label: "Sign in" },
];

/**
 * The marketing header, in the NF design: thin, quiet, one hairline. The CTA
 * is an outline rather than a filled block — on pages whose hero carries the
 * primary action, a second filled button would compete with it.
 *
 * Client component because it owns the mobile sheet.
 */
export function SiteHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="nf">
      <nav className="hd">
        <div className="hd-in">
          <Link href="/" className="hd-brand">
            <BrandMark size={24} />
            StayFound
          </Link>

          <div className="hd-links">
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href}>
                {l.label}
              </Link>
            ))}
          </div>

          <div className="hd-right">
            <Link href="/sign-in" className="hd-quiet">
              Sign in
            </Link>
            <Link href="/demo" className="hd-cta">
              Book a demo
            </Link>
            <button
              type="button"
              className={`nf-burger ${open ? "on" : ""}`}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              <i aria-hidden="true" />
            </button>
          </div>
        </div>
      </nav>

      <div className={`nf-sheet ${open ? "on" : ""}`} aria-hidden={!open}>
        <button
          type="button"
          className="nf-scrim"
          aria-label="Close menu"
          tabIndex={-1}
          onClick={() => setOpen(false)}
        />
        <nav className="nf-panel">
          {MENU_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              tabIndex={open ? 0 : -1}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/#report"
            className="nf-panel-cta"
            tabIndex={open ? 0 : -1}
            onClick={() => setOpen(false)}
          >
            Check my brand
          </Link>
        </nav>
      </div>
    </div>
  );
}
