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

/**
 * The report as a document.
 *
 * The dashboard is a place you operate; this is a thing you hand to someone.
 * That difference drives every decision here: one idea per page, a fixed
 * narrative order rather than the order the model returned, everything
 * expanded because paper has no disclosure triangles, and a running head so a
 * page that gets printed and passed around still says what it is and when it
 * was measured.
 *
 * It is real HTML rather than a generated PDF so it inherits the product's own
 * type and palette, and the browser's print engine does the pagination. No PDF
 * library, no headless browser on a server, and the same file is readable on
 * screen while you decide whether to save it.
 */

function Page({
  children,
  brand,
  measured,
  n,
  of,
  eyebrow,
}: {
  children: React.ReactNode;
  brand: string;
  measured: string;
  n: number;
  of: number;
  eyebrow: string;
}) {
  return (
    <section className="rp-page">
      <header className="rp-head" aria-hidden="true">
        <span>{brand}</span>
        <span>{eyebrow}</span>
      </header>
      <div className="rp-body">{children}</div>
      <footer className="rp-foot" aria-hidden="true">
        <span>Measured {measured}</span>
        {/* "Part n of N", not "n / N": a section with a lot of moves in it
            spills onto a second sheet, so a bare pair of numbers in the corner
            would read as a page count and be wrong. The part number is true
            however many sheets the part takes. */}
        <span>
          Part {n} of {of}
        </span>
      </footer>
    </section>
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
  // Prepared up front rather than inside the map, because the page's opening
  // line depends on whether any move actually produced a snippet — a report
  // that promises paste-ready blocks and then shows none is worse than one
  // that never promised.
  const moves = rankedActions(data.actions).map((m) => ({
    move: m,
    list: steps(m.detail),
    snippets: snippetsFor(m, { name: brand.name, category: brand.category }),
  }));
  const anySnippets = moves.some((m) => m.snippets.length > 0);
  const ideas = data.contentIdeas ?? [];
  const sources = data.citedSources ?? [];
  const sorted = [...data.competitors].sort((a, b) => b.share - a.share);

  const measured = new Date(snapshot.created_at).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Pages are counted rather than hardcoded so a scan without sentiment or
  // content ideas doesn't print "page 4 of 6" and then stop at 4.
  const pages = [
    "cover",
    "standing",
    "rivals",
    sources.length ? "sources" : null,
    moves.length ? "moves" : null,
    ideas.length ? "ideas" : null,
  ].filter(Boolean) as string[];
  const of = pages.length;
  const at = (k: string) => pages.indexOf(k) + 1;

  return (
    <article className="rp">
      {/* ---------------------------------------------------------- cover */}
      <section className="rp-page rp-cover">
        <div className="rp-cover-top">
          <p className="rp-k">AI search visibility report</p>
          <h1 className="rp-title">{brand.name}</h1>
          <p className="rp-sub">
            {brand.category}
            {brand.market ? ` · ${brand.market}` : ""}
          </p>
        </div>

        <div className="rp-cover-score">
          <span className="rp-score">{Math.round(snapshot.score)}</span>
          <span className="rp-score-of">out of 100</span>
          <span className="rp-verdict">{verdict.label}</span>
        </div>

        <p className="rp-cover-read">{verdict.meaning}</p>

        <dl className="rp-facts">
          <div>
            <dt>Measured</dt>
            <dd>{measured}</dd>
          </div>
          <div>
            <dt>Engines asked</dt>
            <dd>
              {data.engines.map((e) => e.name).join(", ")}
            </dd>
          </div>
          <div>
            <dt>Naming you</dt>
            <dd>
              {engines.mentioned} of {engines.total}
            </dd>
          </div>
          <div>
            <dt>Readings on record</dt>
            <dd>{history.length}</dd>
          </div>
        </dl>

        <footer className="rp-cover-foot">
          <span className="rp-mark">StayFound</span>
          <span>stayfound.tech</span>
        </footer>
      </section>

      {/* ------------------------------------------------------- standing */}
      <Page brand={brand.name} measured={measured} n={at("standing")} of={of} eyebrow="Where you stand">
        <h2 className="rp-h2">Where you stand</h2>
        <p className="rp-lede">{data.summary}</p>

        <h3 className="rp-h3">Engine by engine</h3>
        <table className="rp-table">
          <thead>
            <tr>
              <th>Assistant</th>
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
                  <td className="num">{Math.round(e.score)}</td>
                  <td>{e.mentioned ? "Yes" : "No"}</td>
                </tr>
              ))}
          </tbody>
        </table>

        {history.length > 1 && (
          <>
            <h3 className="rp-h3">Readings over time</h3>
            <table className="rp-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th className="num">Score</th>
                  <th className="num">Change</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 8).map((h, i) => {
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
          </>
        )}
      </Page>

      {/* --------------------------------------------------------- rivals */}
      <Page brand={brand.name} measured={measured} n={at("rivals")} of={of} eyebrow="Who wins the answers">
        <h2 className="rp-h2">Who wins the answers</h2>
        {place.rank && place.leader && (
          <p className="rp-lede">
            {place.rank === 1 ? (
              <>
                {brand.name} leads the category with{" "}
                {Math.round(place.yourShare)}% share of voice.
              </>
            ) : (
              <>
                {brand.name} sits at #{place.rank} of {place.total} with{" "}
                {Math.round(place.yourShare)}% share of voice.{" "}
                {place.leader.name} takes {Math.round(place.leader.share)}%
                {place.leaderMultiple ? ` — ${place.leaderMultiple}× yours` : ""}.
              </>
            )}
          </p>
        )}

        <table className="rp-table">
          <thead>
            <tr>
              <th className="num">#</th>
              <th>Brand</th>
              <th className="num">Share of voice</th>
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
                  <td className="num">{Math.round(c.share)}%</td>
                  <td className="num">
                    {isYou ? "—" : gap > 0 ? `+${gap} pts` : `${gap} pts`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {data.sentiment && (
          <>
            <h3 className="rp-h3">How the assistants describe you</h3>
            <p className="rp-note">
              {data.sentiment.positivePct}% positive ·{" "}
              {data.sentiment.negativePct}% negative · overall{" "}
              {data.sentiment.label}
            </p>
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
          </>
        )}
      </Page>

      {/* -------------------------------------------------------- sources */}
      {sources.length > 0 && (
        <Page brand={brand.name} measured={measured} n={at("sources")} of={of} eyebrow="Where AI gets its answers">
          <h2 className="rp-h2">Where AI gets its answers</h2>
          <p className="rp-lede">
            Assistants lean on {cites.total} sources for this category.{" "}
            {brand.name} appears on {cites.yours}
            {cites.missing > 0
              ? `, which leaves ${cites.missing} pages shaping the answer without it.`
              : "."}
          </p>
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
        </Page>
      )}

      {/* ---------------------------------------------------------- moves */}
      {moves.length > 0 && (
        <Page brand={brand.name} measured={measured} n={at("moves")} of={of} eyebrow="What to do">
          <h2 className="rp-h2">What to do</h2>
          <p className="rp-lede">
            Ranked by impact, highest first.
            {anySnippets &&
              " Where a move needs schema, crawler access or a listing, the block is written out ready to paste."}
          </p>
          <ol className="rp-moves">
            {moves.map(({ move, list, snippets }, i) => (
              <li key={i} className="rp-move">
                <div className="rp-move-head">
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
                {snippets.map((s, k) => (
                  <figure className="rp-code" key={k}>
                    <figcaption>{s.label}</figcaption>
                    <pre>
                      <code>{s.code}</code>
                    </pre>
                  </figure>
                ))}
              </li>
            ))}
          </ol>
        </Page>
      )}

      {/* ---------------------------------------------------------- ideas */}
      {ideas.length > 0 && (
        <Page brand={brand.name} measured={measured} n={at("ideas")} of={of} eyebrow="Content that earns citations">
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
        </Page>
      )}
    </article>
  );
}
