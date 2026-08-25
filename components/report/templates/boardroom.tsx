import {
  derive,
  fmtShort,
  paginateMoves,
  snippetPages,
  signed,
  type TemplateProps,
} from "@/components/report/shared";

/**
 * Boardroom — the formal one.
 *
 * A navy cover, wide margins, Newsreader at display sizes and a brass rule
 * under every heading. Nothing is dense; the point of the format is that it
 * looks considered and expensive on a table, so each page carries one section
 * and lets it breathe.
 *
 * Numbers are set as figures with their units spelled out, because this is the
 * template you hand to someone who will read the sentence and not the table.
 */
export function BoardroomTemplate({ brand, snapshot, history, site }: TemplateProps) {
  const d = derive({ brand, snapshot, history });
  const movePages = paginateMoves(d.moves);
  const codePages = snippetPages(d.moves);

  return (
    <article className="t t-board">
      {/* cover */}
      <section className="t-page board-cover">
        <header className="board-cover-top">
          <span className="board-mark">StayFound</span>
          <span className="board-cover-kind">AI Search Visibility Report</span>
        </header>
        <div className="board-cover-mid">
          <h1 className="board-title">{brand.name}</h1>
          <p className="board-sub">
            {brand.category}
            {brand.market ? ` · ${brand.market}` : ""}
          </p>
        </div>
        <footer className="board-cover-foot">
          <div>
            <p className="board-cover-k">Prepared</p>
            <p className="board-cover-v">{d.measured}</p>
          </div>
          <div>
            <p className="board-cover-k">Visibility score</p>
            <p className="board-cover-v">{d.score} / 100 · {d.verdict.label}</p>
          </div>
        </footer>
      </section>

      {/* summary */}
      <section className="t-page board-page">
        <Run brand={brand.name} part="Summary" />
        <h2 className="board-h2">Summary</h2>
        <p className="board-lede">{d.data.summary}</p>

        <div className="board-figures">
          <Figure k="Visibility score" v={`${d.score}`} s="out of 100" />
          <Figure
            k="Position"
            v={d.place.rank ? `#${d.place.rank}` : "—"}
            s={`of ${d.place.total} brands`}
          />
          <Figure
            k="Share of voice"
            v={`${Math.round(d.place.yourShare)}%`}
            s="of AI answers"
          />
          <Figure
            k="Engine coverage"
            v={`${d.engines.mentioned}/${d.engines.total}`}
            s="assistants name you"
          />
        </div>

        <p className="board-body">{d.verdict.meaning}</p>
        {d.delta !== null && d.since && (
          <p className="board-body">
            The score has moved {signed(d.delta)} points since {d.since}, across{" "}
            {history.length} readings.
          </p>
        )}
        <Foot part="I" />
      </section>

      {/* position */}
      <section className="t-page board-page">
        <Run brand={brand.name} part="Position" />
        <h2 className="board-h2">Position in the category</h2>
        <table className="board-table">
          <thead>
            <tr>
              <th>Brand</th>
              <th className="num">Share of voice</th>
              <th className="num">Difference</th>
            </tr>
          </thead>
          <tbody>
            {d.sortedCompetitors.map((c, i) => (
              <tr key={`${c.name}-${i}`} className={c === d.you ? "is-you" : ""}>
                <td>
                  {c.name}
                  {c === d.you && <span className="board-you">Your brand</span>}
                </td>
                <td className="num">{Math.round(c.share)}%</td>
                <td className="num">
                  {c === d.you ? "—" : signed(Math.round(c.share - d.place.yourShare))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3 className="board-h3">Performance by assistant</h3>
        <table className="board-table">
          <thead>
            <tr>
              <th>Assistant</th>
              <th className="num">Score</th>
              <th className="num">Names your brand</th>
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
        <Foot part="II" />
      </section>

      {/* perception */}
      {d.sentiment && (
        <section className="t-page board-page">
          <Run brand={brand.name} part="Perception" />
          <h2 className="board-h2">How assistants describe you</h2>
          <p className="board-lede">
            {d.sentiment.positivePct}% of what assistants say about {brand.name} is
            positive; {d.sentiment.negativePct}% is not.
          </p>
          <div className="board-two">
            <div>
              <h3 className="board-h3">Working in your favour</h3>
              {(d.sentiment.positiveThemes ?? []).map((t, i) => (
                <div className="board-theme" key={i}>
                  <p className="board-theme-t">{t.theme}</p>
                  <blockquote>{t.quote}</blockquote>
                </div>
              ))}
            </div>
            <div>
              <h3 className="board-h3">Working against you</h3>
              {(d.sentiment.negativeThemes ?? []).map((t, i) => (
                <div className="board-theme" key={i}>
                  <p className="board-theme-t">{t.theme}</p>
                  <blockquote>{t.quote}</blockquote>
                </div>
              ))}
            </div>
          </div>
          <Foot part="III" />
        </section>
      )}

      {/* sources */}
      {d.sources.length > 0 && (
        <section className="t-page board-page">
          <Run brand={brand.name} part="Sources" />
          <h2 className="board-h2">Where the answers come from</h2>
          <p className="board-lede">
            Assistants draw on {d.cites.total} sources when answering in this
            category. {brand.name} controls {d.cites.yours}.
          </p>
          <table className="board-table">
            <thead>
              <tr>
                <th>Source</th>
                <th className="num">Yours</th>
                <th>Role in the answer</th>
              </tr>
            </thead>
            <tbody>
              {d.sources.map((s, i) => (
                <tr key={`${s.domain}-${i}`} className={s.isYou ? "is-you" : ""}>
                  <td>{s.domain}</td>
                  <td className="num">{s.isYou ? "Yes" : "No"}</td>
                  <td>{s.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Foot part="IV" />
        </section>
      )}

      {/* recommendations */}
      {movePages.map((page, pi) => (
        <section className="t-page board-page" key={`mv${pi}`}>
          <Run
            brand={brand.name}
            part={pi === 0 ? "Recommendations" : "Recommendations (cont.)"}
          />
          <h2 className="board-h2">
            Recommendations{pi > 0 ? " continued" : ""}
          </h2>
          <ol className="board-moves">
            {page.map(({ move, why, list }, i) => (
              <li key={i}>
                <p className="board-move-k">
                  Recommendation {offsetOf(movePages, pi) + i + 1} · {move.impact} impact
                </p>
                <h3 className="board-h3">{move.title}</h3>
                <p className="board-body">{why}</p>
                {list.length > 0 && (
                  <ul className="board-steps">
                    {list.map((sx, k) => (
                      <li key={k}>{sx}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
          <Foot part="V" />
        </section>
      ))}

      {/* content */}
      {d.ideas.length > 0 && (
        <section className="t-page board-page">
          <Run brand={brand.name} part="Content" />
          <h2 className="board-h2">Content that earns citations</h2>
          <table className="board-table">
            <thead>
              <tr>
                <th>Format</th>
                <th>Title</th>
              </tr>
            </thead>
            <tbody>
              {d.ideas.map((idea, i) => (
                <tr key={i}>
                  <td className="board-kind">{idea.type}</td>
                  <td>
                    <span className="board-idea-t">{idea.title}</span>
                    <span className="board-idea-d">{idea.description}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Foot part="VI" />
        </section>
      )}

      {/* readings */}
      {history.length > 1 && (
        <section className="t-page board-page">
          <Run brand={brand.name} part="Record" />
          <h2 className="board-h2">Readings on record</h2>
          <table className="board-table">
            <thead>
              <tr>
                <th>Date</th>
                <th className="num">Score</th>
                <th className="num">Change</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => {
                const prev = history[i + 1];
                return (
                  <tr key={h.id}>
                    <td>{fmtShort(h.created_at)}</td>
                    <td className="num">{Math.round(h.score)}</td>
                    <td className="num">
                      {prev ? signed(Math.round(h.score - prev.score)) : "first"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Foot part="VII" />
        </section>
      )}

      {/* appendix */}
      {codePages.map((page, pi) => (
        <section className="t-page board-page" key={`cx${pi}`}>
          <Run
            brand={brand.name}
            part={pi === 0 ? "Appendix" : "Appendix (cont.)"}
          />
          <h2 className="board-h2">Appendix — blocks to paste{pi > 0 ? " continued" : ""}</h2>
          {pi === 0 && (
            <p className="board-lede">
              Ready to hand to whoever maintains the site. Replace anything in
              angle brackets before shipping.
            </p>
          )}
          {page.map((s, k) => (
            <figure className="board-code" key={k}>
              <figcaption>
                {s.label} · {s.title}
              </figcaption>
              <pre>
                <code>{s.code}</code>
              </pre>
            </figure>
          ))}
          <Foot part="VIII" />
        </section>
      ))}

      {/* back */}
      <section className="t-page board-back">
        <div className="board-back-top">
          <p className="board-back-k">Measured by</p>
          <p className="board-back-mark">StayFound</p>
          <p className="board-back-body">
            This report reflects live answers given by ChatGPT, Perplexity,
            Gemini, Claude and Grok on {d.measured}. Scores move as those answers
            move; re-run the measurement to see what changed.
          </p>
        </div>
        {/* The only place the platform's own address appears. */}
        <footer className="board-back-foot">
          <span className="board-back-site">{site}</span>
        </footer>
      </section>
    </article>
  );
}

function Figure({ k, v, s }: { k: string; v: string; s: string }) {
  return (
    <div className="board-figure">
      <p className="board-figure-k">{k}</p>
      <p className="board-figure-v">{v}</p>
      <p className="board-figure-s">{s}</p>
    </div>
  );
}

function Run({ brand, part }: { brand: string; part: string }) {
  return (
    <header className="board-run" aria-hidden="true">
      <span>{brand}</span>
      <span>{part}</span>
    </header>
  );
}

function Foot({ part }: { part: string }) {
  return (
    <footer className="board-foot" aria-hidden="true">
      <span>{part}</span>
    </footer>
  );
}

/** Where a page of moves starts in the overall numbering, so a recommendation
 *  keeps its number when it lands on the second sheet. */
function offsetOf<T>(pages: T[][], index: number): number {
  return pages.slice(0, index).reduce((n, p) => n + p.length, 0);
}
