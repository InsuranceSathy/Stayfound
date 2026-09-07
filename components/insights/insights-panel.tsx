import type { Brand } from "@/lib/queries";
import type { VisibilityResult } from "@/lib/visibility";
import {
  citationRows, engineRows, metricSummary, promptRows,
  visibilitySeries, windowFor, answerCount,
} from "@/lib/metrics";
import { RangeBar } from "@/components/insights/controls";
import { SeriesChart } from "@/components/insights/series-chart";
import { RankTable } from "@/components/insights/rank-table";
import { standing } from "@/lib/report-derive";
import { citationTypes } from "@/lib/citation-kind";

/**
 * Answer Engine Insights: the same question asked of four dimensions.
 *
 * Every block here is one chart plus one ranked table, because that is the
 * shape of the underlying data — a metric over days, and the same metric split
 * by a dimension. Keeping the pair identical everywhere means a customer learns
 * to read one panel and can then read all of them.
 *
 * Reads `daily_metric`, never the snapshot blob. The blob is one reading; these
 * are the rows across readings, which is the only way a trend exists.
 */
export async function InsightsPanel({
  brand,
  data,
  days,
  section,
}: {
  brand: Brand;
  /** The newest reading, for the parts that are a snapshot by nature —
   *  sentiment themes and today's competitor set. */
  data: VisibilityResult;
  days: number;
  section: "visibility" | "prompts" | "platforms" | "citations" | "sentiment";
}) {
  const w = windowFor(days);
  const answers = await answerCount(brand.id);

  return (
    <div className="ai">
      <RangeBar brandId={brand.id} tab={section} days={days} answers={answers} />
      {section === "visibility" && <Visibility brand={brand} data={data} w={w} />}
      {section === "prompts" && <Prompts brand={brand} w={w} />}
      {section === "platforms" && <Platforms brand={brand} w={w} />}
      {section === "citations" && <Citations brand={brand} w={w} />}
      {section === "sentiment" && <Sentiment brand={brand} data={data} w={w} />}
    </div>
  );
}

type W = ReturnType<typeof windowFor>;

