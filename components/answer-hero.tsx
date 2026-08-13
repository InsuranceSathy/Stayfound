"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight, ENGINES, handoff } from "@/components/nf-shared";

/**
 * The hero: "AI repeats what it reads. Teach it your name."
 *
 * The image is the product's argument, not decoration — assistants repeat
 * what they read, and if your name isn't in the sources, the parrot never
 * says it. The plate is a clustered-dot halftone generated in-house from a
 * CC0 photo (Wikimedia Commons); regenerate or replace via the pipeline in
 * the design scratchpad whenever brand photography arrives.
 *
 * The domain field hands off to the check below via the `sf:brand` event —
 * the same contract visibility-check.tsx has always listened for.
 */
export function AnswerHero() {
  const [domain, setDomain] = useState("");

  return (
    <div className="nf">
      <header className="n-hero">
        <span className="n-reg n-reg-tl" aria-hidden="true" />
        <span className="n-reg n-reg-tr" aria-hidden="true" />
        <span className="n-reg n-reg-bl" aria-hidden="true" />
        <span className="n-reg n-reg-br" aria-hidden="true" />

        <div className="wrap-p n-fold">
          <div className="n-copy">
            <h1 className="n-h1 rise d1">
              <span>AI repeats what it&nbsp;reads.</span>
              <span className="n-h1-b">
                Teach it <em>your name</em>.
              </span>
            </h1>

            <p className="n-lede rise d2">
              StayFound reads what ChatGPT, Gemini, Perplexity and Claude
              recommend in your category — and shows you the pages that get
              you named.
            </p>

            <form
              className="m-check rise d2"
              onSubmit={(e) => {
                e.preventDefault();
                handoff(domain);
              }}
            >
              <input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="yourbrand.com"
                aria-label="Your domain"
                autoComplete="url"
                spellCheck={false}
              />
              <button type="submit" className="btn-p">
                Check my brand
                <ArrowRight />
              </button>
            </form>

            <p className="m-fine rise d3">
              Free · no account · results in two minutes
            </p>
          </div>

          <div className="n-stage" aria-hidden="true">
            <span className="n-glow" />
            <Image
              src="/design/parrot-halftone.png"
              alt=""
              width={980}
              height={1150}
              priority
              className="n-bird"
            />
            <span className="n-say">
              <u className="n-say-redact w2" />
              <u className="n-say-redact w1" />
              <b className={domain.trim() ? "on" : ""}>
                {domain.trim() ? `+ ${domain.trim()}` : "+ you?"}
              </b>
            </span>
            <span className="n-caption">
              fig. 01 — the answer engine, at work
            </span>
          </div>
        </div>

        {/* continuous marquee — rendered twice for a seamless loop */}
        <div className="n-ticker" aria-label="Engines StayFound reads">
          <div className="n-ticker-track">
            {[0, 1].map((dup) => (
              <div className="n-ticker-run" aria-hidden={dup === 1} key={dup}>
                {ENGINES.map((e) => (
                  <em key={e}>
                    {e}
                    <i aria-hidden="true" />
                  </em>
                ))}
              </div>
            ))}
          </div>
        </div>
      </header>
    </div>
  );
}
