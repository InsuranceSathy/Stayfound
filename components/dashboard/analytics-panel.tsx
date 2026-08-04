import type { VisibilityResult } from "@/lib/visibility";
import type { Snapshot } from "@/lib/queries";
import { SentimentMix } from "./charts";

function ThemeItem({ theme, quote }: { theme: string; quote: string }) {
  return (
    <li>
      <b>{theme}</b>
      <details className="sf-drop xs">
        <summary>evidence</summary>
        <q>{quote}</q>
      </details>
    </li>
  );
}

/**
 * How assistants talk about you, engine by engine, over time.
 *
 * These are AI-answer analytics — what the assistants say and score — not
 * website traffic. Nothing here claims to measure clicks or referrals.
 */
export function AnalyticsPanel({
  data,
  history,
}: {
  data: VisibilityResult;
  history: Snapshot[];
}) {
  const s = data.sentiment;
  const positives = s?.positiveThemes ?? [];
  const negatives = s?.negativeThemes ?? [];

  return (
    <>
      <section className="sf-panel">
        <div className="sf-panel-head">
          <h2 className="sf-panel-t">How assistants describe you</h2>
          {s?.label && <p className="sf-panel-sub">Overall tone: {s.label}</p>}
        </div>

        {s ? (
          <>
            <SentimentMix
              positivePct={s.positivePct}
              negativePct={s.negativePct}
            />
            {/* Headlines carry the insight; the supporting quote stays one
                click away so this page scans like the others. */}
            <div className="sf-themes">
              <div>
                <h3 className="sf-sub-h">What helps you</h3>
                {positives.length ? (
                  <ul className="sf-theme-list">
                    {positives.map((t, i) => (
                      <ThemeItem key={i} theme={t.theme} quote={t.quote} />
                    ))}
                  </ul>
                ) : (
                  <p className="sf-empty sm">No positive themes captured.</p>
                )}
              </div>
              <div>
                <h3 className="sf-sub-h">What holds you back</h3>
                {negatives.length ? (
                  <ul className="sf-theme-list">
                    {negatives.map((t, i) => (
                      <ThemeItem key={i} theme={t.theme} quote={t.quote} />
                    ))}
                  </ul>
                ) : (
                  <p className="sf-empty sm">No negative themes captured.</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <p className="sf-empty">
            This scan didn&apos;t capture sentiment. Run a refresh to collect it.
          </p>
        )}
      </section>

      <div className="sf-grid-2">
        <section className="sf-panel">
          <div className="sf-panel-head">
            <h2 className="sf-panel-t">Engine detail</h2>
          </div>
          <div className="sf-table-scroll">
            <table className="sf-table">
              <thead>
                <tr>
                  <th>Engine</th>
                  <th className="num">Score</th>
                  <th>Names you</th>
                </tr>
              </thead>
              <tbody>
                {[...data.engines]
                  .sort((a, b) => b.score - a.score)
                  .map((e) => (
                    <tr key={e.name}>
                      <td>{e.name}</td>
                      <td className="num">{Math.round(e.score)}</td>
                      <td>
                        <span className={`sf-pres ${e.mentioned ? "in" : "out"}`}>
                          {e.mentioned ? "Yes" : "No"}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Table view for the trend line — every recorded value, nothing gated. */}
        <section className="sf-panel">
          <div className="sf-panel-head">
            <h2 className="sf-panel-t">Scan history</h2>
            <p className="sf-panel-sub">{history.length} recorded</p>
          </div>
          <div className="sf-table-scroll">
            <table className="sf-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th className="num">Score</th>
                  <th className="num">Change</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => {
                  const prev = history[i + 1];
                  const d = prev ? h.score - prev.score : null;
                  return (
                    <tr key={h.id}>
                      <td>
                        {new Date(h.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="num">{Math.round(h.score)}</td>
                      <td className="num">
                        {d == null ? (
                          <span className="muted">first</span>
                        ) : d === 0 ? (
                          <span className="muted">0</span>
                        ) : (
                          <span className={d > 0 ? "ahead" : "behind"}>
                            {d > 0 ? `+${d}` : d}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
