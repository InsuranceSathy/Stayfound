import type { VisibilityResult } from "@/lib/visibility";
import type { Brand, Snapshot } from "@/lib/queries";
import {
  citationStanding,
  engineStanding,
  findYou,
  rankedActions,
  standing,
  verdictFor,
} from "@/lib/report-derive";
import { takeaway, steps } from "@/lib/action-format";
import { snippetsFor } from "@/lib/snippets";
import {
  CellBar,
  CoverageCells,
  ScoreMeter,
  SentimentBar,
  TrendChart,
} from "./report-charts";

/**
 * The report as a slide deck.
 *
 * Landscape 16:9 pages at presentation proportions (10in × 5.625in — the
 * PowerPoint default), because this artefact gets projected in a meeting or
 * dropped into a deck, not read like a memo. That drives every decision:
 * one idea per slide, the chart on the right doing the talking, a short
 * headline and one big stat on the left saying what the chart means, and a
 * running head so a slide screenshotted out of context still says what it is
 * and when it was measured.
 *
 * It is real HTML rather than a generated PDF so it inherits the product's
 * own type and palette, and the browser's print engine does the pagination —
 * print to PDF and each slide lands on its own landscape page.
 */

function Slide({
  children,
  brand,
  measured,
  n,
  of,
  eyebrow,
  wide,
}: {
  children: React.ReactNode;
  brand: string;
  measured: string;
  n: number;
  of: number;
  eyebrow: string;
  wide?: boolean;
}) {
  return (
    <section className="rp-page">
      <header className="rp-head" aria-hidden="true">
        <span>{brand}</span>
        <span>{eyebrow}</span>
      </header>
      <div className={wide ? "rp-body" : "rp-cols"}>{children}</div>
      <footer className="rp-foot" aria-hidden="true">
        <span>Measured {measured}</span>
        {/* "Slide n of N": a section with a lot in it can spill taller than
            16:9 on screen, but each <section> is still one slide. */}
        <span>
          {n} / {of}
        </span>
      </footer>
    </section>
  );
}

/* The left column of a standard slide: headline, one-sentence reading, and
   the big stats that say what the chart on the right means. */
