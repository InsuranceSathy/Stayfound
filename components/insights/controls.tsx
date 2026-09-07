import Link from "next/link";

/**
 * The date-range row.
 *
 * Links, not a dropdown, for the same reason the brand switcher is: a range is
 * part of what you are looking at, so it belongs in the URL where it can be
 * bookmarked and sent to a colleague.
 */
const RANGES = [
  { days: 7, label: "Last 7 days" },
  { days: 30, label: "Last 30 days" },
  { days: 90, label: "Last 90 days" },
];

export function RangeBar({
  brandId,
  tab,
  days,
  answers,
}: {
  brandId: string;
  tab: string;
  days: number;
  /** How many stored answers back this view — the honest version of an
   *  "Export N answers" button. Zero until a scan has run since the grid
   *  started being kept, and we say so rather than showing a fake number. */
  answers: number;
}) {
  const href = (d: number) =>
    `/dashboard?brand=${brandId}&tab=${tab}&days=${d}`;
  return (
    <div className="ai-bar">
      <div className="ai-ranges">
        {RANGES.map((r) => (
          <Link
            key={r.days}
            href={href(r.days)}
            className={`ai-range ${r.days === days ? "on" : ""}`}
            aria-current={r.days === days ? "page" : undefined}
          >
            {r.label}
          </Link>
        ))}
      </div>
      <span className="ai-vs">vs. previous period</span>
      <span className="ai-bar-sp" />
      <span className="ai-answers">
        {answers > 0
          ? `${answers.toLocaleString()} answers on record`
          : "answers recorded from the next scan"}
      </span>
    </div>
  );
}
