import { AnswerHero } from "@/components/answer-hero";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { VisibilityCheck } from "@/components/visibility-check";
import { ReportGlimpse } from "@/components/report-glimpse";

const ENGINES = [
  "ChatGPT",
  "Gemini",
  "Perplexity",
  "Claude",
  "Grok",
  "Copilot",
  "AI Overviews",
];

/**
 * What a scan actually returns. Written from the report itself rather than from
 * a feature list, so nothing here promises something the product doesn't do.
 * The numbering is the order the report is read in, not decoration.
 */
const CONTENTS = [
  {
    k: "Where you rank",
    v: "Every brand the assistants name in your category, the share of voice each one takes, and how far back you sit.",
  },
  {
    k: "The pages they read",
    v: "The sources behind the answers — the roundups, directories and threads — and which of them you are missing from.",
  },
  {
    k: "The fixes",
    v: "Ranked by impact, each with the steps to ship it. Where a fix is schema, crawler access or a listing, the block is written out ready to paste.",
  },
];

export default function Home() {
  return (
    <>
      <SiteHeader />

      <AnswerHero />

      {/* The check sits directly under the hero. The hero makes someone want
          their own number; making them scroll past four sections to get it was
          the single biggest thing costing conversions. */}
      <section className="sfx-check-band" id="report">
        <div className="sfx-wrap sfx-check">
          <VisibilityCheck />
        </div>
      </section>

      <section className="sfx-engines" id="engines">
        <div className="sfx-wrap sfx-engines-in">
          <span className="sfx-engines-k">read every answer engine</span>
          <div className="sfx-engine-list">
            {ENGINES.map((e) => (
              <span className="sfx-engine" key={e}>
                {e}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="sfx-band" id="inside">
        <div className="sfx-wrap">
          <div className="sfx-head">
            <h2 className="sfx-h2">What comes back</h2>
            <p className="sfx-lede">
              One page per question you actually have. No score without the
              reason behind it.
            </p>
          </div>

          {/* An index, not a card grid: the report is a document, so its
              contents page is the honest way to show what it holds. */}
          <ol className="sfx-index">
            {CONTENTS.map((c, i) => (
              <li className="sfx-row" key={c.k}>
                <span className="sfx-row-n">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="sfx-row-k">{c.k}</h3>
                <p className="sfx-row-v">{c.v}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <ReportGlimpse />

      <section className="sfx-band sfx-why" id="loop">
        <div className="sfx-wrap sfx-why-in">
          <h2 className="sfx-h2">
            You cannot fix what you never see.
          </h2>
          <div className="sfx-why-col">
            <p>
              A buyer asks an assistant which tool to use and gets one answer
              naming three or four brands. There is no page two, no impression
              count, and no line in your analytics for the times you were left
              out — the visit simply never happens.
            </p>
            <p className="sfx-quiet">
              That is the part search tools do not measure. StayFound reads the
              answers themselves, so the omissions become something you can
              count, work on, and watch change.
            </p>
          </div>
        </div>
      </section>

      <section className="sfx-final">
        <div className="sfx-wrap sfx-final-in">
          <h2 className="sfx-final-h">
            Find out what the assistants say about you.
          </h2>
          <div className="sfx-final-cta">
            <a href="#report" className="ah-btn">
              Check my brand
            </a>
            <a href="/demo" className="ah-btn-quiet">
              Book a demo
            </a>
          </div>
          <p className="sfx-final-note">
            One free check, no account. Takes about two minutes to run.
          </p>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
