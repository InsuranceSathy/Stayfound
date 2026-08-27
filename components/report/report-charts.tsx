/**
 * Print-safe chart primitives for the report document.
 *
 * These are static SVG/HTML marks, not an interactive chart library: the
 * report is a document that gets printed and passed around, so every chart
 * here renders identically on screen and paper, and every number a chart
 * shows also lives in a table on the same page. Color is used once, for one
 * job — the brand's own mark is the signal gold, everything else is neutral —
 * so identity never depends on hue alone.
 */

/* A 0–100 meter: filled to the value, with the scale's ends labelled so the
   bar reads as a position on a fixed scale rather than a loading indicator. */
export function ScoreMeter({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="rpc-meter" role="img" aria-label={`Score ${Math.round(v)} of 100`}>
      <div className="rpc-meter-track">
        <div className="rpc-meter-fill" style={{ width: `${v}%` }} />
      </div>
      <div className="rpc-meter-scale">
        <span>0</span>
        <span>25</span>
        <span>50</span>
        <span>75</span>
        <span>100</span>
      </div>
    </div>
  );
}

/* A bar that lives inside a table cell, scaled against the column's max so
   the longest bar always fills the slot. The value stays in its own numeric
   cell — the bar is the shape, the cell is the number. */
export function CellBar({
  value,
  max,
  highlight,
}: {
  value: number;
  max: number;
  highlight?: boolean;
}) {
  const w = max > 0 ? Math.max(1.5, (Math.max(0, value) / max) * 100) : 0;
  return (
    <div className="rpc-cellbar" aria-hidden="true">
      <div
        className={`rpc-cellbar-fill${highlight ? " hi" : ""}`}
        style={{ width: `${w}%` }}
      />
    </div>
  );
}

/* Score readings over time. One series (the brand), so it wears the accent;
   grid at clean 0/25/50/75/100 steps; the latest reading gets the end dot and
   the only direct label — the table below carries every other value. */
export function TrendChart({
  points,
}: {
  points: { date: string; score: number }[];
}) {
  if (points.length < 2) return null;

  const W = 560;
  const H = 170;
  const pad = { top: 14, right: 44, bottom: 22, left: 30 };
  const iw = W - pad.left - pad.right;
  const ih = H - pad.top - pad.bottom;

  const x = (i: number) => pad.left + (i / (points.length - 1)) * iw;
  const y = (s: number) => pad.top + (1 - Math.max(0, Math.min(100, s)) / 100) * ih;

  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.score).toFixed(1)}`)
    .join(" ");
  const area = `${d} L${x(points.length - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z`;

  const last = points[points.length - 1];
  const first = points[0];

  return (
    <svg
      className="rpc-trend"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Visibility score over ${points.length} readings, from ${Math.round(first.score)} to ${Math.round(last.score)}`}
    >
      {[0, 25, 50, 75, 100].map((g) => (
        <g key={g}>
          <line className="rpc-grid" x1={pad.left} x2={W - pad.right} y1={y(g)} y2={y(g)} />
          <text className="rpc-tick" x={pad.left - 6} y={y(g) + 3} textAnchor="end">
            {g}
          </text>
        </g>
      ))}
      <path className="rpc-area" d={area} />
      <path className="rpc-line" d={d} />
      <circle className="rpc-dot-ring" cx={x(points.length - 1)} cy={y(last.score)} r={6.5} />
      <circle className="rpc-dot" cx={x(points.length - 1)} cy={y(last.score)} r={4.5} />
      <text
        className="rpc-endlabel"
        x={x(points.length - 1) + 11}
        y={y(last.score) + 4}
      >
        {Math.round(last.score)}
      </text>
      <text className="rpc-tick" x={x(0)} y={H - 6} textAnchor="start">
        {first.date}
      </text>
      <text className="rpc-tick" x={x(points.length - 1)} y={H - 6} textAnchor="end">
        {last.date}
      </text>
    </svg>
  );
}

/* Positive / negative sentiment as one divided bar. The two segments are
   separated by a surface gap and each is labelled with its own number, so the
   split never depends on judging color. */
export function SentimentBar({
  positive,
  negative,
}: {
  positive: number;
  negative: number;
}) {
  const pos = Math.max(0, Math.min(100, positive));
  const neg = Math.max(0, Math.min(100 - pos, negative));
  const neutral = Math.max(0, 100 - pos - neg);
  return (
    <div className="rpc-split" role="img" aria-label={`${pos}% positive, ${neg}% negative`}>
      <div className="rpc-split-track">
        {pos > 0 && <div className="rpc-split-pos" style={{ width: `${pos}%` }} />}
        {neutral > 0 && <div className="rpc-split-mid" style={{ width: `${neutral}%` }} />}
        {neg > 0 && <div className="rpc-split-neg" style={{ width: `${neg}%` }} />}
      </div>
      <div className="rpc-split-key">
        <span>
          <i className="rpc-swatch pos" /> Positive {pos}%
        </span>
        {neutral > 0 && (
          <span>
            <i className="rpc-swatch mid" /> Neutral {neutral}%
          </span>
        )}
        <span>
          <i className="rpc-swatch neg" /> Negative {neg}%
        </span>
      </div>
    </div>
  );
}

/* Citation coverage: of the sources assistants lean on, how many carry the
   brand. Discrete cells rather than a continuous bar because the total is a
   small countable number — 3 of 11 should look like 3 of 11. */
export function CoverageCells({ yours, total }: { yours: number; total: number }) {
  if (total < 1) return null;
  return (
    <div
      className="rpc-cells"
      role="img"
      aria-label={`On ${yours} of ${total} cited sources`}
    >
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`rpc-cell${i < yours ? " on" : ""}`} />
      ))}
      <span className="rpc-cells-label">
        {yours} of {total} sources
      </span>
    </div>
  );
}
