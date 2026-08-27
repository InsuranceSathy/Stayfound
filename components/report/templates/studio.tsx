import {
  derive,
  paginateMoves,
  snippetPages,
  signed,
  type TemplateProps,
} from "@/components/report/shared";

/**
 * Studio — the editorial one.
 *
 * Full-bleed colour fields, an asymmetric grid, pull quotes set large in
 * Newsreader italic, and the score treated as a piece of display type rather
 * than a stat. Indigo rather than the terracotta-on-cream every generated
 * report seems to arrive in, and the accent does the structural work: it marks
 * the field pages and nothing else.
 *
 * For agencies whose own work looks like this, handing a client a document that
 * looks like a spreadsheet undersells the finding.
 */
export function StudioTemplate({ brand, snapshot, history, site }: TemplateProps) {
  const d = derive({ brand, snapshot, history });
  const movePages = paginateMoves(d.moves);
  const codePages = snippetPages(d.moves);
  const pull = d.sentiment?.positiveThemes?.[0] ?? null;
  const objection = d.sentiment?.negativeThemes?.[0] ?? null;

  return (
    <article className="t t-studio">
      {/* cover — full field */}
      <section className="t-page studio-cover">
        <header className="studio-cover-top">
          <span className="studio-mark">StayFound</span>
          <span>AI search visibility</span>
        </header>
        <h1 className="studio-title">{brand.name}</h1>
        <div className="studio-cover-bottom">
          <p className="studio-cover-cat">
            {brand.category}
            {brand.market ? ` · ${brand.market}` : ""}
          </p>
          <p className="studio-cover-date">{d.measured}</p>
        </div>
      </section>

      {/* the number, as display type */}
      <section className="t-page studio-page">
        <Run brand={brand.name} part="The number" />
        <div className="studio-score-row">
          <span className="studio-score">{d.score}</span>
          <div className="studio-score-side">
            <p className="studio-verdict">{d.verdict.label}</p>
            <p className="studio-meaning">{d.verdict.meaning}</p>
          </div>
        </div>

        <div className="studio-stats">
          <div>
            <span className="studio-stat-v">
              {d.place.rank ? `#${d.place.rank}` : "—"}
            </span>
            <span className="studio-stat-k">of {d.place.total} in category</span>
          </div>
          <div>
            <span className="studio-stat-v">{Math.round(d.place.yourShare)}%</span>
            <span className="studio-stat-k">share of AI answers</span>
          </div>
          <div>
            <span className="studio-stat-v">
              {d.engines.mentioned}/{d.engines.total}
            </span>
            <span className="studio-stat-k">assistants name you</span>
          </div>
          <div>
            <span className="studio-stat-v">
              {d.delta === null ? "—" : signed(d.delta)}
            </span>
            <span className="studio-stat-k">
              {d.since ? `since ${d.since}` : "first reading"}
            </span>
          </div>
        </div>

        <p className="studio-body studio-summary">{d.data.summary}</p>
        <Foot part="" />
      </section>

      {/* pull quote field */}
      {pull && (
        <section className="t-page studio-quote-page">
          <p className="studio-quote-k">What the assistants say</p>
          <blockquote className="studio-quote">“{pull.quote}”</blockquote>
          <p className="studio-quote-attr">
            {pull.theme} — the strongest thing working in your favour
          </p>
          {objection && (
            <div className="studio-counter">
              <p className="studio-quote-k">And what holds you back</p>
              <p className="studio-counter-q">“{objection.quote}”</p>
              <p className="studio-quote-attr">{objection.theme}</p>
            </div>
          )}
        </section>
      )}

      {/* the field */}
      <section className="t-page studio-page">
        <Run brand={brand.name} part="The field" />
        <h2 className="studio-h2">Who wins the answers</h2>
        <ol className="studio-field">
          {d.sortedCompetitors.map((c, i) => (
            <li key={`${c.name}-${i}`} className={c === d.you ? "is-you" : ""}>
              <span className="studio-field-n">{i + 1}</span>
              <span className="studio-field-name">{c.name}</span>
              <span className="studio-field-bar">
                <span style={{ width: `${Math.round(c.share) * 3.4}%` }} />
              </span>
              <span className="studio-field-v">{Math.round(c.share)}%</span>
            </li>
          ))}
        </ol>

        <h3 className="studio-h3">By assistant</h3>
        <div className="studio-engines">
          {d.engineRows.map((e) => (
            <div key={e.name} className={e.mentioned ? "" : "is-absent"}>
              <span className="studio-eng-v">{Math.round(e.score)}</span>
              <span className="studio-eng-n">{e.name}</span>
            </div>
          ))}
        </div>
        <Foot part="" />
      </section>

      {/* sources */}
      {d.sources.length > 0 && (
        <section className="t-page studio-page">
          <Run brand={brand.name} part="Sources" />
          <h2 className="studio-h2">Where AI gets its answers</h2>
          <p className="studio-body">
            {d.cites.yours} of {d.cites.total} sources are yours.
            {d.cites.missing > 0 &&
              ` The other ${d.cites.missing} shape the answer without you in the room.`}
          </p>
          <ul className="studio-sources">
            {d.sources.map((s, i) => (
              <li key={`${s.domain}-${i}`} className={s.isYou ? "is-you" : ""}>
                <span className="studio-src-d">{s.domain}</span>
                <span className="studio-src-n">{s.note}</span>
              </li>
            ))}
          </ul>
          <Foot part="" />
        </section>
      )}

      {/* moves */}
      {movePages.map((page, pi) => (
        <section className="t-page studio-page" key={`mv${pi}`}>
          <Run brand={brand.name} part={pi === 0 ? "The work" : "The work (cont.)"} />
          <h2 className="studio-h2">What to do{pi > 0 ? ", continued" : ""}</h2>
          <ol className="studio-moves">
            {page.map(({ move, why, list }, i) => (
              <li key={i}>
                <span className="studio-move-n">
                  {String(offsetOf(movePages, pi) + i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="studio-h3">
                    {move.title}
                    <span className={`studio-impact i-${move.impact}`}>{move.impact}</span>
                  </h3>
                  <p className="studio-body">{why}</p>
                  {list.length > 0 && (
                    <ul className="studio-steps">
                      {list.map((sx, k) => (
                        <li key={k}>{sx}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ol>
          <Foot part="" />
        </section>
      ))}

      {/* content */}
      {d.ideas.length > 0 && (
        <section className="t-page studio-page">
          <Run brand={brand.name} part="Content" />
          <h2 className="studio-h2">Content that earns citations</h2>
          <ol className="studio-ideas">
            {d.ideas.map((idea, i) => (
              <li key={i}>
                <span className="studio-idea-k">{idea.type}</span>
                <h3 className="studio-idea-t">{idea.title}</h3>
                <p className="studio-body">{idea.description}</p>
              </li>
            ))}
          </ol>
          <Foot part="" />
        </section>
      )}

      {/* appendix */}
      {codePages.map((page, pi) => (
        <section className="t-page studio-page" key={`cx${pi}`}>
          <Run brand={brand.name} part={pi === 0 ? "Appendix" : "Appendix (cont.)"} />
          <h2 className="studio-h2">Blocks to paste{pi > 0 ? ", continued" : ""}</h2>
          {pi === 0 && (
            <p className="studio-body">
              Ready to hand to whoever maintains the site. Replace anything in
              angle brackets before shipping.
            </p>
          )}
          {page.map((s, k) => (
            <figure className="studio-code" key={k}>
              <figcaption>
                {s.label} · {s.title}
              </figcaption>
              <pre>
                <code>{s.code}</code>
              </pre>
            </figure>
          ))}
          <Foot part="" />
        </section>
      ))}

      {/* back — full field again, bookending the cover */}
      <section className="t-page studio-back">
        <div>
          <p className="studio-back-k">Measured by</p>
          <p className="studio-back-mark">StayFound</p>
          <p className="studio-back-body">
            Live answers from ChatGPT, Perplexity, Gemini, Claude and Grok,
            measured {d.measured} for {brand.name}.
          </p>
        </div>
        {/* The only place the platform's own address appears. */}
        <footer className="studio-back-foot">
          <span>{site}</span>
        </footer>
      </section>
    </article>
  );
}

function Run({ brand, part }: { brand: string; part: string }) {
  return (
    <header className="studio-run" aria-hidden="true">
      <span>{brand}</span>
      <span>{part}</span>
    </header>
  );
}

/** Deliberately empty of any StayFound mark: the running foot is the client's
 *  page, and the platform names itself once, on the final page. */
function Foot({ part }: { part: string }) {
  return (
    <footer className="studio-foot" aria-hidden="true">
      <span>{part}</span>
    </footer>
  );
}

/** Where a page of moves starts in the overall numbering. */
function offsetOf<T>(pages: T[][], index: number): number {
  return pages.slice(0, index).reduce((n, p) => n + p.length, 0);
}
