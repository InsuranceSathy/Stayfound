import { derive, fmtShort, signed, type TemplateProps } from "@/components/report/shared";

/**
 * Slides — the presentation deck.
 *
 * 13.33 × 7.5in, the 16:9 canvas Keynote, Google Slides and PowerPoint all
 * default to, so the PDF fills a projector or a screen share instead of sitting
 * letterboxed inside it.
 *
 * Built in the Ledger discipline: no colour, no fills, no ornament. One face
 * for text, one for labels and figures, one rule weight, one left edge that
 * every slide aligns to. Emphasis comes from weight, size and position — so
 * the client's own bar is the black one and everything else is grey, which
 * needs no legend and survives a projector, a photocopy and a client's brand
 * guidelines.
 *
 * What it adds over the printed version: room. A slide is read from across a
 * table, so nothing here is set below 9pt, each slide argues exactly one thing,
 * and the figures are given shape as well as digits.
 */
export function SlidesTemplate({ brand, snapshot, history, site }: TemplateProps) {
  const d = derive({ brand, snapshot, history });
  const moves = d.moves.slice(0, 3);
  const maxShare = Math.max(...d.sortedCompetitors.map((c) => c.share), 1);
  const trend = [...history].reverse().slice(-8); // oldest → newest, as a chart reads
  const maxScore = Math.max(...trend.map((h) => h.score), 1);

  // Numbered once, here, so inserting a slide cannot leave the deck counting
  // 7, 8, 8, 9.
  let page = 0;
  const next = () => ++page;

  return (
    <article className="t t-slides">
      {/* ------------------------------------------------------------ title */}
      <section className="t-page sl sl-title">
        <header className="sl-title-top">
          <span>StayFound</span>
          <span>AI search visibility</span>
        </header>

        <div className="sl-title-mid">
          <h1 className="sl-title-h">{brand.name}</h1>
          <p className="sl-title-sub">
            {brand.category}
            {brand.market ? ` · ${brand.market}` : ""}
          </p>
        </div>

        <footer className="sl-title-foot">
          <div>
            <span className="sl-k">Visibility score</span>
            <span className="sl-title-v">
              {d.score} <em>/ 100</em>
            </span>
          </div>
          <div>
            <span className="sl-k">Reading</span>
            <span className="sl-title-v">{d.verdict.label}</span>
          </div>
          <div>
            <span className="sl-k">Position</span>
            <span className="sl-title-v">
              {d.place.rank ? `${d.place.rank} of ${d.place.total}` : "—"}
            </span>
          </div>
          <div>
            <span className="sl-k">Measured</span>
            <span className="sl-title-v">{d.measured}</span>
          </div>
        </footer>
      </section>

      {/* ---------------------------------------------------------- summary */}
      <Slide n={next()} brand={brand.name} part="Summary" title="The headline">
        <p className="sl-lead">{d.data.summary}</p>
        <dl className="sl-kpis">
          <Kpi k="Visibility score" v={String(d.score)} s={d.verdict.label} lead />
          <Kpi
            k="Position"
            v={d.place.rank ? `${d.place.rank}` : "—"}
            s={`of ${d.place.total} brands`}
          />
          <Kpi
            k="Share of voice"
            v={`${Math.round(d.place.yourShare)}%`}
            s="of AI answers"
          />
          <Kpi
            k="Engines naming you"
            v={`${d.engines.mentioned}`}
            s={`of ${d.engines.total} assistants`}
          />
        </dl>
      </Slide>

      {/* ------------------------------------------------------------ score */}
      <Slide n={next()} brand={brand.name} part="Score" title="Where you stand today">
        <div className="sl-score-row">
          <div className="sl-score-block">
            <span className="sl-score">{d.score}</span>
            <span className="sl-k">out of 100</span>
          </div>
          <div className="sl-score-read">
            <p className="sl-verdict">{d.verdict.label}</p>
            <p className="sl-verdict-say">{d.verdict.meaning}</p>
            {d.delta !== null && d.since && (
              <p className="sl-verdict-move">
                <b>{signed(d.delta)} points</b> since {d.since}, across{" "}
                {history.length} readings.
              </p>
            )}
          </div>
        </div>

        {/* The bands named along the scale, because a score on its own tells a
            room nothing about whether it is a good one. */}
        <div className="sl-scale">
          <div className="sl-scale-track">
            {["Invisible", "Barely visible", "Emerging", "Competitive", "Leading"].map(
              (band) => (
                <span
                  key={band}
                  className={`sl-band ${d.verdict.label === band ? "on" : ""}`}
                >
                  {band}
                </span>
              ),
            )}
            <span className="sl-pin" style={{ left: `${d.score}%` }} />
          </div>
          <div className="sl-scale-axis">
            {[0, 20, 40, 60, 80, 100].map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>
      </Slide>

      {/* ---------------------------------------------------------- engines */}
      <Slide
        n={next()}
        brand={brand.name}
        part="Engines"
        title="Not every assistant sees you the same"
      >
        <div className="sl-bars">
          {d.engineRows.map((e) => (
            <div className="sl-bar" key={e.name}>
              <span className="sl-bar-name">{e.name}</span>
              <span className="sl-bar-track">
                <span
                  className={`sl-bar-fill ${e.mentioned ? "" : "absent"}`}
                  style={{ width: `${Math.max(1.5, e.score)}%` }}
                />
              </span>
              <span className="sl-bar-val">{Math.round(e.score)}</span>
              <span className="sl-bar-tag">
                {e.mentioned ? "names you" : "never names you"}
              </span>
            </div>
          ))}
        </div>
        {d.engines.worst && !d.engines.worst.mentioned && (
          <p className="sl-take">
            <b>{d.engines.worst.name}</b> never names {brand.name} — the largest
            single pocket of missing demand on this slide.
          </p>
        )}
      </Slide>

      {/* ------------------------------------------------------ competitors */}
      <Slide
        n={next()}
        brand={brand.name}
        part="Category"
        title="Who wins the answers"
      >
        <div className="sl-bars">
          {d.sortedCompetitors.map((c, i) => (
            <div className={`sl-bar ${c === d.you ? "you" : ""}`} key={`${c.name}-${i}`}>
              <span className="sl-bar-name">
                <span className="sl-rank">{i + 1}</span>
                {c.name}
              </span>
              <span className="sl-bar-track">
                <span
                  className="sl-bar-fill"
                  style={{ width: `${Math.max(1.5, (c.share / maxShare) * 100)}%` }}
                />
              </span>
              <span className="sl-bar-val">{Math.round(c.share)}%</span>
              <span className="sl-bar-tag">{c === d.you ? "this brand" : ""}</span>
            </div>
          ))}
        </div>
        {d.place.rank && d.place.leader && d.place.rank > 1 && (
          <p className="sl-take">
            <b>{d.place.leader.name}</b> holds {Math.round(d.place.leader.share)}%,{" "}
            {d.place.leaderMultiple}× this brand&apos;s share. Closing{" "}
            <b>{d.place.gapPoints} points</b> takes the top slot.
          </p>
        )}
      </Slide>

      {/* --------------------------------------------------------- sentiment */}
      {d.sentiment && (
        <Slide
          n={next()}
          brand={brand.name}
          part="Perception"
          title="What assistants say about you"
        >
          <div className="sl-split">
            <div>
              <p className="sl-col-k">
                Working for you <b>{d.sentiment.positivePct}%</b>
              </p>
              {(d.sentiment.positiveThemes ?? []).slice(0, 3).map((t, i) => (
                <div className="sl-theme" key={i}>
                  <p className="sl-theme-t">{t.theme}</p>
                  <p className="sl-theme-q">{t.quote}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="sl-col-k">
                Holding you back <b>{d.sentiment.negativePct}%</b>
              </p>
              {(d.sentiment.negativeThemes ?? []).slice(0, 3).map((t, i) => (
                <div className="sl-theme" key={i}>
                  <p className="sl-theme-t">{t.theme}</p>
                  <p className="sl-theme-q">{t.quote}</p>
                </div>
              ))}
            </div>
          </div>
        </Slide>
      )}

      {/* --------------------------------------------------------- citations */}
      {d.sources.length > 0 && (
        <Slide
          n={next()}
          brand={brand.name}
          part="Sources"
          title="Where the answers are sourced"
        >
          <p className="sl-lede">
            {d.cites.yours} of {d.cites.total} sources assistants lean on are
            yours.
            {d.cites.missing > 0 &&
              ` The other ${d.cites.missing} shape the answer without you.`}
          </p>
          <table className="sl-table">
            <thead>
              <tr>
                <th>Source</th>
                <th>Yours</th>
                <th>Why it is cited</th>
              </tr>
            </thead>
            <tbody>
              {d.sources.slice(0, 6).map((s, i) => (
                <tr key={`${s.domain}-${i}`} className={s.isYou ? "you" : ""}>
                  <td className="mono">{s.domain}</td>
                  <td>{s.isYou ? "Yes" : "No"}</td>
                  <td>{s.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Slide>
      )}

      {/* ------------------------------------------------------------- trend */}
      {trend.length > 1 && (
        <Slide
          n={next()}
          brand={brand.name}
          part="Record"
          title="The score over time"
        >
          <div className="sl-trend">
            {trend.map((h, i) => {
              const prev = trend[i - 1];
              const delta = prev ? Math.round(h.score - prev.score) : null;
              return (
                <div className="sl-trend-col" key={h.id}>
                  <span className="sl-trend-slot">
                    <span
                      className={`sl-trend-bar ${i === trend.length - 1 ? "on" : ""}`}
                      style={{ height: `${(h.score / maxScore) * 100}%` }}
                    />
                  </span>
                  <span className="sl-trend-v">{Math.round(h.score)}</span>
                  <span className="sl-trend-delta">
                    {delta === null ? "first" : signed(delta)}
                  </span>
                  <span className="sl-trend-d">{fmtShort(h.created_at)}</span>
                </div>
              );
            })}
          </div>
        </Slide>
      )}

      {/* ----------------------------------------------------------- divider */}
      {moves.length > 0 && (
        <section className="t-page sl sl-divider">
          <div>
            <p className="sl-divider-k">Part two</p>
            <h2 className="sl-divider-h">What to do about it</h2>
            <p className="sl-divider-s">
              {moves.length} moves, ranked by impact on the score.
            </p>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------- moves */}
      {moves.map(({ move, why, list }, i) => (
        <Slide
          key={i}
          n={next()}
          brand={brand.name}
          part="Actions"
          eyebrow={`Move ${i + 1} of ${moves.length} · ${move.impact} impact`}
          title={move.title}
        >
          <p className="sl-move-why">{why}</p>
          {list.length > 0 && (
            <ol className="sl-steps">
              {list.slice(0, 4).map((s, k) => (
                <li key={k}>
                  <span className="sl-step-n">{String(k + 1).padStart(2, "0")}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          )}
        </Slide>
      ))}

      {/* ----------------------------------------------------------- content */}
      {d.ideas.length > 0 && (
        <Slide
          n={next()}
          brand={brand.name}
          part="Content"
          title="Content that earns citations"
        >
          <table className="sl-table sl-ideas">
            <thead>
              <tr>
                <th>Format</th>
                <th>Publish this</th>
                <th>Why it works</th>
              </tr>
            </thead>
            <tbody>
              {d.ideas.slice(0, 5).map((idea, i) => (
                <tr key={i}>
                  <td className="sl-idea-k">{idea.type}</td>
                  <td className="sl-idea-t">{idea.title}</td>
                  <td>{idea.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Slide>
      )}

      {/* -------------------------------------------------------- next steps */}
      <Slide
        n={next()}
        brand={brand.name}
        part="Next"
        title="What happens next"
      >
        <ol className="sl-next">
          <li>
            <span className="sl-next-n">01</span>
            <div>
              <p className="sl-next-t">Ship the high-impact moves</p>
              <p className="sl-next-s">
                {moves.filter((m) => m.move.impact === "high").length || moves.length}{" "}
                of the {moves.length} on the previous slides are marked high
                impact. Those are the ones that move the score.
              </p>
            </div>
          </li>
          <li>
            <span className="sl-next-n">02</span>
            <div>
              <p className="sl-next-t">Re-measure in 30 days</p>
              <p className="sl-next-s">
                Assistants update their answers over weeks. A month is long
                enough for a change to show, short enough to course-correct.
              </p>
            </div>
          </li>
          <li>
            <span className="sl-next-n">03</span>
            <div>
              <p className="sl-next-t">Measure against this baseline</p>
              <p className="sl-next-s">
                Today&apos;s reading — {d.score} out of 100,{" "}
                {d.place.rank ? `${d.place.rank} of ${d.place.total}` : "unranked"} —
                is the number every future report is compared against.
              </p>
            </div>
          </li>
        </ol>
      </Slide>

      {/* --------------------------------------------------------------- end */}
      <section className="t-page sl sl-end">
        <div className="sl-end-mid">
          <p className="sl-end-k">Measured by</p>
          <p className="sl-end-mark">StayFound</p>
          <p className="sl-end-body">
            Live answers from ChatGPT, Perplexity, Gemini, Claude and Grok,
            measured {d.measured} for {brand.name}. Scores move as those answers
            move.
          </p>
        </div>
        {/* The only place the platform's own address appears in the deck. */}
        <footer className="sl-end-foot">
          <span>{site}</span>
        </footer>
      </section>
    </article>
  );
}

/** One slide: hairline head, the argument, a number in the corner. */
function Slide({
  n,
  brand,
  part,
  title,
  eyebrow,
  children,
}: {
  n: number;
  brand: string;
  part: string;
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="t-page sl">
      <header className="sl-run" aria-hidden="true">
        <span>{brand}</span>
        <span>{part}</span>
      </header>
      <div className="sl-head">
        {eyebrow && <p className="sl-eyebrow">{eyebrow}</p>}
        <h2 className="sl-h2">{title}</h2>
      </div>
      <div className="sl-body">{children}</div>
      <footer className="sl-foot" aria-hidden="true">
        <span className="sl-n">{String(n).padStart(2, "0")}</span>
      </footer>
    </section>
  );
}

function Kpi({
  k,
  v,
  s,
  lead,
}: {
  k: string;
  v: string;
  s: string;
  lead?: boolean;
}) {
  return (
    <div className={`sl-kpi ${lead ? "lead" : ""}`}>
      <dt>{k}</dt>
      <dd>
        <span className="sl-kpi-v">{v}</span>
        <span className="sl-kpi-s">{s}</span>
      </dd>
    </div>
  );
}
