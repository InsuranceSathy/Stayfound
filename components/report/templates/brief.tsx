import {
  derive,
  fmtShort,
  paginateMoves,
  snippetPages,
  signed,
  type TemplateProps,
} from "@/components/report/shared";

/**
 * Brief — the analyst note.
 *
 * Two columns, hairline rules, small type, everything on the fewest pages that
 * still reads. The reference is an equity research note: whoever opens this
 * wants the whole picture in front of them at once, not one idea per spread.
 * Condensed Archivo for heads, Plex Mono for anything that is a label or a
 * number, and a single forest accent used only where something is yours.
 */
export function BriefTemplate({ brand, snapshot, history, site }: TemplateProps) {
  const d = derive({ brand, snapshot, history });
  const movePages = paginateMoves(d.moves);
  const codePages = snippetPages(d.moves);

  return (
    <article className="t t-brief">
      {/* ---------------------------------------------------------- 1. cover */}
      <section className="t-page brief-cover">
        <header className="brief-masthead">
          <span className="brief-wordmark">StayFound</span>
          <span>AI Search Visibility · Analyst Brief</span>
        </header>

        <div className="brief-hero">
          <p className="brief-eyebrow">Subject</p>
          <h1 className="brief-title">{brand.name}</h1>
          <p className="brief-sub">
            {brand.category}
            {brand.market ? ` · ${brand.market}` : ""}
          </p>
        </div>

        <div className="brief-readout">
          <div className="brief-big">
            <span className="brief-score">{d.score}</span>
            <span className="brief-outof">/100</span>
          </div>
          <div className="brief-readout-side">
            <p className="brief-verdict">{d.verdict.label}</p>
            <p className="brief-meaning">{d.verdict.meaning}</p>
          </div>
        </div>

        <dl className="brief-facts">
          <div>
            <dt>Rank</dt>
            <dd>
              {d.place.rank ? `#${d.place.rank} of ${d.place.total}` : "—"}
            </dd>
          </div>
          <div>
            <dt>Share of voice</dt>
            <dd>{Math.round(d.place.yourShare)}%</dd>
          </div>
          <div>
            <dt>Engines naming you</dt>
            <dd>
              {d.engines.mentioned} of {d.engines.total}
            </dd>
          </div>
          <div>
            <dt>Since {d.since ?? "—"}</dt>
            <dd>{d.delta === null ? "first reading" : `${signed(d.delta)} pts`}</dd>
          </div>
        </dl>

        <p className="brief-abstract">{d.data.summary}</p>

        <footer className="brief-foot">
          <span>Measured {d.measured}</span>
        </footer>
      </section>

      {/* ------------------------------------------------- 2. the standings */}
      <section className="t-page">
        <Head brand={brand.name} part="Standing" measured={d.measured} />
        <h2 className="brief-h2">Standing</h2>

        <div className="brief-cols">
          <div>
            <h3 className="brief-h3">Engine by engine</h3>
            <table className="brief-table">
              <thead>
                <tr>
                  <th>Assistant</th>
                  <th className="num">Score</th>
                  <th className="num">Names you</th>
                </tr>
              </thead>
              <tbody>
                {d.engineRows.map((e) => (
                  <tr key={e.name}>
                    <td>{e.name}</td>
                    <td className="num">{Math.round(e.score)}</td>
                    <td className="num">{e.mentioned ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {history.length > 1 && (
              <>
                <h3 className="brief-h3">Readings</h3>
                <table className="brief-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th className="num">Score</th>
                      <th className="num">Δ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.slice(0, 8).map((h, i) => {
                      const prev = history[i + 1];
                      return (
                        <tr key={h.id}>
                          <td>{fmtShort(h.created_at)}</td>
                          <td className="num">{Math.round(h.score)}</td>
                          <td className="num">
                            {prev ? signed(Math.round(h.score - prev.score)) : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            )}
          </div>

          <div>
            <h3 className="brief-h3">Share of voice</h3>
            <table className="brief-table">
              <thead>
                <tr>
                  <th className="num">#</th>
                  <th>Brand</th>
                  <th className="num">Share</th>
                </tr>
              </thead>
              <tbody>
                {d.sortedCompetitors.map((c, i) => (
                  <tr key={`${c.name}-${i}`} className={c === d.you ? "is-you" : ""}>
                    <td className="num">{i + 1}</td>
                    <td>{c.name}</td>
                    <td className="num">{Math.round(c.share)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {d.place.rank && d.place.leader && d.place.rank > 1 && (
              <p className="brief-note">
                {d.place.leader.name} leads on {Math.round(d.place.leader.share)}%
                {d.place.leaderMultiple ? ` — ${d.place.leaderMultiple}× your share` : ""}.
                Closing {d.place.gapPoints} points would take the top slot.
              </p>
            )}

            {d.sentiment && (
              <>
                <h3 className="brief-h3">Sentiment</h3>
                <p className="brief-note">
                  {d.sentiment.positivePct}% positive · {d.sentiment.negativePct}%
                  negative · overall {d.sentiment.label}
                </p>
                <ul className="brief-themes">
                  {(d.sentiment.positiveThemes ?? []).slice(0, 2).map((t, i) => (
                    <li key={`p${i}`}>
                      <span className="brief-plus">+</span> {t.theme}
                    </li>
                  ))}
                  {(d.sentiment.negativeThemes ?? []).slice(0, 2).map((t, i) => (
                    <li key={`n${i}`}>
                      <span className="brief-minus">−</span> {t.theme}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>

        <Foot part="2" />
      </section>

      {/* ----------------------------------------------------- 3. citations */}
      {d.sources.length > 0 && (
        <section className="t-page">
          <Head brand={brand.name} part="Citations" measured={d.measured} />
          <h2 className="brief-h2">Where the answers come from</h2>
          <p className="brief-lede">
            Assistants lean on {d.cites.total} sources for this category.{" "}
            {brand.name} appears on {d.cites.yours}
            {d.cites.missing > 0
              ? `; ${d.cites.missing} shape the answer without it.`
              : "."}
          </p>
          <table className="brief-table brief-wide">
            <thead>
              <tr>
                <th>Source</th>
                <th className="num">Yours</th>
                <th>Why it is cited</th>
              </tr>
            </thead>
            <tbody>
              {d.sources.map((s, i) => (
                <tr key={`${s.domain}-${i}`} className={s.isYou ? "is-you" : ""}>
                  <td className="mono">{s.domain}</td>
                  <td className="num">{s.isYou ? "Yes" : "No"}</td>
                  <td>{s.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Foot part="3" />
        </section>
      )}

      {/* --------------------------------------------------- 4. the moves */}
      {movePages.map((page, pi) => (
        <section className="t-page" key={`mv${pi}`}>
          <Head
            brand={brand.name}
            part={pi === 0 ? "Recommendations" : "Recommendations (cont.)"}
            measured={d.measured}
          />
          <h2 className="brief-h2">
            Recommendations{pi > 0 && <span className="brief-cont"> continued</span>}
          </h2>
          {pi === 0 && (
            <p className="brief-lede">
              Ranked by impact.
              {d.anySnippets &&
                " Any block that needs to go on the site is in the appendix."}
            </p>
          )}
          <ol className="brief-moves">
            {page.map(({ move, why, list }, i) => (
              <li key={i}>
                <div className="brief-move-head">
                  <span className="brief-num">
                    {String(offsetOf(movePages, pi) + i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="brief-h3">{move.title}</h3>
                  <span className={`brief-impact i-${move.impact}`}>{move.impact}</span>
                </div>
                <p className="brief-why">{why}</p>
                {list.length > 0 && (
                  <ul className="brief-steps">
                    {list.map((sx, k) => (
                      <li key={k}>{sx}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
          <Foot part="4" />
        </section>
      ))}

      {/* ---------------------------------------------------- 5. the content */}
      {d.ideas.length > 0 && (
        <section className="t-page">
          <Head brand={brand.name} part="Content plan" measured={d.measured} />
          <h2 className="brief-h2">Content that earns citations</h2>
          <ol className="brief-ideas">
            {d.ideas.map((idea, i) => (
              <li key={i}>
                <p className="brief-kind">{idea.type}</p>
                <h3 className="brief-h3">{idea.title}</h3>
                <p className="brief-why">{idea.description}</p>
              </li>
            ))}
          </ol>
          <Foot part="5" />
        </section>
      )}

      {/* --------------------------------------------------- 6. appendix */}
      {codePages.map((page, pi) => (
        <section className="t-page" key={`cx${pi}`}>
          <Head
            brand={brand.name}
            part={pi === 0 ? "Appendix" : "Appendix (cont.)"}
            measured={d.measured}
          />
          <h2 className="brief-h2">
            Appendix — blocks to paste
            {pi > 0 && <span className="brief-cont"> continued</span>}
          </h2>
          {pi === 0 && (
            <p className="brief-lede">
              Ready to hand to whoever maintains the site. Replace anything in
              angle brackets before shipping.
            </p>
          )}
          {page.map((s, k) => (
            <figure className="brief-code" key={k}>
              <figcaption>
                {s.label} · {s.title}
              </figcaption>
              <pre>
                <code>{s.code}</code>
              </pre>
            </figure>
          ))}
          <Foot part="6" />
        </section>
      ))}

      <BackPage site={site} brand={brand.name} measured={d.measured} />
    </article>
  );
}

function Head({
  brand,
  part,
  measured,
}: {
  brand: string;
  part: string;
  measured: string;
}) {
  return (
    <header className="brief-run" aria-hidden="true">
      <span>{brand}</span>
      <span>{part}</span>
      <span>{measured}</span>
    </header>
  );
}

function Foot({ part }: { part: string }) {
  return (
    <footer className="brief-pagefoot" aria-hidden="true">
      <span>Part {part}</span>
    </footer>
  );
}

/**
 * The back page — the one place the platform names itself, so the body of the
 * report reads as the client's document rather than an advertisement for ours.
 */
export function BackPage({
  site,
  brand,
  measured,
  className = "",
}: {
  site: string;
  brand: string;
  measured: string;
  className?: string;
}) {
  return (
    <section className={`t-page t-back ${className}`}>
      <div className="back-inner">
        <p className="back-k">Report ends</p>
        <h2 className="back-title">
          This report measures how AI assistants answer buyers in your category.
        </h2>
        <p className="back-body">
          Every figure is drawn from live answers given by ChatGPT, Perplexity,
          Gemini, Claude and Grok on {measured} for {brand}. Re-run it any time
          to see what moved.
        </p>
      </div>
      <footer className="back-foot">
        <div className="back-sig">
          <span className="back-mark">StayFound</span>
          <span className="back-site">{site}</span>
        </div>
      </footer>
    </section>
  );
}

/** Where a page of moves starts in the overall numbering, so "03" on the second
 *  sheet is still the third recommendation and not the first. */
function offsetOf<T>(pages: T[][], index: number): number {
  return pages.slice(0, index).reduce((n, p) => n + p.length, 0);
}