async function Visibility({ brand, data, w }: { brand: Brand; data: VisibilityResult; w: W }) {
  const [series, summary] = await Promise.all([
    visibilitySeries(brand.id, w.start, w.end),
    metricSummary(brand.id, w),
  ]);
  const place = standing(data.competitors, brand.name);
  const sorted = [...data.competitors].sort((a, b) => b.share - a.share);
  const you = place.rank;
  const topShare = Math.max(...sorted.map((c) => c.share), 1);

  return (
    <>
      <Block
        title="Visibility score"
        note={`How often ${brand.name} appears in AI answers`}
        value={summary.value}
        delta={summary.delta}
        suffix=""
        chart={<SeriesChart points={series} label="Visibility score over time" />}
        side={
          <>
            <p className="ai-side-k">Rank in category</p>
            <p className="ai-side-v">{you ? `#${you}` : "—"}</p>
            <p className="ai-note">
              {place.leader && you && you > 1
                ? `${place.leader.name} leads on ${Math.round(place.leader.share)}%. Closing ${place.gapPoints} points takes the top slot.`
                : you === 1
                  ? "You lead the category."
                  : "No ranking on the latest reading."}
            </p>
          </>
        }
      />

      {/* Its own section rather than a table wedged beside the chart: share of
          voice answers a different question from the score, and the two were
          competing for the same glance. */}
      <div className="ai-card">
        <div className="ai-card-head">
          <h3 className="ai-h3">Share of voice</h3>
          <p className="ai-note">
            How often each brand is named, relative to the others
          </p>
        </div>
        <div className="ai-sov">
          {sorted.map((c, i) => (
            <div className={`ai-sov-row ${i + 1 === you ? "is-you" : ""}`} key={`${c.name}-${i}`}>
              <span className="ai-sov-n">{i + 1}</span>
              <span className="ai-sov-name">
                {c.name}
                {i + 1 === you && <span className="ai-owned">Owned</span>}
              </span>
              <span className="ai-sov-track">
                <span
                  className="ai-sov-fill"
                  style={{ width: `${Math.max(1.5, (c.share / topShare) * 100)}%` }}
                />
              </span>
              <span className="ai-sov-v">{Math.round(c.share)}%</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

async function Prompts({ brand, w }: { brand: Brand; w: W }) {
  const rows = await promptRows(brand.id, w);
  if (!rows.length) {
    return (
      <Empty
        title="No prompt-level rows yet"
        body={
          "Prompt results are written whenever a scan reports which question " +
          "produced which answer. The hosted scorer currently returns totals " +
          "per assistant only, so this fills in once it reports per prompt — " +
          "the storage and the table are ready for it."
        }
      />
    );
  }
  // Grouped by topic, which is how a customer thinks about them — and rows
  // without a topic are still shown rather than silently dropped.
  const groups = new Map<string, typeof rows>();
  for (const r of rows) {
    const k = r.topic ?? "Ungrouped";
    groups.set(k, [...(groups.get(k) ?? []), r]);
  }
  return (
    <div className="ai-card">
      <h3 className="ai-h3">{rows.length} tracked prompts</h3>
      <table className="ai-prompts">
        <thead>
          <tr>
            <th>Prompt</th>
            <th className="ai-num">Visibility</th>
            <th className="ai-num">Avg. position</th>
            <th className="ai-num">Answers</th>
          </tr>
        </thead>
        {[...groups.entries()].map(([topic, list]) => (
          <tbody key={topic}>
            <tr className="ai-group">
              <td colSpan={4}>
                {topic}
                <span className="ai-group-n">{list.length} prompts</span>
              </td>
            </tr>
            {list.map((r) => (
              <tr key={r.id}>
                <td className="ai-prompt-t">{r.text}</td>
                <td className="ai-num">{r.visibility}%</td>
                <td className="ai-num">{r.avgPosition ?? "—"}</td>
                <td className="ai-num">{r.answers}</td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}

async function Platforms({ brand, w }: { brand: Brand; w: W }) {
  const rows = await engineRows(brand.id, w);
  const best = rows[0]?.name ?? null;
  const series = best ? await visibilitySeries(brand.id, w.start, w.end, best) : [];
  return (
    <Block
      title="Assistant by assistant"
      note="Not every engine sees you the same way"
      value={rows.length ? Math.round((rows.reduce((a, r) => a + r.value, 0) / rows.length) * 10) / 10 : null}
      delta={null}
      suffix=""
      chart={
        best ? (
          <>
            <p className="ai-chart-cap">{best}, over the window</p>
            <SeriesChart points={series} label={`${best} visibility over time`} />
          </>
        ) : (
          <div className="ai-chart-empty">No per-engine readings in this window.</div>
        )
      }
      side={
        <RankTable
          rows={rows}
          heading="Assistant"
          valueLabel="Visibility"
          suffix=""
          emptyNote="No per-engine readings in this window."
        />
      }
    />
  );
}

async function Citations({ brand, w }: { brand: Brand; w: W }) {
  const rows = await citationRows(brand.id, w);
  const mine = rows.filter((r) => r.owned).length;
  // Built from the same windowed rows as the table below, not from the latest
  // snapshot: a bar over 6 sources sitting above a table of 11 invites the
  // reader to reconcile two numbers that were never the same denominator.
  // Classified from the domain, so it works on readings already stored — no
  // re-scan is needed to light it up.
  const types = citationTypes(
    rows.map((r) => ({ domain: r.name, share: r.value, isYou: r.owned })),
    [brand.name],
  );
  // Your own line in the table, promoted to a headline. Every other tab leads
  // with "here is your number and where it ranks"; this one made the reader
  // find their own row.
  const yours = rows.find((r) => r.owned);
  const yourRank = yours ? rows.indexOf(yours) + 1 : null;

  return (
    <div className="ai-card">
      <h3 className="ai-h3">Where the answers are sourced</h3>
      <p className="ai-note">
        {rows.length
          ? `${mine} of ${rows.length} cited domains are yours.`
          : "No citations recorded in this window."}
      </p>

      {rows.length > 0 && (
        <div className="ai-cite-head">
          <div>
            <p className="ai-side-k">Your citation share</p>
            <p className="ai-big">
              {yours ? `${Math.round(yours.value * 10) / 10}%` : "0%"}
            </p>
          </div>
          <div>
            <p className="ai-side-k">Citation rank</p>
            <p className="ai-big">{yourRank ? `#${yourRank}` : "—"}</p>
          </div>
          <div>
            <p className="ai-side-k">Domains cited</p>
            <p className="ai-big">{rows.length}</p>
          </div>
        </div>
      )}

      {types.length > 0 && (
        <div className="ai-types">
          <p className="ai-side-k">What kind of page shapes your answers</p>
          <div className="ai-typebar" role="img"
            aria-label={types.map((t) => `${t.label} ${t.share}%`).join(", ")}>
            {types.map((t) => (
              <span
                key={t.kind}
                className={`ai-type ai-type-${t.kind}`}
                style={{ width: `${t.share}%` }}
                title={`${t.label} ${t.share}%`}
              />
            ))}
          </div>
          <ul className="ai-type-key">
            {types.map((t) => (
              <li key={t.kind}>
                <span className={`ai-swatch ai-type-${t.kind}`} />
                {t.label}
                <b>{t.share}%</b>
              </li>
            ))}
          </ul>

        </div>
      )}
      <RankTable
        rows={rows}
        heading="Domain"
        valueLabel="Citation share"
        emptyNote="Citations are recorded per reading. Run a scan to populate this window."
      />
      <p className="ai-foot-note">
        Page-level citations need a search-grounded engine that returns source
        URLs. Until then this is domain level.
      </p>
    </div>
  );
}

async function Sentiment({ brand, data, w }: { brand: Brand; data: VisibilityResult; w: W }) {
  const series = await visibilitySeries(brand.id, w.start, w.end);
  const s = data.sentiment;
  return (
    <Block
      title="How assistants describe you"
      note={s ? `${s.positivePct}% positive · ${s.negativePct}% negative` : "No sentiment on the latest reading"}
      value={s ? s.positivePct : null}
      delta={null}
      suffix="%"
      chart={<SeriesChart points={series} label="Visibility over time" />}
      side={
        s ? (
          <div className="ai-themes">
            <p className="ai-side-k">Working for you</p>
            {(s.positiveThemes ?? []).slice(0, 3).map((t, i) => (
              <p className="ai-theme" key={`p${i}`}>{t.theme}</p>
            ))}
            <p className="ai-side-k">Holding you back</p>
            {(s.negativeThemes ?? []).slice(0, 3).map((t, i) => (
              <p className="ai-theme" key={`n${i}`}>{t.theme}</p>
            ))}
          </div>
        ) : (
          <p className="ai-empty">No themes on the latest reading.</p>
        )
      }
    />
  );
}

/** Big number, chart, and a ranked table beside it. */
function Block({
  title, note, value, delta, suffix, chart, side,
}: {
  title: string; note: string;
  value: number | null; delta: number | null; suffix: string;
  chart: React.ReactNode; side: React.ReactNode;
}) {
  return (
    <div className="ai-card">
      <div className="ai-card-head">
        <div>
          <h3 className="ai-h3">{title}</h3>
          <p className="ai-note">{note}</p>
        </div>
      </div>
      <div className="ai-split">
        <div className="ai-main">
          <p className="ai-big">
            {value === null ? "—" : Math.round(value * 10) / 10}
            {value === null ? "" : suffix}
            {delta !== null && (
              <span className={delta > 0 ? "ai-up" : delta < 0 ? "ai-down" : "ai-flat"}>
                {delta > 0 ? "+" : ""}
                {delta}
                {suffix}
              </span>
            )}
          </p>
          {chart}
        </div>
        <div className="ai-side">{side}</div>
      </div>
    </div>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="ai-card">
      <h3 className="ai-h3">{title}</h3>
      <p className="ai-note">{body}</p>
    </div>
  );
}
