import type { VisibilityResult } from "@/lib/visibility";
import { findYou, standing } from "@/lib/report-derive";
import { ShareBars } from "./charts";

/**
 * Who wins the answers you want. The bars use the emphasis form — your brand in
 * the accent, every competitor in the de-emphasis gray — because the story is
 * one brand's position, not seven identities.
 */
export function CompetitorsPanel({
  brandName,
  data,
}: {
  brandName: string;
  data: VisibilityResult;
}) {
  const place = standing(data.competitors, brandName);
  const you = findYou(data.competitors, brandName);
  const sorted = [...data.competitors].sort((a, b) => b.share - a.share);

  return (
    <>
      <section className="sf-panel">
        <div className="sf-panel-head">
          <h2 className="sf-panel-t">Share of voice</h2>
          <p className="sf-panel-sub">
            How often each brand is named when buyers ask about{" "}
            {data.competitors.length} options in your category
          </p>
        </div>

        {place.rank && place.leader && (
          <p className="sf-lede">
            {place.rank === 1 ? (
              <>
                You <b>lead the category</b> with{" "}
                {Math.round(place.yourShare)}% share of voice.
              </>
            ) : (
              <>
                You sit at <b>#{place.rank} of {place.total}</b> with{" "}
                {Math.round(place.yourShare)}% share.{" "}
                <b>{place.leader.name}</b> takes{" "}
                {Math.round(place.leader.share)}%
                {place.leaderMultiple
                  ? ` — ${place.leaderMultiple}× yours`
                  : ""}
                .
              </>
            )}
          </p>
        )}

        <ShareBars competitors={data.competitors} youRow={you} />

        {/* The accessible table twin for the chart above — same numbers plus the
            gap to each rival, collapsed so it doesn't duplicate the page. */}
        <details className="sf-drop">
          <summary>Table view · gap to each brand</summary>
          <div className="sf-table-scroll" style={{ marginTop: 12 }}>
          <table className="sf-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Brand</th>
                <th className="num">Share</th>
                <th className="num">Vs. you</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c, i) => {
                const isYou = c === you;
                const gap = Math.round(c.share - place.yourShare);
                return (
                  <tr key={`${c.name}-${i}`} className={isYou ? "you" : ""}>
                    <td className="num muted">{i + 1}</td>
                    <td>
                      {c.name}
                      {isYou && <span className="sf-you-tag">you</span>}
                    </td>
                    <td className="num">{Math.round(c.share)}%</td>
                    <td className="num">
                      {isYou ? (
                        <span className="muted">—</span>
                      ) : (
                        <span className={gap > 0 ? "behind" : "ahead"}>
                          {gap > 0 ? `+${gap}` : gap} pts
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </details>
      </section>
    </>
  );
}
