import Link from "next/link";
import { H2 } from "@/components/blog/heading";

function Src({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer nofollow">
      {children}
    </a>
  );
}

const S = {
  reditus: "https://getreditus.com/blog/how-to-get-cited-by-llms",
  goodie: "https://higoodie.com/blog/lllm-citation-strategy/",
  llmpulse: "https://llmpulse.ai/blog/how-to-get-cited-by-chatgpt/",
  apollo: "https://apollodigital.io/blog/get-cited-by-chatgpt/",
  semrush: "https://www.semrush.com/blog/chatgpt-topic-authority-study/",
};

export default function HowToGetCitedByChatGpt() {
  return (
    <>
      <div className="tldr">
        <p className="tldr-h">The short version</p>
        <ul>
          <li>
            <strong>You cannot fix this on your own website.</strong> In one
            analysis of 21,311 brand mentions, <strong>85%</strong> came from
            domains the brand didn’t own.
          </li>
          <li>
            Brands were roughly <strong>6.5× more likely</strong> to be surfaced
            through third-party sources than through their own site.
          </li>
          <li>
            The levers that are yours: schema (<strong>2.8×</strong> citation
            rate), freshness (<strong>3.2×</strong> within 30 days), and original
            data nobody else has.
          </li>
          <li>
            The levers that aren’t: Reddit, YouTube, Wikipedia, trade press, and
            the review directories in your category. Those take months, so start
            them first.
          </li>
        </ul>
      </div>

      <H2>The uncomfortable finding</H2>
      <p>
        Almost everything written about getting cited by ChatGPT is advice about
        your own website. Tidy your headings. Add an FAQ. Write in short,
        quotable sentences. All reasonable, all marginal — because that is mostly
        not where the model is looking.
      </p>
      <p>
        An analysis of <strong>21,311 brand mentions</strong> across ChatGPT,
        Claude and Perplexity found that <strong>85% of them originated on
        external domains</strong>, and that brands were about{" "}
        <strong>6.5× more likely</strong> to be mentioned via a third-party source
        than via anything they published themselves.{" "}
        <Src href={S.reditus}>[1]</Src>
      </p>
      <p>
        Read that as a budget instruction. If five-sixths of the mentions come
        from places you don’t control, then five-sixths of the effort belongs
        there too — and almost nobody allocates it that way, because on-site work
        is the part you can finish this week.
      </p>

      <H2>Where the answers actually come from</H2>
      <p>
        When an assistant is asked “what’s the best X for Y”, it reaches for
        sources that look like consensus rather than like marketing. In practice
        that means:
      </p>
      <ul>
        <li>
          <strong>Reddit and forums.</strong> Unpolished, opinionated, dense with
          real comparisons. Heavily represented in answers about tools and
          purchases.
        </li>
        <li>
          <strong>Review directories.</strong> G2, Capterra, AlternativeTo,
          Product Hunt, SaaSHub and the category-specific ones. Structured,
          comparative, and trivially parseable.
        </li>
        <li>
          <strong>Wikipedia and knowledge-graph entries.</strong> Wikidata,
          Crunchbase. These anchor whether you exist as an entity at all.
        </li>
        <li>
          <strong>Trade press and niche authorities.</strong> One paragraph in the
          publication your industry actually reads outperforms a year of your own
          blog.
        </li>
        <li>
          <strong>YouTube.</strong> Transcripts are text, and comparison videos
          are exactly the shape of a buying question.
        </li>
      </ul>
      <p>
        Note what these have in common: someone else wrote them. That is not an
        obstacle to route around, it is the mechanism. A model treats a third
        party describing you as evidence and treats you describing you as a claim.
      </p>

      <H2>What to do, in priority order</H2>
      <ol>
        <li>
          <strong>Get listed where your category gets compared.</strong> Claim the
          directory profiles that come up for your space, and make sure the
          description matches the language buyers use rather than your internal
          positioning. This is slow, unglamorous, and the highest-leverage work
          available.
        </li>
        <li>
          <strong>Be present in real discussions.</strong> Not astroturfing —
          answering questions in the places your buyers ask them, under a real
          name, including when the honest answer is that you’re not the right fit.
          Threads outlive campaigns.
        </li>
        <li>
          <strong>Publish original data.</strong> The single strongest citation
          magnet: if you publish a number that exists nowhere else, an engine that
          wants to use it has to attribute it. A survey of 200 customers is a
          citation asset for years.
        </li>
        <li>
          <strong>Add schema to the pages you want quoted.</strong> Pages carrying
          structured data see roughly <strong>2.8×</strong> the citation rate.
          Fully in your control, done in an afternoon.
        </li>
        <li>
          <strong>Refresh, don’t just publish.</strong> Content updated within the
          last 30 days gets around <strong>3.2× more citations</strong> than stale
          pages. Update the five pages that matter before writing a sixth.
        </li>
        <li>
          <strong>Let the crawlers in.</strong> Check your{" "}
          <code>robots.txt</code> actually permits GPTBot, OAI-SearchBot,
          PerplexityBot, ClaudeBot and Google-Extended. Blocking them is a common
          own-goal, usually inherited from a security-hardening ticket nobody
          revisited.
        </li>
      </ol>

      <H2>Think in topics, not keywords</H2>
      <p>
        A study of 50,000 brands in ChatGPT found visibility behaves as a{" "}
        <strong>topic-level</strong> property rather than a keyword-level one.{" "}
        <Src href={S.semrush}>[2]</Src> The question is not “do I rank for this
        phrase” but “when the assistant answers anything across the subject my
        business lives in, does my name keep coming up?”
      </p>
      <p>
        That changes what good coverage looks like. One page targeting one phrase
        is a keyword habit. A cluster of pages that between them cover the whole
        topic — definitions, comparisons, how-tos, the honest trade-offs — is what
        earns topic-level presence. That is also the structure that survives a
        model update, because it isn’t betting on one phrasing.
      </p>

      <H2>How to tell whether any of it worked</H2>
      <p>
        You cannot see this in Google Analytics. There is no impression to log and
        often no click to attribute, which is precisely why the funnel goes
        unmanaged.
      </p>
      <p>
        What you can do is ask the engines the questions your buyers ask, on a
        schedule, and record whether you were named, where in the answer, and
        which sources the answer leaned on. That last column is the actionable
        one — it is a list of pages to go get mentioned on.{" "}
        <Link href="/blog/how-to-measure-ai-visibility">
          The five numbers worth tracking
        </Link>{" "}
        goes through it properly.
      </p>
      <p className="src-note">
        Sources, verified August 2026: <Src href={S.reditus}>Reditus</Src> on the
        21,311-mention analysis, <Src href={S.semrush}>Semrush</Src> on
        topic-level authority across 50,000 brands,{" "}
        <Src href={S.goodie}>Goodie</Src>, <Src href={S.llmpulse}>LLM Pulse</Src>{" "}
        and <Src href={S.apollo}>Apollo Digital</Src> on citation strategy.
        Multipliers are the figures reported by those analyses; they describe
        correlations across sites, not a guarantee for yours.
      </p>

      <H2>One thing not to bother with first</H2>
      <p>
        Publishing an <code>llms.txt</code> is the current default advice, and it
        is much weaker than it sounds — Perplexity reads it, and no other major
        provider has confirmed they do. We wrote up{" "}
        <Link href="/blog/does-llms-txt-work-2026">
          the full evidence, including why we still generate one
        </Link>
        . Do it fifth, not first.
      </p>
    </>
  );
}
