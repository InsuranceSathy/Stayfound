import {
  derive,
  fmtShort,
  paginateMoves,
  snippetPages,
  signed,
  type TemplateProps,
} from "@/components/report/shared";

/**
 * Ledger — the quiet one.
 *
 * No colour, no fills, no ornament: black on white, one rule weight, one grid.
 * Emphasis is carried entirely by position, weight and space, which is the
 * hardest of the five to get right and the one that survives a bad printer, a
 * photocopy and a client's own brand guidelines.
 *
 * Every section is a labelled block in a single column, aligned on the same
 * left edge, so the document reads as one continuous record rather than a set
 * of designed pages.
 */
export function LedgerTemplate({ brand, snapshot, history, site }: TemplateProps) {
  const d = derive({ brand, snapshot, history });
  const movePages = paginateMoves(d.moves);
  const codePages = snippetPages(d.moves);

  return (
    <article className="t t-ledger">
      {/* cover */}
      <section className="t-page ledger-page ledger-cover">
        <header className="ledger-top">
          <span>StayFound</span>
          <span>AI search visibility report</span>
        </header>

        <div className="ledger-cover-mid">
          <h1 className="ledger-title">{brand.name}</h1>
          <p className="ledger-cover-sub">
            {brand.category}
            {brand.market ? ` · ${brand.market}` : ""}
          </p>
        </div>

        <dl className="ledger-index">
          <Row k="Visibility score" v={`${d.score} / 100`} />
          <Row k="Reading" v={d.verdict.label} />
          <Row
            k="Position"
            v={d.place.rank ? `${d.place.rank} of ${d.place.total}` : "—"}
          />
          <Row k="Share of voice" v={`${Math.round(d.place.yourShare)}%`} />
          <Row
            k="Assistants naming the brand"
            v={`${d.engines.mentioned} of ${d.engines.total}`}
          />
          <Row k="Measured" v={d.measured} />
          <Row
            k="Readings on record"
            v={`${history.length}${d.delta !== null ? ` · ${signed(d.delta)} pts since ${d.since}` : ""}`}
          />
        </dl>

        <p className="ledger-abstract">{d.data.summary}</p>
        <Foot n="01" />
      </section>

      {/* measurements */}
      <section className="t-page ledger-page">
        <Run brand={brand.name} part="Measurements" />
        <h2 className="ledger-h2">01 — Measurements</h2>

        <h3 className="ledger-h3">By assistant</h3>
        <table className="ledger-table">
          <tbody>
            {d.engineRows.map((e) => (
              <tr key={e.name}>
                <td>{e.name}</td>
                <td className="num">{Math.round(e.score)}</td>
                <td className="num ledger-quiet">
                  {e.mentioned ? "names the brand" : "does not name the brand"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3 className="ledger-h3">Share of voice</h3>
        <table className="ledger-table">
          <tbody>
            {d.sortedCompetitors.map((c, i) => (
              <tr key={`${c.name}-${i}`} className={c === d.you ? "is-you" : ""}>
                <td>
                  {i + 1}. {c.name}
                </td>
                <td className="num">{Math.round(c.share)}%</td>
                <td className="num ledger-quiet">
                  {c === d.you
                    ? "this brand"
                    : signed(Math.round(c.share - d.place.yourShare)) + " pts"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {history.length > 1 && (
          <>
            <h3 className="ledger-h3">Record</h3>
            <table className="ledger-table">
              <tbody>
                {history.slice(0, 10).map((h, i) => {
                  const prev = history[i + 1];
                  return (
                    <tr key={h.id}>
                      <td>{fmtShort(h.created_at)}</td>
                      <td className="num">{Math.round(h.score)}</td>
                      <td className="num ledger-quiet">
                        {prev ? signed(Math.round(h.score - prev.score)) : "first"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
        <Foot n="02" />
      </section>

      {/* findings */}
      <section className="t-page ledger-page">
        <Run brand={brand.name} part="Findings" />
        <h2 className="ledger-h2">02 — Findings</h2>

        {d.sentiment && (
          <>
            <h3 className="ledger-h3">
              Perception · {d.sentiment.positivePct}% positive,{" "}
              {d.sentiment.negativePct}% negative
            </h3>
            <dl className="ledger-defs">
              {(d.sentiment.positiveThemes ?? []).map((t, i) => (
                <div key={`p${i}`}>
                  <dt>{t.theme}</dt>
                  <dd>{t.quote}</dd>
                </div>
              ))}
              {(d.sentiment.negativeThemes ?? []).map((t, i) => (
                <div key={`n${i}`} className="ledger-neg">
                  <dt>{t.theme}</dt>
                  <dd>{t.quote}</dd>
                </div>
              ))}
            </dl>
          </>
        )}

        {d.sources.length > 0 && (
          <>
            <h3 className="ledger-h3">
              Sources · {d.cites.yours} of {d.cites.total} are yours
            </h3>
            <table className="ledger-table">
              <tbody>
                {d.sources.map((s, i) => (
                  <tr key={`${s.domain}-${i}`} className={s.isYou ? "is-you" : ""}>
                    <td className="ledger-dom">{s.domain}</td>
                    <td className="ledger-quiet">{s.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        <Foot n="03" />
      </section>

      {/* actions */}
      {movePages.map((page, pi) => (
        <section className="t-page ledger-page" key={`mv${pi}`}>
          <Run brand={brand.name} part={pi === 0 ? "Actions" : "Actions (cont.)"} />
          <h2 className="ledger-h2">
            03 — Actions{pi > 0 ? " (continued)" : ""}
          </h2>
          <ol className="ledger-moves">
            {page.map(({ move, why, list }, i) => (
              <li key={i}>
                <p className="ledger-move-k">
                  {String(offsetOf(movePages, pi) + i + 1).padStart(2, "0")} ·{" "}
                  {move.impact} impact
                </p>
                <h3 className="ledger-move-t">{move.title}</h3>
                <p className="ledger-body">{why}</p>
                {list.length > 0 && (
                  <ul className="ledger-steps">
                    {list.map((sx, k) => (
                      <li key={k}>{sx}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
          <Foot n="04" />
        </section>
      ))}

      {/* content */}
      {d.ideas.length > 0 && (
        <section className="t-page ledger-page">
          <Run brand={brand.name} part="Content" />
          <h2 className="ledger-h2">04 — Content</h2>
          <dl className="ledger-defs">
            {d.ideas.map((idea, i) => (
              <div key={i}>
                <dt>{idea.title}</dt>
                <dd>
                  <span className="ledger-quiet">{idea.type}</span> — {idea.description}
                </dd>
              </div>
            ))}
          </dl>
          <Foot n="05" />
        </section>
      )}

      {/* appendix */}
      {codePages.map((page, pi) => (
        <section className="t-page ledger-page" key={`cx${pi}`}>
          <Run brand={brand.name} part={pi === 0 ? "Appendix" : "Appendix (cont.)"} />
          <h2 className="ledger-h2">
            05 — Blocks to paste{pi > 0 ? " (continued)" : ""}
          </h2>
          {pi === 0 && (
            <p className="ledger-body">
              Ready to hand to whoever maintains the site. Replace anything in
              angle brackets before shipping.
            </p>
          )}
          {page.map((s, k) => (
            <figure className="ledger-code" key={k}>
              <figcaption>
                {s.label} · {s.title}
              </figcaption>
              <pre>
                <code>{s.code}</code>
              </pre>
            </figure>
          ))}
          <Foot n="06" />
        </section>
      ))}

      {/* back */}
      <section className="t-page ledger-page ledger-back">
        <Run brand={brand.name} part="Colophon" />
        <div className="ledger-back-mid">
          <h2 className="ledger-h2">Colophon</h2>
          <p className="ledger-body">
            Measured {d.measured} for {brand.name} from live answers given by
            ChatGPT, Perplexity, Gemini, Claude and Grok. Scores move as those
            answers move.
          </p>
        </div>
        {/* The only place the platform's own address appears. */}
        <footer className="ledger-back-foot">
          <span className="ledger-back-mark">StayFound</span>
          <span className="ledger-back-site">{site}</span>
        </footer>
      </section>
    </article>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="ledger-index-row">
      <dt>{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}

function Run({ brand, part }: { brand: string; part: string }) {
  return (
    <header className="ledger-run" aria-hidden="true">
      <span>{brand}</span>
      <span>{part}</span>
    </header>
  );
}

function Foot({ n }: { n: string }) {
  return (
    <footer className="ledger-foot" aria-hidden="true">
      <span>{n}</span>
    </footer>
  );
}

/** Where a page of moves starts in the overall numbering. */
function offsetOf<T>(pages: T[][], index: number): number {
  return pages.slice(0, index).reduce((n, p) => n + p.length, 0);
}
