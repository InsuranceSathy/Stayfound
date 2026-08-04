import type { VisibilityResult } from "@/lib/visibility";
import { rankedActions } from "@/lib/report-derive";

/**
 * The work, ordered by impact. Actions come from the scan, so they name the
 * specific directories, competitors and pages found for this brand rather than
 * generic advice.
 */
export function ActionsPanel({ data }: { data: VisibilityResult }) {
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
          {actions.map((a, i) => (
            <li className="sf-move" key={i}>
              <span className="sf-move-n">{i + 1}</span>
              <div className="sf-move-body">
                <div className="sf-move-head">
                  <h3>{a.title}</h3>
                  <span className={`sf-impact ${a.impact}`}>{a.impact}</span>
                </div>
                <p>{a.detail}</p>
              </div>
            </li>
          ))}
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
                <p>{idea.description}</p>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
