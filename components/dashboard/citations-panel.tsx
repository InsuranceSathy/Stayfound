import type { VisibilityResult } from "@/lib/visibility";
import { citationStanding } from "@/lib/report-derive";

/**
 * The sources AI answers lean on, as a checklist rather than an essay: domain,
 * whether you're on it, and what to do. The reasoning stays one click away so
 * the page can be read at a glance.
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
    <section className="sf-panel">
      <div className="sf-panel-head">
        <h2 className="sf-panel-t">Where AI gets its answers</h2>
        <p className="sf-panel-sub">
          {cites.total} sources · you&apos;re on {cites.yours} ·{" "}
          {cites.missing} to win
        </p>
      </div>

      <ul className="sf-srcs">
        {sources.map((s, i) => (
          <li className={`sf-src ${s.isYou ? "mine" : ""}`} key={`${s.domain}-${i}`}>
            <div className="sf-src-row">
              <span className="sf-src-dom">{s.domain}</span>
              <span className={`sf-src-tag ${s.isYou ? "mine" : "gap"}`}>
                {s.isYou ? "you're on it" : "not listed"}
              </span>
              {!s.isYou && <span className="sf-src-do">→ get listed</span>}
            </div>
            <details className="sf-drop sm">
              <summary>Why AI cites this</summary>
              <p>{s.note}</p>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}