function Lead({
  title,
  lede,
  stats,
}: {
  title: string;
  lede?: React.ReactNode;
  stats?: { k: string; v: React.ReactNode }[];
}) {
  return (
    <div className="rp-lead">
      <h2 className="rp-h2">{title}</h2>
      {lede && <p className="rp-lede">{lede}</p>}
      {stats && stats.length > 0 && (
        <dl className="rp-stats">
          {stats.map((s, i) => (
            <div key={i}>
              <dd>{s.v}</dd>
              <dt>{s.k}</dt>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

export function ReportDocument({
  brand,
  snapshot,
  history,
}: {
  brand: Brand;
  snapshot: Snapshot;
  history: Snapshot[];
}) {
  const data: VisibilityResult = snapshot.data;
  const verdict = verdictFor(snapshot.score);
  const place = standing(data.competitors, brand.name);
  const you = findYou(data.competitors, brand.name);
  const engines = engineStanding(data.engines);
  const cites = citationStanding(data.citedSources);
  const moves = rankedActions(data.actions).map((m) => ({
    move: m,
    list: steps(m.detail),
    snippets: snippetsFor(m, { name: brand.name, category: brand.category }),
  }));
  const snippets = moves.flatMap(({ move, snippets }) =>
    snippets.map((s) => ({ move: move.title, ...s })),
  );
  const ideas = data.contentIdeas ?? [];
  const sources = data.citedSources ?? [];
  const sorted = [...data.competitors].sort((a, b) => b.share - a.share);
  const trend = [...history]
    .slice(0, 12)
    .reverse()
    .map((h) => ({
      date: new Date(h.created_at).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
      }),
      score: h.score,
    }));
  const trendDelta =
    trend.length > 1
      ? Math.round(trend[trend.length - 1].score - trend[0].score)
      : 0;

  const measured = new Date(snapshot.created_at).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Slides are counted rather than hardcoded so a scan without sentiment or
  // content ideas doesn't say "5 / 9" and then stop at 5.
  const slides = [
    "cover",
    "standing",
    trend.length > 1 ? "trend" : null,
    "rivals",
    data.sentiment ? "sentiment" : null,
    sources.length ? "sources" : null,
    moves.length ? "moves" : null,
    snippets.length ? "snippets" : null,
    ideas.length ? "ideas" : null,
  ].filter(Boolean) as string[];
  const of = slides.length;
  const at = (k: string) => slides.indexOf(k) + 1;
  const common = { brand: brand.name, measured, of };

  return (
    <article className="rp">
      {/* ---------------------------------------------------------- cover */}
      <section className="rp-page rp-cover">
        <div className="rp-cover-grid">
          <div className="rp-cover-id">
            <p className="rp-k">AI search visibility report</p>
            <h1 className="rp-title">{brand.name}</h1>
            <p className="rp-sub">
              {brand.category}
              {brand.market ? ` · ${brand.market}` : ""}
            </p>
            <p className="rp-cover-read">{verdict.meaning}</p>
          </div>
          <div className="rp-cover-num">
            <div className="rp-cover-score">
              <span className="rp-score">{Math.round(snapshot.score)}</span>
              <span className="rp-score-of">out of 100</span>
            </div>
            <span className="rp-verdict">{verdict.label}</span>
            <ScoreMeter value={snapshot.score} />
            <dl className="rp-facts">
              <div>
                <dt>Measured</dt>
                <dd>{measured}</dd>
              </div>
              <div>
                <dt>Naming you</dt>
                <dd>
                  {engines.mentioned} of {engines.total} assistants
                </dd>
              </div>
            </dl>
          </div>
        </div>
        <footer className="rp-cover-foot">
          <span className="rp-mark">StayFound</span>
          <span>{data.engines.map((e) => e.name).join(" · ")}</span>
          <span>stayfound.tech</span>
        </footer>
      </section>

      {/* ------------------------------------------------------- standing */}
      <Slide {...common} n={at("standing")} eyebrow="Where you stand">
        <Lead
          title="Where you stand"
          lede={data.summary}
          stats={[
            {
              k: "assistants name you",
              v: `${engines.mentioned} of ${engines.total}`,
            },
            engines.best
              ? { k: `best · ${engines.best.name}`, v: Math.round(engines.best.score) }
              : null,
          ].filter(Boolean) as { k: string; v: React.ReactNode }[]}
        />
        <div className="rp-fig">
          <h3 className="rp-h3">Engine by engine</h3>
          <table className="rp-table">
            <thead>
              <tr>
                <th>Assistant</th>
                <th className="bar">Score of 100</th>
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
                    <td className="bar">
                      <CellBar value={e.score} max={100} highlight={e.mentioned} />
                    </td>
                    <td className="num">{Math.round(e.score)}</td>
                    <td>{e.mentioned ? "Yes" : "No"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Slide>

      {/* ---------------------------------------------------------- trend */}
      {trend.length > 1 && (
        <Slide {...common} n={at("trend")} eyebrow="Readings over time">
          <Lead
            title="Readings over time"
            lede={`${history.length} readings on record. Assistants change their answers over weeks, not days — the direction matters more than any single reading.`}
            stats={[
              {
                k: `since ${trend[0].date}`,
                v: trendDelta > 0 ? `+${trendDelta}` : `${trendDelta}`,
              },
              { k: "latest score", v: Math.round(snapshot.score) },
            ]}
          />
          <div className="rp-fig">
            <TrendChart points={trend} />
            <table className="rp-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th className="num">Score</th>
                  <th className="num">Change</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 5).map((h, i) => {
                  const prev = history[i + 1];
                  const d = prev ? h.score - prev.score : null;
                  return (
                    <tr key={h.id}>
                      <td>
                        {new Date(h.created_at).toLocaleDateString(undefined, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="num">{Math.round(h.score)}</td>
                      <td className="num">
                        {d === null ? "first" : d > 0 ? `+${d}` : d}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Slide>
      )}

      {/* --------------------------------------------------------- rivals */}
      <Slide {...common} n={at("rivals")} eyebrow="Who wins the answers">
        <Lead
          title="Who wins the answers"
          lede={
            place.rank && place.leader ? (
              place.rank === 1 ? (
                <>
                  {brand.name} leads the category with{" "}
                  {Math.round(place.yourShare)}% share of voice.
                </>
              ) : (
                <>
                  {place.leader.name} owns the default answer.
                  {place.leaderMultiple
                    ? ` Its share of voice is ${place.leaderMultiple}× yours.`
                    : ""}
                </>
              )
            ) : undefined
          }
          stats={[
            place.rank
              ? { k: `rank of ${place.total} brands`, v: `#${place.rank}` }
              : null,
            { k: "your share of voice", v: `${Math.round(place.yourShare)}%` },
          ].filter(Boolean) as { k: string; v: React.ReactNode }[]}
        />
        <div className="rp-fig">
          <table className="rp-table">
            <thead>
              <tr>
                <th className="num">#</th>
                <th>Brand</th>
                <th className="bar">Share of voice</th>
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
                    <td className="num">{i + 1}</td>
                    <td>
                      {c.name}
                      {isYou && <span className="rp-you">you</span>}
                    </td>
                    <td className="bar">
                      <CellBar
                        value={c.share}
                        max={sorted[0]?.share ?? 100}
                        highlight={isYou}
                      />
                    </td>
                    <td className="num">{Math.round(c.share)}%</td>
                    <td className="num">
                      {isYou ? "—" : gap > 0 ? `+${gap} pts` : `${gap} pts`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Slide>

      {/* ------------------------------------------------------ sentiment */}
      {data.sentiment && (
        <Slide {...common} n={at("sentiment")} eyebrow="How assistants describe you">
          <Lead
            title="How the assistants describe you"
            stats={[
              { k: "overall", v: data.sentiment.label },
              { k: "positive", v: `${data.sentiment.positivePct}%` },
            ]}
          />
          <div className="rp-fig">
            <SentimentBar
              positive={data.sentiment.positivePct}
              negative={data.sentiment.negativePct}
            />
            <div className="rp-two">
              <div>
                <p className="rp-k">What helps</p>
                <ul className="rp-list">
                  {(data.sentiment.positiveThemes ?? []).map((t, i) => (
                    <li key={i}>
                      <b>{t.theme}</b>
                      <q>{t.quote}</q>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="rp-k">What holds you back</p>
                <ul className="rp-list">
                  {(data.sentiment.negativeThemes ?? []).map((t, i) => (
                    <li key={i}>
                      <b>{t.theme}</b>
                      <q>{t.quote}</q>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Slide>
      )}

      {/* -------------------------------------------------------- sources */}
      {sources.length > 0 && (
        <Slide {...common} n={at("sources")} eyebrow="Where AI gets its answers">
          <Lead
            title="Where AI gets its answers"
            lede={
              cites.missing > 0
                ? `${cites.missing} of the pages shaping the category's answers don't mention ${brand.name}. Getting listed on them is the shortest path to more citations.`
                : `${brand.name} appears on every source assistants lean on for this category.`
            }
            stats={[{ k: "cited sources carry you", v: `${cites.yours} of ${cites.total}` }]}
          />
          <div className="rp-fig">
            <CoverageCells yours={cites.yours} total={cites.total} />
            <table className="rp-table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>On it</th>
                  <th>Why assistants cite it</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s, i) => (
                  <tr key={`${s.domain}-${i}`} className={s.isYou ? "you" : ""}>
                    <td className="mono">{s.domain}</td>
                    <td>{s.isYou ? "Yes" : "No"}</td>
                    <td>{s.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Slide>
      )}

      {/* ---------------------------------------------------------- moves */}
      {moves.length > 0 && (
        <Slide {...common} n={at("moves")} eyebrow="What to do" wide>
          <h2 className="rp-h2">What to do</h2>
          <p className="rp-lede">Ranked by impact, highest first.</p>
          <ol className="rp-moves">
            {moves.map(({ move, list }, i) => (
              <li key={i} className="rp-move">
                <div className="rp-move-head">
                  <span className="rp-move-n">{i + 1}</span>
                  <h3 className="rp-h3">{move.title}</h3>
                  <span className={`rp-impact ${move.impact}`}>
                    {move.impact}
                  </span>
                </div>
                <p className="rp-why">{takeaway(move.detail)}</p>
                {list.length > 0 && (
                  <ul className="rp-steps">
                    {list.map((s, k) => (
                      <li key={k}>{s}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        </Slide>
      )}

      {/* ------------------------------------------------------- snippets */}
      {snippets.length > 0 && (
        <Slide {...common} n={at("snippets")} eyebrow="Paste-ready blocks" wide>
          <h2 className="rp-h2">Paste-ready blocks</h2>
          <p className="rp-lede">
            Where a move needs schema, crawler access or a listing, the block
            is written out ready to paste.
          </p>
          <div className="rp-snippets">
            {snippets.map((s, k) => (
              <figure className="rp-code" key={k}>
                <figcaption>
                  {s.move} — {s.label}
                </figcaption>
                <pre>
                  <code>{s.code}</code>
                </pre>
              </figure>
            ))}
          </div>
        </Slide>
      )}

      {/* ---------------------------------------------------------- ideas */}
      {ideas.length > 0 && (
        <Slide {...common} n={at("ideas")} eyebrow="Content that earns citations" wide>
          <h2 className="rp-h2">Content that earns citations</h2>
          <p className="rp-lede">
            The formats assistants quote most in this category, with the angle
            that makes each one worth citing.
          </p>
          <ol className="rp-ideas">
            {ideas.map((idea, i) => (
              <li key={i}>
                <p className="rp-k">{idea.type}</p>
                <h3 className="rp-h3">{idea.title}</h3>
                <p className="rp-why">{idea.description}</p>
              </li>
            ))}
          </ol>
        </Slide>
      )}
    </article>
  );
}
