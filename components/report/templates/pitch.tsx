import { derive, signed, type TemplateProps } from "@/components/report/shared";

/**
 * Pitch — the client-facing presentation.
 *
 * 16:9, and unlike the other templates this one is built for a room rather than
 * a reader: full-bleed colour on the cover and the section breaks, one idea per
 * slide, type at sizes that carry to the back, and a chart as the hero of the
 * slide instead of a table underneath a paragraph.
 *
 * Restraint is the wrong instinct here. A document is scanned by one person at
 * a desk; a deck is shown to a room that has to grasp each slide in a couple of
 * seconds. So the score becomes a dial, share of voice becomes bars thick
 * enough to read from across a table, and everything that would be a sentence
 * in the printed report becomes a heading here.
 */

/** The score as a half-dial. Drawn as SVG so it stays sharp at any print size
 *  and needs no chart library in the bundle. */
function Gauge({ score }: { score: number }) {
  const R = 100;
  const LEN = Math.PI * R; // length of a semicircular arc
  const filled = (Math.max(0, Math.min(100, score)) / 100) * LEN;
  return (
    <svg className="pitch-gauge" viewBox="0 0 240 152" role="img"
      aria-label={`Visibility score ${score} out of 100`}>
      <path d="M20 120 A100 100 0 0 1 220 120" className="pitch-gauge-track" />
      <path
        d="M20 120 A100 100 0 0 1 220 120"
        className="pitch-gauge-fill"
        strokeDasharray={`${filled} ${LEN}`}
      />
      <text x="120" y="112" className="pitch-gauge-num" textAnchor="middle">
        {score}
      </text>
      <text x="120" y="140" className="pitch-gauge-of" textAnchor="middle">
        OUT OF 100
      </text>
    </svg>
  );
}

