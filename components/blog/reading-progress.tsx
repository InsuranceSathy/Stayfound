"use client";

import { useEffect, useState } from "react";

/**
 * How far through the article you are.
 *
 * Measured against the <article> element, not the document: the page ends with
 * a CTA card and a footer, and counting those would leave the bar short of 100%
 * exactly when the reader finishes reading.
 *
 * Scroll events fire far faster than frames, so the handler only marks itself
 * dirty and the real work happens once per frame.
 */
export function ReadingProgress() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    // Not a bare "article": the related-posts footer renders <article> cards,
    // so the bare selector only picks the right one because .post-body happens
    // to come first in the DOM. That is luck, not a design.
    const article = document.querySelector(".post-body");
    if (!article) return;

    let frame = 0;

    const measure = () => {
      frame = 0;
      const rect = article.getBoundingClientRect();
      // Distance scrolled into the article, over the distance that can be
      // scrolled while any of it is still on screen.
      const scrolled = -rect.top;
      const scrollable = rect.height - window.innerHeight;
      if (scrollable <= 0) {
        setPct(scrolled > 0 ? 100 : 0);
        return;
      }
      setPct(Math.min(100, Math.max(0, (scrolled / scrollable) * 100)));
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="progress-track" aria-hidden="true">
      <div className="progress-bar" style={{ width: `${pct}%` }} />
    </div>
  );
}
