// Lives outside app/ so it can never be mistaken for a route.
//
// This post is also an exhibit: lib/measure.ts tells customers that comparison
// pages are among the formats AI engines cite most, and until now StayFound had
// published none of them. The tables are the point — models lift attributes out
// of tables far more reliably than out of prose.

import Link from "next/link";

/** A sourced claim. Every competitor number on this page carries one. */
function Src({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer nofollow">
      {children}
    </a>
  );
}

const S = {
  stork: "https://www.stork.ai/blog/profound-vs-otterly-vs-peec",
  indexly: "https://indexly.ai/blog/profound-pricing/",
  tmb: "https://thatmarketingbuddy.com/pricing/profound",
  peec: "https://geoptie.com/blog/peec-ai-review",
  otterly: "https://trakkr.ai/reviews/otterly-review",
  menra: "https://www.menra.ai/vs/semrush-ai-toolkit-vs-ahrefs-brand-radar",
  ahrefs:
    "https://www.ewrdigital.com/blog/ahrefs-brand-radar-review-alternatives-pricing-comparison",
  lens: "https://industry-lens.com/intelligence/ai-search",
};

export default function AiVisibilityToolsCompared2026() {
  return (
    <>
      <div className="tldr">
        <p className="tldr-h">The short version</p>
        <ul>
          <li>
            Seven serious tools now track how AI engines answer your buyers’
            questions. Entry prices run from <strong>$0</strong> to{" "}
            <strong>$199/mo</strong>, and full coverage runs to{" "}
            <strong>$5,000+/mo</strong>.
          </li>
          <li>
            <strong>Profound</strong> is the enterprise choice on data depth.{" "}
            <strong>Peec AI</strong> has the best mid-market depth-to-price.{" "}
            <strong>Otterly</strong> is the cheapest way to find out whether you
            appear at all.
          </li>
          <li>
            Almost all of them stop at a dashboard. They tell you that you lost
            the answer. None of that is the same as winning it back.
          </li>
          <li>
            <strong>StayFound</strong> goes a step further than the dashboard: we
            generate the actual fix — schema, <code>llms.txt</code>, crawler
            rules — ready to paste. Free tier, no card; $29 buys all five
            engines.
          </li>
          <li>
            We are in private beta and our prompt volumes are lower than
            Profound’s. Both of those are in the tables below.
          </li>
        </ul>
      </div>

      <h2>The funnel you can’t see</h2>
      <p>
        For twenty years, winning customers online meant winning Google. You
        earned a rank, you earned a click. That bargain is ending. Around{" "}
        <strong>60% of Google searches now end without a click</strong> — the
        answer is the destination, and AI assistants are pushing that further.
      </p>
      <p>
        Your buyers stopped scrolling ten blue links. They ask an assistant{" "}
        <em>“what’s the best tool for this?”</em> and get one answer with a short
        list of names. There is no page two. If you’re not on that list, you
        never enter the conversation — and you will never see it in your
        analytics, because there was no impression to log and no click to miss.
      </p>
      <p>
        That is a real revenue leak with no instrumentation. An entire category
        of tooling has appeared in the last two years to fix the instrumentation
        half. This post is an honest map of it, including where we sit.
      </p>

      <h2>What StayFound does</h2>
      <p>
        StayFound is an AI-visibility suite built around one loop:{" "}
        <strong>Monitor, then Optimize, then Prove.</strong> See exactly where
        you lose across every AI engine, get the highest-leverage fix in your
        hands, and watch the answer change.
      </p>
      <ul>
        <li>
          <strong>Monitor.</strong> We ask ChatGPT, Gemini, Perplexity, Claude
          and Grok the questions your buyers actually ask, then measure whether
          you were named, where in the answer you landed, who beat you, and which
          sources the models read to get there.
        </li>
        <li>
          <strong>Optimize.</strong> We rank the moves by impact and hand you the
          artefact, not the advice — paste-ready JSON-LD schema, an{" "}
          <code>llms.txt</code>, crawler rules for your <code>robots.txt</code>,
          and the specific directory listings that AI engines lean on for your
          category.
        </li>
        <li>
          <strong>Content recommendations.</strong> We also tell you what to
          write. Every scan returns the pages worth publishing to earn citations
          in your category — each one typed by format (Comparison, Listicle,
          How-to, Problem/Solution, Year-specific), given an actual working
          title, and explained in a sentence: why that piece earns a mention
          where your current pages don’t. It’s a commissioning brief, not a
          keyword list.
        </li>
        <li>
          <strong>Prove.</strong> Every scan is kept, so the score, the sentiment
          and the sources you own move visibly over time. That’s how you tell a
          fix that worked from one that didn’t.
        </li>
      </ul>

      <h2>How the measurement actually works</h2>
      <p>
        AI search is won or lost one question at a time, so our unit of analysis
        is the <strong>prompt</strong>, not the day. A daily average tells you
        the weather; the prompt tells you which deal you lost.
      </p>
      <p>Each scan runs four steps:</p>
      <ol>
        <li>
          <strong>Discover the competitive set.</strong> We ask the models who
          they consider your rivals, rather than trusting a list you typed in.
          The answer is frequently not the list you would have typed.
        </li>
        <li>
          <strong>Run an intent-weighted prompt set.</strong> Buyer questions,
          weighted so “best X for Y” counts for more than idle curiosity.
        </li>
        <li>
          <strong>Detect mentions and position.</strong> Being named fourth is
          not being named first. We score position, not just presence, and roll
          it into a position-weighted visibility score and a share of voice
          against the discovered competitors.
        </li>
        <li>
          <strong>Read the citations.</strong> The sources behind each answer are
          the lever. They are what you can actually change.
        </li>
      </ol>
      <p>
        One note on honesty, because it matters in a category this new: when the
        dashboard shows an illustrative result rather than a live measurement, it
        is labelled <code>sample data</code>. We would rather show you a smaller
        number that is real.
      </p>

      <h2>The field</h2>
      <p>
        Fair summaries. Each of these is a good tool that some team should buy
        instead of ours.
      </p>
      <ul>
        <li>
          <strong>Profound</strong> — the enterprise leader on data depth. High
          prompt volume, broad model coverage, serious export and reporting for
          teams with dedicated analysts. Priced accordingly.
        </li>
        <li>
          <strong>Peec AI</strong> — Berlin-built, the strongest mid-market
          option. Fast interface, a Looker Studio integration, and a genuinely
          useful separation of explicit brand <em>mentions</em> from source{" "}
          <em>citations</em>.
        </li>
        <li>
          <strong>Otterly.AI</strong> — the cheapest entry in the category and a
          sensible first purchase to establish whether you show up at all. Watch
          the engine add-ons.
        </li>
        <li>
          <strong>Scrunch AI</strong> — was the other enterprise contender until
          Sitecore acquired it in June 2026. Still capable; its roadmap is now a
          DXP roadmap rather than a standalone one.
        </li>
        <li>
          <strong>Semrush AI Toolkit</strong> — the pragmatic pick if you already
          pay Semrush. AI visibility lands inside the workflow your team is
          already in, which is worth more than a feature checkbox.
        </li>
        <li>
          <strong>Ahrefs Brand Radar</strong> — the widest engine list of the
          SEO-suite add-ons, including Claude and Meta AI, in a clean standalone
          view. It requires an Ahrefs base plan underneath it.
        </li>
      </ul>

      <h2>Capability comparison</h2>
      <div className="cmp-wrap">
        <table className="cmp">
          <thead>
            <tr>
              <th scope="col">Capability</th>
              <th scope="col" className="is-us">
                StayFound
              </th>
              <th scope="col">Profound</th>
              <th scope="col">Peec AI</th>
              <th scope="col">Otterly</th>
              <th scope="col">Scrunch</th>
              <th scope="col">Semrush</th>
              <th scope="col">Ahrefs</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Engines on entry paid plan</th>
              <td className="is-us">5</td>
              <td>1</td>
              <td>3 of 7</td>
              <td>4</td>
              <td>Multi</td>
              <td>4</td>
              <td>1 per index</td>
            </tr>
            <tr>
              <th scope="row">Prompt-level detail</th>
              <td className="is-us">Yes</td>
              <td>Yes</td>
              <td>Yes</td>
              <td>Yes</td>
              <td>Yes</td>
              <td>Yes</td>
              <td>Partial</td>
            </tr>
            <tr>
              <th scope="row">Citation / source tracking</th>
              <td className="is-us">Yes</td>
              <td>Yes</td>
              <td>Yes</td>
              <td>Yes</td>
              <td>Yes</td>
              <td>Yes</td>
              <td>Yes</td>
            </tr>
            <tr>
              <th scope="row">Competitor share of voice</th>
              <td className="is-us">Yes, auto-discovered</td>
              <td>Yes</td>
              <td>Yes</td>
              <td>Yes</td>
              <td>Yes</td>
              <td>Yes</td>
              <td>Yes</td>
            </tr>
            <tr>
              <th scope="row">Generates the fix (schema, llms.txt, robots)</th>
              <td className="is-us">Yes, paste-ready</td>
              <td>Guidance</td>
              <td>Guidance</td>
              <td>No</td>
              <td>Guidance</td>
              <td>Guidance</td>
              <td>No</td>
            </tr>
            <tr>
              <th scope="row">Recommends the content to publish</th>
              <td className="is-us">Yes, typed + titled</td>
              <td>Yes</td>
              <td>Guidance</td>
              <td>No</td>
              <td>Yes</td>
              <td>Yes</td>
              <td>No</td>
            </tr>
            <tr>
              <th scope="row">Free tier, no card</th>
              <td className="is-us">Yes</td>
              <td>No</td>
              <td>No</td>
              <td>No</td>
              <td>No</td>
              <td>Trial</td>
              <td>No</td>
            </tr>
            <tr>
              <th scope="row">Agency / white-label</th>
              <td className="is-us">$499, 10 brands</td>
              <td>Enterprise</td>
              <td>Yes</td>
              <td>Yes</td>
              <td>Enterprise</td>
              <td>Per domain</td>
              <td>Per index</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Pricing comparison</h2>
      <div className="cmp-wrap">
        <table className="cmp">
          <thead>
            <tr>
              <th scope="col">Tool</th>
              <th scope="col">Entry</th>
              <th scope="col">Scaling up</th>
              <th scope="col">Worth knowing</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row" className="is-us">
                StayFound
              </th>
              <td className="num is-us">$0</td>
              <td className="num is-us">$29 → $149 → $499</td>
              <td>
                Free tier is 1 brand, 15 prompts, ChatGPT only. Priced in USD;
                billed in INR with GST at checkout.
              </td>
            </tr>
            <tr>
              <th scope="row">Profound</th>
              <td className="num">$99/mo</td>
              <td className="num">$399 → $499 → $2k–5k+</td>
              <td>
                Starter is ChatGPT-only, 50 prompts, and billed annually — a
                $1,188 commitment.{" "}
                <Src href={S.indexly}>[1]</Src> <Src href={S.tmb}>[2]</Src>
              </td>
            </tr>
            <tr>
              <th scope="row">Peec AI</th>
              <td className="num">€85–95/mo</td>
              <td className="num">to ~$495</td>
              <td>
                50 prompts, 1 project at Starter. Self-serve plans pick 3 engines
                from 7 at every tier; Claude is enterprise-only.{" "}
                <Src href={S.peec}>[3]</Src>
              </td>
            </tr>
            <tr>
              <th scope="row">Otterly.AI</th>
              <td className="num">$29/mo</td>
              <td className="num">$189 → $489</td>
              <td>
                Cheapest entry in the category, but engine add-ons can push the
                $189 plan past $300 before coverage is complete.{" "}
                <Src href={S.otterly}>[4]</Src>
              </td>
            </tr>
            <tr>
              <th scope="row">Scrunch</th>
              <td className="num">from $250/mo</td>
              <td className="num">Custom</td>
              <td>
                Acquired by Sitecore in June 2026. <Src href={S.stork}>[5]</Src>
              </td>
            </tr>
            <tr>
              <th scope="row">Semrush AI Toolkit</th>
              <td className="num">$99/mo</td>
              <td className="num">+$99 / +$60</td>
              <td>
                Per domain. A second AI seat is $99, another domain $99, 50 more
                prompts $60. <Src href={S.menra}>[6]</Src>
              </td>
            </tr>
            <tr>
              <th scope="row">Ahrefs Brand Radar</th>
              <td className="num">$199/mo</td>
              <td className="num">$699 + $129 base</td>
              <td>
                Priced per AI index. Requires an Ahrefs base plan, so realistic
                all-in is roughly $828–1,148/mo. <Src href={S.ahrefs}>[7]</Src>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="src-note">
        Competitor pricing verified August 2026 from public sources:{" "}
        <Src href={S.stork}>Stork.AI</Src>, <Src href={S.indexly}>Indexly</Src>,{" "}
        <Src href={S.tmb}>That Marketing Buddy</Src>,{" "}
        <Src href={S.peec}>Geoptie</Src>, <Src href={S.otterly}>Trakkr</Src>,{" "}
        <Src href={S.menra}>Menra</Src>, <Src href={S.ahrefs}>EWR Digital</Src>,{" "}
        <Src href={S.lens}>Industry Lens</Src>. Vendors change prices and several
        publish none officially, so third-party figures disagree — Profound in
        particular is reported at $99, $399 and $499 depending on the source and
        the plan being described. Treat these as directional and confirm with the
        vendor. StayFound’s own figures come from{" "}
        <Link href="/pricing">our pricing page</Link>.
      </p>

      <h2>What StayFound gives you that they don’t</h2>
      <ol>
        <li>
          <strong>You get the fix, not just the chart.</strong> Most of this
          category ends at a dashboard. We generate the artefact — the JSON-LD
          block, the{" "}
          <code>llms.txt</code>, the crawler allow-rules for GPTBot,
          OAI-SearchBot, PerplexityBot, ClaudeBot, Google-Extended and the rest.
          You paste it. A chart that tells you you’re losing isn’t a product.
        </li>
        <li>
          <strong>You’re told what to write, specifically.</strong> Not “publish
          more comparison content” — an actual title, the format that wins in
          your category, and the reason that piece gets cited when your current
          pages don’t. Hand it to a writer as-is.
        </li>
        <li>
          <strong>You can start at zero.</strong> A real free tier with no card,
          and a full AI-visibility report on your domain without creating an
          account at all. Everywhere else in this table, finding out costs money.
        </li>
        <li>
          <strong>$29 buys every engine.</strong> Elsewhere $29 buys a restricted
          set and full coverage is an add-on ladder. Solo covers ChatGPT, Gemini,
          Perplexity, Claude and Grok at the first paid tier.
        </li>
        <li>
          <strong>Metrics you can act on.</strong> Not a score in isolation:{" "}
          <em>share of voice</em> with your rank in the category,{" "}
          <em>engines mentioning you</em> out of the ones we ask, and{" "}
          <em>cited sources you own</em> against the ones you’re absent from.
          That last number is a to-do list, not a chart.
        </li>
        <li>
          <strong>Agency economics that work.</strong> $499 for 10 brands with
          white-label reports and API access pays for itself inside one client
          retainer.
        </li>
      </ol>

      <h2>What they do better than us</h2>
      <p>
        This section exists because we would want to read it. AI answers change
        fast, and a comparison table written by a vendor is worth exactly as much
        as the parts that cost the vendor something.
      </p>
      <ul>
        <li>
          <strong>Profound has more data.</strong> Higher prompt ceilings, deeper
          exports, and tooling built for a dedicated analyst. If AI search is a
          board-level number with a team behind it, that depth is worth the
          five-figure commitment and we will tell you so.
        </li>
        <li>
          <strong>Peec is more mature in the dashboard.</strong> The Looker
          Studio integration and the mention-versus-citation split are things we
          don’t match today.
        </li>
        <li>
          <strong>Semrush and Ahrefs are already in your stack.</strong> If your
          team lives in one of those, the switching cost of a standalone tool is
          real and often decisive.
        </li>
        <li>
          <strong>We are in private beta.</strong> StayFound is onboarding design
          partners through 2026. Our prompt volumes are lower than Profound’s and
          our enterprise controls are still being built. If you need a mature,
          fully self-serve platform this quarter, buy one of the above.
        </li>
      </ul>

      <h2>How to choose</h2>
      <ul>
        <li>
          <strong>You don’t yet know if you appear in AI answers.</strong> Start
          free. Run a report on your domain, prove there’s a problem, then decide
          what to spend.
        </li>
        <li>
          <strong>You know you have a problem and want it fixed.</strong> You
          need a tool that produces artefacts, not observations. That’s the gap
          we built into.
        </li>
        <li>
          <strong>AI search is a board-level number and you have analysts.</strong>{" "}
          Go to Profound, and use its prompt volume properly.
        </li>
      </ul>

      <h2>One last thing</h2>
      <p>
        StayFound’s own product tells customers that comparison pages, listicles
        and year-specific posts are the formats AI engines cite most. Until this
        post, we had published none of them. That was a fair thing to hold
        against us, so we fixed it.
      </p>
      <p>
        If you want to know what the engines say about you, that report is free
        and takes about two minutes.
      </p>
    </>
  );
}