export function PitchTemplate({ brand, snapshot, history, site }: TemplateProps) {
  const d = derive({ brand, snapshot, history });
  const moves = d.moves.slice(0, 3);
  const maxShare = Math.max(...d.sortedCompetitors.map((c) => c.share), 1);

  let n = 0;
  const next = () => ++n;

  return (
    <article className="t t-pitch">
      {/* ---------------------------------------------------------- cover */}
      <section className="t-page pitch-cover">
        <header className="pitch-cover-top">
          <span>StayFound</span>
          <span>AI Search Visibility</span>
        </header>
        <div className="pitch-cover-mid">
          <p className="pitch-cover-k">Prepared for</p>
          <h1 className="pitch-cover-h">{brand.name}</h1>
          <p className="pitch-cover-sub">
            {brand.category}
            {brand.market ? ` · ${brand.market}` : ""}
          </p>
        </div>
        <footer className="pitch-cover-foot">
          <span>{d.measured}</span>
        </footer>
      </section>

      {/* ---------------------------------------------------------- score */}
      <Slide n={next()} brand={brand.name} kicker="The headline number">
        <div className="pitch-score">
          <Gauge score={d.score} />
          <div className="pitch-score-say">
            <p className="pitch-verdict">{d.verdict.label}</p>
            <p className="pitch-verdict-b">{d.verdict.meaning}</p>
            {d.delta !== null && d.since && (
              <p className="pitch-chip">
                {signed(d.delta)} points since {d.since}
              </p>
            )}
          </div>
        </div>
      </Slide>

      {/* --------------------------------------------------------- at a glance */}
      <Slide n={next()} brand={brand.name} kicker="Where you stand">
        <h2 className="pitch-h2">{d.data.summary}</h2>
        <div className="pitch-tiles">
          <Tile v={d.place.rank ? `#${d.place.rank}` : "—"} k={`of ${d.place.total} brands`} big />
          <Tile v={`${Math.round(d.place.yourShare)}%`} k="of AI answers name you" />
          <Tile v={`${d.engines.mentioned}/${d.engines.total}`} k="assistants name you" />
          <Tile v={`${d.cites.yours}/${d.cites.total}`} k="cited sources are yours" />
        </div>
      </Slide>

      {/* ----------------------------------------------------- competitors */}
      <Slide n={next()} brand={brand.name} kicker="Who wins the answers">
        <div className="pitch-bars">
          {d.sortedCompetitors.map((c, i) => (
            <div className={`pitch-bar ${c === d.you ? "you" : ""}`} key={`${c.name}-${i}`}>
              <span className="pitch-bar-name">{c.name}</span>
              <span className="pitch-bar-track">
                <span
                  className="pitch-bar-fill"
                  style={{ width: `${Math.max(2, (c.share / maxShare) * 100)}%` }}
                />
                <span className="pitch-bar-val">{Math.round(c.share)}%</span>
              </span>
            </div>
          ))}
        </div>
        {d.place.leader && d.place.rank && d.place.rank > 1 && (
          <p className="pitch-note">
            {d.place.leader.name} is named {d.place.leaderMultiple}× more often than you.
            Closing {d.place.gapPoints} points takes the top spot.
          </p>
        )}
      </Slide>

      {/* --------------------------------------------------------- engines */}
      <Slide n={next()} brand={brand.name} kicker="Assistant by assistant">
        <div className="pitch-engines">
          {d.engineRows.map((e) => (
            <div className={`pitch-eng ${e.mentioned ? "" : "silent"}`} key={e.name}>
              <span className="pitch-eng-v">{Math.round(e.score)}</span>
              <span className="pitch-eng-n">{e.name}</span>
              <span className="pitch-eng-s">
                {e.mentioned ? "names you" : "never names you"}
              </span>
            </div>
          ))}
        </div>
      </Slide>

      {/* ------------------------------------------------------- sentiment */}
      {d.sentiment && (
        <Slide n={next()} brand={brand.name} kicker="What assistants say about you">
          <div className="pitch-two">
            <div className="pitch-side good">
              <p className="pitch-side-k">
                Helps you<b>{d.sentiment.positivePct}%</b>
              </p>
              {(d.sentiment.positiveThemes ?? []).slice(0, 3).map((t, i) => (
                <p className="pitch-theme" key={i}>{t.theme}</p>
              ))}
            </div>
            <div className="pitch-side bad">
              <p className="pitch-side-k">
                Hurts you<b>{d.sentiment.negativePct}%</b>
              </p>
              {(d.sentiment.negativeThemes ?? []).slice(0, 3).map((t, i) => (
                <p className="pitch-theme" key={i}>{t.theme}</p>
              ))}
            </div>
          </div>
          {d.sentiment.negativeThemes?.[0] && (
            <p className="pitch-quote">“{d.sentiment.negativeThemes[0].quote}”</p>
          )}
        </Slide>
      )}

      {/* --------------------------------------------------------- sources */}
      {d.sources.length > 0 && (
        <Slide n={next()} brand={brand.name} kicker="Where AI looks for answers">
          <ul className="pitch-sources">
            {d.sources.slice(0, 6).map((s, i) => (
              <li key={`${s.domain}-${i}`} className={s.isYou ? "you" : ""}>
                <span className="pitch-src-d">{s.domain}</span>
                <span className="pitch-src-tag">{s.isYou ? "Yours" : "Not yours"}</span>
              </li>
            ))}
          </ul>
          <p className="pitch-note">
            {d.cites.missing > 0
              ? `${d.cites.missing} of the ${d.cites.total} pages shaping the answer are not yours.`
              : `All ${d.cites.total} cited pages are yours.`}
          </p>
        </Slide>
      )}

      {/* --------------------------------------------------------- divider */}
      {moves.length > 0 && (
        <section className="t-page pitch-divider">
          <p className="pitch-div-k">Part two</p>
          <h2 className="pitch-div-h">What to do about it</h2>
          <p className="pitch-div-s">{moves.length} moves, biggest impact first</p>
        </section>
      )}

      {/* ----------------------------------------------------------- moves */}
      {moves.map(({ move, why, list }, i) => (
        <Slide
          key={i}
          n={next()}
          brand={brand.name}
          kicker={`Move ${i + 1} of ${moves.length}`}
          tag={`${move.impact} impact`}
        >
          <h2 className="pitch-move-h">{move.title}</h2>
          <p className="pitch-move-b">{why}</p>
          {list.length > 0 && (
            <ol className="pitch-steps">
              {list.slice(0, 3).map((s, k) => (
                <li key={k}>
                  <span>{k + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          )}
        </Slide>
      ))}

      {/* --------------------------------------------------------- content */}
      {d.ideas.length > 0 && (
        <Slide n={next()} brand={brand.name} kicker="Content that earns citations">
          <ol className="pitch-ideas">
            {d.ideas.slice(0, 4).map((idea, i) => (
              <li key={i}>
                <span className="pitch-idea-n">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <p className="pitch-idea-t">{idea.title}</p>
                  <p className="pitch-idea-k">{idea.type}</p>
                </div>
              </li>
            ))}
          </ol>
        </Slide>
      )}

      {/* ------------------------------------------------------ next steps */}
      <Slide n={next()} brand={brand.name} kicker="What happens next">
        <ol className="pitch-next">
          <li>
            <span>01</span>
            <div>
              <p className="pitch-next-t">Ship the high-impact moves</p>
              <p className="pitch-next-b">The ones marked high impact move the score.</p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <p className="pitch-next-t">Re-measure in 30 days</p>
              <p className="pitch-next-b">
                Assistants update over weeks. A month shows a change.
              </p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <p className="pitch-next-t">Compare against today</p>
              <p className="pitch-next-b">
                {d.score} out of 100 is the baseline every future report is measured against.
              </p>
            </div>
          </li>
        </ol>
      </Slide>

      {/* ------------------------------------------------------------- end */}
      <section className="t-page pitch-end">
        <div className="pitch-end-mid">
          <p className="pitch-end-k">Measured by</p>
          <p className="pitch-end-mark">StayFound</p>
          <p className="pitch-end-b">
            Live answers from ChatGPT, Perplexity, Gemini, Claude and Grok,
            measured {d.measured} for {brand.name}.
          </p>
        </div>
        {/* The only place the platform's own address appears. */}
        <footer className="pitch-end-foot">
          <span>{site}</span>
        </footer>
      </section>
    </article>
  );
}

function Slide({
  n,
  brand,
  kicker,
  tag,
  children,
}: {
  n: number;
  brand: string;
  kicker: string;
  tag?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="t-page pitch-slide">
      <header className="pitch-run">
        <span className="pitch-kicker">{kicker}</span>
        {tag && <span className="pitch-tag">{tag}</span>}
      </header>
      <div className="pitch-body">{children}</div>
      <footer className="pitch-foot" aria-hidden="true">
        <span>{brand}</span>
        <span>{String(n).padStart(2, "0")}</span>
      </footer>
    </section>
  );
}

function Tile({ v, k, big }: { v: string; k: string; big?: boolean }) {
  return (
    <div className={`pitch-tile ${big ? "lead" : ""}`}>
      <span className="pitch-tile-v">{v}</span>
      <span className="pitch-tile-k">{k}</span>
    </div>
  );
}
