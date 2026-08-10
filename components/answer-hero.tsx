"use client";

import { useEffect, useReducer, useState } from "react";
import Link from "next/link";

/**
 * The hero is the product's own artifact: a real answer, with a hole in it.
 *
 * Every competitor in this category leads with a dashboard screenshot. A
 * dashboard is the by-product; the thing a founder actually feels is reading a
 * sentence a machine wrote about their category and not finding themselves in
 * it. So the answer is the hero, and the omission is the only thing on the page
 * allowed to carry colour.
 *
 * The answer types itself once, because that is how these answers really
 * arrive. Reduced motion gets the finished state immediately.
 */

const PROMPT = "best project management software for a small team";

type Token =
  | { kind: "text"; value: string }
  | { kind: "named"; value: string };

const ANSWER: Token[] = [
  { kind: "text", value: "For a small team, most people land on " },
  { kind: "named", value: "Notion" },
  { kind: "text", value: ", " },
  { kind: "named", value: "Asana" },
  { kind: "text", value: ", or " },
  { kind: "named", value: "Linear" },
  {
    kind: "text",
    value:
      " — they turn up in nearly every roundup and comparison thread the model has read.",
  },
];

const SOURCES = ["g2.com", "reddit.com", "producthunt.com", "capterra.com"];

const FULL_LENGTH = ANSWER.reduce((n, t) => n + t.value.length, 0);

export function AnswerHero() {
  const [typed, setTyped] = useState(0);
  const [, force] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setTyped(FULL_LENGTH);
      return;
    }
    let n = 0;
    const id = setInterval(() => {
      // Slightly uneven pacing reads as generated text rather than a metronome.
      n = Math.min(FULL_LENGTH, n + (Math.random() < 0.25 ? 2 : 1));
      setTyped(n);
      if (n >= FULL_LENGTH) clearInterval(id);
    }, 18);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setTimeout(force, 600);
    return () => clearTimeout(id);
  }, [typed]);

  const done = typed >= FULL_LENGTH;

  // Reveal by character across the token list, so names light up as they arrive.
  let consumed = 0;
  const rendered = ANSWER.map((token, i) => {
    const start = consumed;
    consumed += token.value.length;
    if (typed <= start) return null;
    const slice = token.value.slice(0, Math.max(0, typed - start));
    return token.kind === "named" ? (
      <mark className="ah-named" key={i}>
        {slice}
      </mark>
    ) : (
      <span key={i}>{slice}</span>
    );
  });

  return (
    <header className="ah">
      <div className="ah-wrap">
        <div className="ah-lede">
          <p className="ah-eyebrow">
            <span className="ah-dot" aria-hidden="true" />
            asked of ChatGPT, Gemini, Perplexity and Claude
          </p>
        </div>

        <figure className="ah-sheet">
          <figcaption className="ah-prompt">
            <span className="ah-prompt-k">prompt</span>
            <span className="ah-prompt-v">“{PROMPT}”</span>
          </figcaption>

          <p className="ah-answer" aria-label={ANSWER.map((t) => t.value).join("")}>
            {rendered}
            {!done && <span className="ah-caret" aria-hidden="true" />}
          </p>

          {/* The omission. Everything else on this page is monochrome so that
              this is the one thing the eye goes to. */}
          <div className={`ah-gap ${done ? "in" : ""}`} aria-hidden={!done}>
            <span className="ah-slot">
              <span className="ah-slot-ghost">your brand</span>
            </span>
            <span className="ah-gap-note">where you would be</span>
          </div>

          <div className={`ah-sources ${done ? "in" : ""}`}>
            <span className="ah-sources-k">read</span>
            {SOURCES.map((s) => (
              <span className="ah-source" key={s}>
                {s}
              </span>
            ))}
          </div>
        </figure>

        <div className="ah-say">
          <h1 className="ah-h1">
            Your rivals are in the answer.
            <em>You are not.</em>
          </h1>
          <div className="ah-say-r">
            <p className="ah-sub">
              StayFound reads what the assistants actually say when buyers ask
              about your category, then names the pages that would put you in
              the sentence.
            </p>
            <div className="ah-cta">
              <a href="#report" className="ah-btn">
                Check my brand
              </a>
              <Link href="/pricing" className="ah-btn-quiet">
                See plans
              </Link>
            </div>
            <p className="ah-note">One free check. No account needed.</p>
          </div>
        </div>
      </div>
    </header>
  );
}
