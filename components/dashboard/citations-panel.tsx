import type { VisibilityResult } from "@/lib/visibility";
import { citationStanding } from "@/lib/report-derive";

/**
 * The sources AI answers actually lean on for this category — and whether you
 * are on them. This is the most directly actionable page in the report: every
 * source you don't appear on is a specific place to go get listed.
 */
export function CitationsPanel({ data }: { data: VisibilityResult }) {
  const sources = data.citedSources ?? [];
  const cites = citationStanding(sources);

  if (!sources.length) {
    return (
      <section className="sf-panel">
        <div className="sf-panel-head">
          <h2 className="sf-panel-t">Cited sources</h2>
        </div>
        <p className="sf-empty">
          This scan didn&apos;t capture citation data. Run a refresh to collect
          the sources AI assistants cite for your category.
        </p>
      </section>
    );
  }

  return (
    <>
      <section className="sf-panel">
        <div className="sf-panel-head">
          <h2 className="sf-panel-t">Where AI gets its answers</h2>
          <p className="sf-panel-sub">
            The pages assistants read before recommending anyone
          </p>
        </div>
        <p className="sf-lede">
          Assistants lean on <b>{cites.total} sources</b> for this category. You
          appear on <b>{cites.yours}</b>
          {cites.missing > 0 && (
            <>
              {" "}
              — which leaves <b>{cites.missing}</b> pages shaping the answer
              without you on them.
            </>
          )}
        </p>

        <ul className="sf-src-list">
          {sources.map((s, i) => (
            <li className={`sf-src ${s.isYou ? "mine" : ""}`} key={`${s.domain}-${i}`}>
              <div className="sf-src-top">
                <span className="sf-src-dom">{s.domain}</span>
                <span className={`sf-src-tag ${s.isYou ? "mine" : "gap"}`}>
                  {s.isYou ? "you're on it" : "not listed"}
                </span>
              </div>
              <p className="sf-src-note">{s.note}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
