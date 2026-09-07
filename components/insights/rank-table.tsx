import type { RankRow } from "@/lib/metrics";

/**
 * The ranked table that sits beside every chart: who leads, by how much, and
 * which way it moved.
 *
 * A dash, not a zero, when there is no previous period to compare against.
 * "0.0" would claim the number held steady when the truth is that nothing was
 * measured before it.
 */
export function RankTable({
  rows,
  heading,
  valueLabel,
  suffix = "%",
  emptyNote,
}: {
  rows: RankRow[];
  heading: string;
  valueLabel: string;
  suffix?: string;
  emptyNote: string;
}) {
  if (!rows.length) return <p className="ai-empty">{emptyNote}</p>;
  return (
    <table className="ai-rank">
      <thead>
        <tr>
          <th className="ai-n">#</th>
          <th>{heading}</th>
          <th className="ai-num">{valueLabel}</th>
          <th className="ai-num">Change</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={`${r.name}-${i}`} className={r.owned ? "is-you" : ""}>
            <td className="ai-n">{i + 1}</td>
            <td>
              {r.name}
              {r.owned && <span className="ai-owned">Owned</span>}
            </td>
            <td className="ai-num">
              {Math.round(r.value * 10) / 10}
              {suffix}
            </td>
            <td className="ai-num">
              {r.delta === null ? (
                <span className="ai-flat">—</span>
              ) : (
                <span className={r.delta > 0 ? "ai-up" : r.delta < 0 ? "ai-down" : "ai-flat"}>
                  {r.delta > 0 ? "+" : ""}
                  {r.delta}
                  {suffix}
                </span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
