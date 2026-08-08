// Maps 1:1 onto the Overview and Analytics tabs, so it doubles as product
// education. Deliberately contains no referral or click metric — the dashboard
// measures what assistants say and cite, never site traffic. See the comment at
// components/dashboard/analytics-panel.tsx.

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
  sanbi: "https://sanbi.ai/blog/how-to-measure-ai-visibility",
  hubspot: "https://blog.hubspot.com/marketing/ai-search-visibility",
  semrush: "https://www.semrush.com/blog/chatgpt-topic-authority-study/",
  pageone:
    "https://www.pageonepower.com/linkarati/how-to-measure-and-improve-your-brands-presence-in-chatgpt",
};

export default function HowToMeasureAiVisibility() {
  return (
    <>
      <div className="tldr">
        <p className="tldr-h">The short version</p>
        <ul>
          <li>
            Five numbers are enough: <strong>share of voice</strong>,{" "}
            <strong>citation rate</strong>, <strong>average position</strong>,{" "}
            <strong>answers lost</strong>, and <strong>sentiment</strong>.
          </li>
          <li>
            Measure per <strong>prompt</strong>, not per day. A daily average tells
            you the weather; the prompt tells you which deal you lost.
          </li>
          <li>
            None of these are website traffic. There is no impression to log and
            usually no click — if a tool reports “AI referrals” as clicks, ask
            precisely how it attributes them.
          </li>
          <li>
            Cadence that works: weekly prompt tracking, monthly trend review,
            quarterly benchmark against competitors.
          </li>
        </ul>
      </div>

      <H2>Why your analytics can’t see this</H2>
      <p>
        A buyer asks an assistant which tool they should use. Three names come
        back. Yours isn’t one of them. Nothing about that event reaches your
        analytics — no impression, no session, no bounce. The loss is invisible,
        which means it never gets a budget line or an owner.
      </p>
      <p>
        So measurement has to be active rather than passive. Instead of waiting for
        traffic to describe demand, you ask the engines the questions your buyers
        ask, on a schedule, and record what comes back. That is the whole method.
        Everything below is what to record.
      </p>

      <H2>The five numbers</H2>

      <h3>1. Share of voice</h3>
      <p>
        Of all the brand mentions across your tracked prompts, what fraction are
        you? If ten prompts return five names each, that’s fifty mentions — nine of
        them yours is 18% share of voice.
      </p>
      <p>
        This is the headline number because it is inherently competitive. Your
        score going up while a rival’s goes up faster is not a win, and an absolute
        score can’t tell you that. Pair it with your rank in the category and the
        multiple between you and the leader.
      </p>

      <h3>2. Citation rate</h3>
      <p>
        What share of answers link to you as a source? Distinct from being
        mentioned: an assistant can recommend you without citing you, and can cite
        you while recommending somebody else.
      </p>
      <p>
        Citation rate is the most actionable of the five, because the sources
        behind an answer are a literal to-do list of places to go get mentioned.
        Track which domains recur, and how many of them you appear on.
      </p>

      <h3>3. Average position</h3>
      <p>
        When you are named, where in the answer? First is not fourth. Buyers read
        generated answers top-down and the first name carries most of the intent,
        so presence alone hides the difference between leading a category and being
        the also-ran at the end of a list.
      </p>
      <p>
        Weight your score by position, or you will celebrate a scan where you moved
        from first to fourth in every answer.
      </p>

      <h3>4. Answers lost</h3>
      <p>
        The count of prompts where a competitor was named and you weren’t. This is
        the number to take to a board, because it is the closest thing in the set to
        countable missed revenue.
      </p>
      <p>
        It also localises the problem. Ten lost answers spread across ten topics is
        a brand-awareness issue; ten concentrated on one topic is a content gap you
        can close this month.
      </p>

      <h3>5. Sentiment</h3>
      <p>
        Being mentioned is not the same as being mentioned well. Engines summarise
        the tone of what they’ve read, so a brand can appear in every answer as the
        expensive option, the complicated one, or the one people leave.
      </p>
      <p>
        Track the tone, and track the themes behind it with quotes attached. The
        quote is the useful part: it tells you which review, thread or article
        taught the model to say that.
      </p>

      <H2>What not to measure</H2>
      <p>
        <strong>Clicks out of AI answers.</strong> Some assistants pass a referrer,
        many don’t, and a lot of the influence never produces a click at all — the
        buyer reads three names and searches for one directly a day later. Any
        number labelled “AI referrals” deserves a hard question about how it was
        attributed, including when it comes from us.
      </p>
      <p>
        <strong>A single blended score, on its own.</strong> One number going up is
        reassuring and directs no work. Keep the score for the trend line, and act
        on the five components.
      </p>
      <p>
        <strong>Anything measured once.</strong> Generated answers vary between
        runs. A single scan is an anecdote — you need the same prompts repeated on a
        schedule before a change means anything.
      </p>

      <H2>Measure per prompt, and think per topic</H2>
      <p>
        Record at the prompt level, because that is the resolution at which the
        outcome is decided and the only resolution at which a fix is obvious.
        “Visibility fell 4 points” starts an argument; “we lost{" "}
        <em>best X for small teams</em> to a rival who got written up on Reddit”
        starts work.
      </p>
      <p>
        But roll up to topics when you plan. A study of 50,000 brands in ChatGPT
        found visibility behaves as a topic-level property rather than a
        keyword-level one <Src href={S.semrush}>[1]</Src> — so a cluster of prompts
        covering one subject is the meaningful grouping, not any individual phrasing.
      </p>

      <H2>A cadence that survives contact with a real week</H2>
      <div className="cmp-wrap">
        <table className="cmp">
          <thead>
            <tr>
              <th scope="col">Rhythm</th>
              <th scope="col">What you look at</th>
              <th scope="col">Decision it drives</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Weekly</th>
              <td>Prompt-level movement, answers lost</td>
              <td>Which single gap to work on next</td>
            </tr>
            <tr>
              <th scope="row">Monthly</th>
              <td>Share of voice trend, citation rate, sentiment shift</td>
              <td>Whether last month’s work landed</td>
            </tr>
            <tr>
              <th scope="row">Quarterly</th>
              <td>Rank against the competitive set, topic coverage</td>
              <td>Where to point the content budget</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="src-note">
        Cadence and metric definitions cross-checked against public sources,
        August 2026: <Src href={S.sanbi}>Sanbi</Src>,{" "}
        <Src href={S.hubspot}>HubSpot</Src>,{" "}
        <Src href={S.pageone}>Page One Power</Src>, topic-level findings from{" "}
        <Src href={S.semrush}>Semrush</Src>.
      </p>

      <H2>How StayFound reports these</H2>
      <p>
        For transparency about what you’d actually see: the Overview tab shows a
        position-weighted score out of 100 with a plain-language verdict, your
        share of voice with rank in the category, how many engines mention you, and
        how many cited sources you own out of the total found. Competitors gives
        share-of-voice bars and the gap in percentage points to each rival.
        Citations lists the source domains with whether you’re on each one.
        Analytics covers tone and the themes behind it, with quotes.
      </p>
      <p>
        Deliberately absent: any click or referral figure. We measure what
        assistants say and cite, not traffic, and we’d rather the gap be stated
        than implied.
      </p>
      <p>
        If you want the numbers for your own domain without setting anything up,{" "}
        <Link href="/#report">we’ll run the report and email it</Link>. If you’d
        rather compare the tools first,{" "}
        <Link href="/blog/ai-visibility-tools-compared-2026">
          we priced the whole field
        </Link>{" "}
        — and if the terminology is still slippery,{" "}
        <Link href="/blog/geo-vs-aeo-vs-seo">GEO vs AEO vs SEO</Link> sorts it out.
      </p>
    </>
  );
}
