"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const LINKS = [
  { href: "/#inside", label: "Product" },
  { href: "/#loop", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  { href: "/demo", label: "Book a demo" },
];

/**
 * Below 860px the desktop `.nav-links` row is hidden, which used to leave the
 * bar with no navigation at all. This is that menu.
 */
export function MobileMenu() {
  const [open, setOpen] = useState(false);

  // The panel covers the page, so the page behind it must not scroll.
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
    <>
      <button
        type="button"
        className="nav-burger"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={`burger-box ${open ? "on" : ""}`} aria-hidden="true">
          <i />
          <i />
        </span>
      </button>

      <div
        className={`mobile-sheet ${open ? "on" : ""}`}
        // inert-ish: keep it out of the tab order when closed
        aria-hidden={!open}
      >
        <button
          type="button"
          className="mobile-sheet-scrim"
          aria-label="Close menu"
          tabIndex={-1}
          onClick={() => setOpen(false)}
        />
        <nav className="mobile-sheet-panel">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="mobile-link"
              tabIndex={open ? 0 : -1}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/#report"
            className="btn btn-primary mobile-cta"
            tabIndex={open ? 0 : -1}
            onClick={() => setOpen(false)}
          >
            Get my free report <span className="arr">→</span>
          </Link>
        </nav>
      </div>
    </>
  );
}
