import Link from "next/link";
import type { VisibilityResult } from "@/lib/visibility";
import type { Snapshot } from "@/lib/queries";
import {
  citationStanding,
  engineStanding,
  rankedActions,
  standing,
  verdictFor,
} from "@/lib/report-derive";
import { takeaway } from "@/lib/action-format";
import { EngineMeters, Sparkline, StatTile } from "./charts";

/**
 * The answer-first panel: what your score means in words, then the four numbers
 * behind it, then the single move to make next. Everything is derived from the
 * stored scan — nothing here is illustrative.
 */
export function OverviewPanel({
  brandName,
  data,
  score,
  history,
  delta,
}: {
  brandName: string;
  data: VisibilityResult;
  score: number;
  history: Snapshot[];
  delta: number | null;
}) {
  const verdict = verdictFor(score);
  const place = standing(data.competitors, brandName);
  const engines = engineStanding(data.engines);
  const cites = citationStanding(data.citedSources);
  const top = rankedActions(data.actions)[0];

  // History arrives newest-first; a trend reads oldest → newest.
  const points = [...history]
    .reverse()
    .map((s) => ({ score: s.score, at: s.created_at }));

  return (
    <>
      <section className={`sf-hero tone-${verdict.tone}`}>
        <div className="sf-hero-figure">
          <p className="sf-hero-num">{Math.round(score)}</p>
          <p className="sf-hero-scale">out of 100</p>
        </div>
        <div className="sf-hero-read">
          <p className="sf-hero-verdict">
            {verdict.label}
            {delta != null && delta !== 0 && (
              <span className={`sf-delta ${delta > 0 ? "up" : "down"}`}>
                {delta > 0 ? "↑" : "↓"} {Math.abs(delta)} since last scan
              </span>
            )}
          </p>
          <p className="sf-hero-mean">{verdict.meaning}</p>
          {place.leader && place.rank && (
            <p className="sf-hero-fact">
              You rank <b>#{place.rank} of {place.total}</b> in your category
              {place.rank > 1 && place.leaderMultiple
                ? ` — ${place.leader.name} holds ${place.leaderMultiple}× your share of voice.`
                : place.rank === 1
                  ? " — you lead the category."
                  : "."}
            </p>
          )}
        </div>
      </section>

      <div className="sf-tiles">
        <StatTile
          label="Share of voice"
          value={Math.round(place.yourShare)}
          unit="%"
          sub={place.rank ? `Rank #${place.rank} of ${place.total}` : "Not ranked"}
        />
        <StatTile
          label="Engines mentioning you"
          value={engines.mentioned}
          unit={` / ${engines.total}`}
          sub={
            engines.best
              ? `Strongest on ${engines.best.name}`
              : "No engine data"
          }
        />
        <StatTile
          label="Cited sources you own"
          value={cites.total ? cites.yours : "—"}
          unit={cites.total ? ` / ${cites.total}` : undefined}
          sub={
            cites.total
              ? `${cites.missing} sources you're absent from`
              : "Refresh to collect citations"
          }
        />
        <StatTile
          label="Scans recorded"
          value={history.length}
          sub={
            history.length > 1
              ? "Trend is building"
              : "Second scan starts your trend"
          }
        />
      </div>

      {/* The trend only earns a panel once there's something to plot — an empty
          chart is the first thing every new account would otherwise see. */}
      {points.length > 1 && (
        <section className="sf-panel">
          <div className="sf-panel-head">
            <h2 className="sf-panel-t">Score trend</h2>
            <p className="sf-panel-sub">{points.length} scans</p>
          </div>
          <Sparkline points={points} />
        </section>
      )}

      <div className="sf-grid-2">
        <section className="sf-panel">
          <div className="sf-panel-head">
            <h2 className="sf-panel-t">Visibility by engine</h2>
            <p className="sf-panel-sub">Score out of 100</p>
          </div>
          <EngineMeters engines={data.engines} />
        </section>

        <section className="sf-panel">
          <div className="sf-panel-head">
            <h2 className="sf-panel-t">What the assistants say</h2>
          </div>
          <p className="sf-narrative">{data.summary}</p>
          {points.length < 2 && (
            <p className="sf-empty sm" style={{ marginTop: 14 }}>
              Refresh again to start your trend line and see whether the moves
              are working.
            </p>
          )}
        </section>
      </div>

      {top && (
        <section className="sf-panel sf-next">
          <div className="sf-panel-head">
            <h2 className="sf-panel-t">Do this next</h2>
            <Link href="/dashboard?tab=actions" className="sf-link">
              All {data.actions.length} moves →
            </Link>
          </div>
          <div className="sf-next-body">
            <span className={`sf-impact ${top.impact}`}>{top.impact} impact</span>
            <h3>{top.title}</h3>
            {/* One line here; the steps and snippets live on the Actions page. */}
            <p>{takeaway(top.detail)}</p>
          </div>
        </section>
      )}
    </>
  );
}
