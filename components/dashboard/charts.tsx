import type { VisibilityResult } from "@/lib/visibility";

/**
 * Chart primitives for the dashboard. All server-rendered — no client JS.
 *
 * Conventions held across every mark here:
 *  - Emphasis form for share of voice: your bar in the accent, everyone else in
 *    the de-emphasis gray. One hue + gray, never a rainbow of competitors.
 *  - One series → one colour. Engine meters are all the same hue; presence is
 *    carried by a text label, never by colour alone.
 *  - Values are always directly labelled, so nothing is gated behind a tooltip.
 *  - Sentiment uses the validated diverging pair (cool ↔ warm) with a neutral
 *    gray midpoint, and every segment is labelled in words as well as colour.
 */

/* ---------------------------------------------------------------- stat tiles */

export function StatTile({
  label,
  value,
  unit,
  sub,
  delta,
  deltaGood,
}: {
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
  delta?: number | null;
  deltaGood?: boolean;
}) {
  return (
    <div className="sf-tile">
      <p className="sf-tile-l">{label}</p>
      <p className="sf-tile-v">
        {value}
        {unit && <span className="sf-tile-u">{unit}</span>}
        {delta != null && delta !== 0 && (
          <span className={`sf-delta ${deltaGood ? "up" : "down"}`}>
            {delta > 0 ? "↑" : "↓"} {Math.abs(delta)}
          </span>
        )}
      </p>
      {sub && <p className="sf-tile-s">{sub}</p>}
    </div>
  );
}

/* ----------------------------------------------------------------- sparkline */

/**
 * Score trend. Single accent series, so no legend — the panel title names it.
 * Endpoints are the only direct labels; the history table carries every value.
 */
export function Sparkline({
  points,
}: {
  points: { score: number; at: string }[];
}) {
  const w = 260;
  const h = 62;
  const pad = 8;
  const scores = points.map((p) => p.score);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min || 1;
  const step = (w - pad * 2) / (points.length - 1);
  const pts = points.map((p, i) => {
    const x = pad + i * step;
    const y = pad + (h - pad * 2) * (1 - (p.score - min) / range);
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x},${y}`).join(" ");
  const area = `${pad},${h - pad} ${line} ${w - pad},${h - pad}`;
  const [lx, ly] = pts[pts.length - 1];
  const first = points[0];
  const last = points[points.length - 1];

  return (
    <div className="sf-spark-wrap">
      <svg
        className="sf-spark"
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label={`Visibility score across ${points.length} scans, from ${first.score} to ${last.score}`}
      >
        <defs>
          <linearGradient id="sfSparkFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--viz-you)" stopOpacity="0.16" />
            <stop offset="1" stopColor="var(--viz-you)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#sfSparkFill)" />
        <polyline
          points={line}
          fill="none"
          stroke="var(--viz-you)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* End marker: 8px, with a 2px surface ring so it stays legible. */}
        <circle
          cx={lx}
          cy={ly}
          r="4"
          fill="var(--viz-you)"
          stroke="var(--viz-surface)"
          strokeWidth="2"
        />
      </svg>
      <div className="sf-spark-ends">
        <span>
          {first.score} · {new Date(first.at).toLocaleDateString()}
        </span>
        <span>
          {last.score} · latest
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------- share-of-voice bars */

export function ShareBars({
  competitors,
  youRow,
}: {
  competitors: VisibilityResult["competitors"];
  youRow?: VisibilityResult["competitors"][number];
}) {
  const sorted = [...competitors].sort((a, b) => b.share - a.share);
  const max = Math.max(...sorted.map((c) => c.share), 1);
  return (
    <div className="sf-bars">
      {sorted.map((c, i) => {
        const you = c === youRow;
        return (
          <div className={`sf-bar-row ${you ? "you" : ""}`} key={`${c.name}-${i}`}>
            <span className="sf-bar-rank">{i + 1}</span>
            <span className="sf-bar-name">
              {c.name}
              {you && <span className="sf-you-tag">you</span>}
            </span>
            <span className="sf-bar-track">
              <span
                className="sf-bar-fill"
                style={{
                  width: `${Math.max((c.share / max) * 100, 1.5)}%`,
                  background: you ? "var(--viz-you)" : "var(--viz-ctx)",
                }}
              />
            </span>
            {/* Value sits outside the bar end, so a 2% bar never clips its label. */}
            <span className="sf-bar-val">{Math.round(c.share)}%</span>
          </div>
        );
      })}
    </div>
  );
}

/* --------------------------------------------------------------- engine meter */

export function EngineMeters({
  engines,
}: {
  engines: VisibilityResult["engines"];
}) {
  const sorted = [...engines].sort((a, b) => b.score - a.score);
  return (
    <div className="sf-meters">
      {sorted.map((e) => (
        <div className="sf-meter" key={e.name}>
          <div className="sf-meter-head">
            <span className="sf-meter-name">{e.name}</span>
            <span className="sf-meter-val">{Math.round(e.score)}</span>
          </div>
          <span className="sf-meter-track">
            <span
              className="sf-meter-fill"
              style={{ width: `${Math.max(Math.min(e.score, 100), 1)}%` }}
            />
          </span>
          <span className={`sf-pres ${e.mentioned ? "in" : "out"}`}>
            {e.mentioned ? "Mentions you" : "Doesn't mention you"}
          </span>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------- sentiment mix */

/**
 * Diverging stacked bar centred on neutral: negative ← neutral → positive.
 * Segments are separated by a 2px surface gap and each is labelled in words,
 * so polarity never depends on hue alone.
 */
export function SentimentMix({
  positivePct,
  negativePct,
}: {
  positivePct: number;
  negativePct: number;
}) {
  const pos = Math.max(0, Math.min(100, Math.round(positivePct)));
  const neg = Math.max(0, Math.min(100, Math.round(negativePct)));
  const mid = Math.max(0, 100 - pos - neg);
  const segs = [
    { key: "Negative", pct: neg, color: "var(--viz-neg)" },
    { key: "Neutral", pct: mid, color: "var(--viz-mid)" },
    { key: "Positive", pct: pos, color: "var(--viz-pos)" },
  ].filter((s) => s.pct > 0);

  return (
    <div className="sf-mix-wrap">
      <div
        className="sf-mix"
        role="img"
        aria-label={`Sentiment mix: ${neg}% negative, ${mid}% neutral, ${pos}% positive`}
      >
        {segs.map((s) => (
          <span
            key={s.key}
            className="sf-mix-seg"
            style={{ width: `${s.pct}%`, background: s.color }}
          />
        ))}
      </div>
      <div className="sf-mix-key">
        {segs.map((s) => (
          <span className="sf-key-item" key={s.key}>
            <i className="sf-key-dot" style={{ background: s.color }} />
            {s.key} <b>{s.pct}%</b>
          </span>
        ))}
      </div>
    </div>
  );
}
