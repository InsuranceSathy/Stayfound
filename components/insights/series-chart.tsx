/**
 * The line every tab reuses: one metric over the chosen window.
 *
 * SVG rather than a chart library — it is a polyline and a few ticks, it has to
 * survive being printed, and a charting dependency for this would be the
 * heaviest thing in the bundle.
 *
 * Deliberately draws gaps as gaps. Readings are taken on the days a scan ran,
 * and joining across a week of silence would invent a trend that was never
 * measured.
 */
export function SeriesChart({
  points,
  suffix = "",
  label,
}: {
  points: { day: string; value: number | null }[];
  suffix?: string;
  label: string;
}) {
  const real = points.filter((p) => p.value !== null) as { day: string; value: number }[];

  if (real.length < 2) {
    return (
      <div className="ai-chart-empty">
        {real.length === 1
          ? "One reading so far. The line appears once there are two."
          : "No readings in this window."}
      </div>
    );
  }

  const W = 640;
  const H = 190;
  const PAD = { l: 34, r: 8, t: 10, b: 22 };
  const values = real.map((p) => p.value);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  // A flat series would divide by zero; give it a band so the line sits mid-box.
  const min = lo === hi ? Math.max(0, lo - 5) : lo - (hi - lo) * 0.15;
  const max = lo === hi ? lo + 5 : hi + (hi - lo) * 0.15;

  const x = (i: number) =>
    PAD.l + (i / (real.length - 1)) * (W - PAD.l - PAD.r);
  const y = (v: number) =>
    PAD.t + (1 - (v - min) / (max - min)) * (H - PAD.t - PAD.b);

  const path = real.map((p, i) => `${i ? "L" : "M"}${x(i)} ${y(p.value)}`).join(" ");
  const ticks = [max, (max + min) / 2, min];
  const short = (d: string) =>
    new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  return (
    <svg className="ai-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      {ticks.map((t, i) => (
        <g key={i}>
          <line
            className="ai-grid"
            x1={PAD.l} x2={W - PAD.r}
            y1={y(t)} y2={y(t)}
          />
          <text className="ai-tick" x={PAD.l - 6} y={y(t) + 3} textAnchor="end">
            {Math.round(t)}{suffix}
          </text>
        </g>
      ))}
      <path className="ai-line" d={path} />
      {real.map((p, i) => (
        <circle key={i} className="ai-dot" cx={x(i)} cy={y(p.value)} r={2.6} />
      ))}
      <text className="ai-tick" x={PAD.l} y={H - 6}>{short(real[0].day)}</text>
      <text className="ai-tick" x={W - PAD.r} y={H - 6} textAnchor="end">
        {short(real[real.length - 1].day)}
      </text>
    </svg>
  );
}
