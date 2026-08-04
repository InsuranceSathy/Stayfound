import type { VisibilityResult } from "@/lib/visibility";
import { rankedActions } from "@/lib/report-derive";
import { steps, takeaway } from "@/lib/action-format";
import { snippetsFor } from "@/lib/snippets";
import { CopyBlock } from "./copy-block";

/**
 * The work, highest impact first.
 *
 * Each move leads with one sentence — the reason it matters — and keeps the
 * detail collapsed as a step list, so the page is scannable at a glance and
 * still complete when you open it. Where a step asks for schema, crawler
 * access or directory listings, a paste-ready snippet comes with it.
 */
export function ActionsPanel({
  data,
  brand,
}: {
  data: VisibilityResult;
  brand: { name: string; category: string };
}) {
  const actions = rankedActions(data.actions);
  const ideas = data.contentIdeas ?? [];

  return (
    <>
      <section className="sf-panel">
        <div className="sf-panel-head">
          <h2 className="sf-panel-t">Recommended moves</h2>
          <p className="sf-panel-sub">Highest impact first</p>
        </div>

        <ol className="sf-moves">
          {actions.map((a, i) => {
            const list = steps(a.detail);
            const snippets = snippetsFor(a, brand);
            return (
              <li className="sf-move" key={i}>
                <span className="sf-move-n">{i + 1}</span>
                <div className="sf-move-body">
                  <div className="sf-move-head">
                    <h3>{a.title}</h3>
                    <span className={`sf-impact ${a.impact}`}>{a.impact}</span>
                  </div>
                  <p className="sf-move-why">{takeaway(a.detail)}</p>

                  {(list.length > 0 || snippets.length > 0) && (
                    <details className="sf-drop">
                      <summary>
                        {list.length > 0
                          ? `How to ship it · ${list.length} step${list.length > 1 ? "s" : ""}`
                          : "How to ship it"}
                        {snippets.length > 0 && (
                          <span className="sf-drop-tag">
                            {snippets.length} snippet
                            {snippets.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </summary>
                      {list.length > 0 && (
                        <ul className="sf-steps">
                          {list.map((s, k) => (
                            <li key={k}>{s}</li>
                          ))}
                        </ul>
                      )}
                      {snippets.map((s, k) => (
                        <CopyBlock snippet={s} key={k} />
                      ))}
                    </details>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {ideas.length > 0 && (
        <section className="sf-panel">
          <div className="sf-panel-head">
            <h2 className="sf-panel-t">Content that earns citations</h2>
            <p className="sf-panel-sub">
              Formats assistants quote most in your category
            </p>
          </div>
          <div className="sf-ideas">
            {ideas.map((idea, i) => (
              <article className="sf-idea" key={i}>
                <span className="sf-idea-type">{idea.type}</span>
                <h3>{idea.title}</h3>
                <details className="sf-drop sm">
                  <summary>Why this works</summary>
                  <p>{idea.description}</p>
                </details>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
