"use client";

import { useEffect, useState } from "react";

type Item = { id: string; label: string };

/**
 * Table of contents, built from the rendered article rather than from a list
 * declared alongside the post.
 *
 * Declaring the headings twice — once in the body, once in the registry — is
 * the kind of duplication that goes stale the first time someone renames a
 * section and the contents list keeps the old name. The DOM is the source of
 * truth, so it can't disagree with itself.
 *
 * Hidden below 1100px in CSS; this still mounts, which is fine — it's a few
 * hundred bytes of state and no layout work when the list isn't displayed.
 */
export function Toc() {
  const [state, setState] = useState<{ items: Item[]; active: string | null }>({
    items: [],
    active: null,
  });

  useEffect(() => {
    // Scoped to .post-body: the related-posts footer renders <article> cards
    // too, and a bare "article" selector would depend on DOM order.
    const headings = Array.from(
      document.querySelectorAll<HTMLHeadingElement>(".post-body .prose h2[id]"),
    );
    if (headings.length < 3) return;

    // Everything happens in the observer callback rather than the effect body.
    // IntersectionObserver invokes its callback once for every target as soon
    // as it starts observing, so that first pass populates the list — which
    // means no setState directly in the effect, and no cascading render.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        setState((prev) => ({
          items: prev.items.length
            ? prev.items
            : headings.map((h) => ({
                id: h.id,
                // The anchor "#" that <H2> appends is part of textContent, and
                // a trailing hash on every entry reads as a rendering bug.
                label: (h.textContent ?? "").replace(/#\s*$/, "").trim(),
              })),
          active: visible[0]?.target.id ?? prev.active ?? headings[0].id,
        }));
      },
      // Pulls the trigger line below the nav, so the highlighted entry is the
      // heading being read rather than one already scrolled past.
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 },
    );

    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, []);

  const { items, active } = state;
  if (items.length < 3) return null;

  return (
    <nav className="toc" aria-label="On this page">
      <p className="toc-h">On this page</p>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={`toc-link ${item.id === active ? "on" : ""}`}
              aria-current={item.id === active ? "true" : undefined}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
