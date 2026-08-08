// The honest post. StayFound generates llms.txt as a recommended fix in
// lib/snippets.ts, and the evidence for it is much weaker than the discourse
// around it. Publishing this costs us a talking point and buys the only thing
// that matters in a category this young, which is being believed.

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
  llmtxtInfo: "https://llmtxt.info/does-chatgpt-use-llms-txt/",
  aeoengine: "https://aeoengine.ai/blog/llms-txt-zero-usage-ai-bots-ignore",
  weoptimizz: "https://www.we-optimizz.com/post/stop-adding-llms-txt",
  rioja:
    "https://alejandrorioja.com/llms-txt-explained-what-it-is-and-whether-it-actually-moves-citations/",
  mueller: "https://www.webyes.com/blogs/does-llms-txt-improve-rankings/",
  reditus: "https://getreditus.com/blog/how-to-get-cited-by-llms",
};

export default function DoesLlmsTxtWork2026() {
  return (
    <>
      <div className="tldr">
        <p className="tldr-h">The short version</p>
        <ul>
          <li>
            <strong>Perplexity reads it.</strong> PerplexityBot parses{" "}
            <code>llms.txt</code> when it indexes a site, and its engineering
            team has referenced the spec publicly.
          </li>
          <li>
            <strong>Nobody else has confirmed they do.</strong> OpenAI, Anthropic
            and Google have never stated that their crawlers parse it, and no
            provider documents it as a citation signal.
          </li>
          <li>
            StayFound still generates one, because it costs nothing and Perplexity
            is real traffic. We’d rather say that plainly than imply more.
          </li>
          <li>
            If you only have time for one thing this week, it is not this file. It
            is{" "}
            <Link href="/blog/how-to-get-cited-by-chatgpt">
              getting mentioned on the sources engines already trust
            </Link>
            .
          </li>
        </ul>
      </div>

      <H2>Why we are writing this against ourselves</H2>
      <p>
        StayFound generates an <code>llms.txt</code> for you. It sits in the
        Actions tab next to the schema block and the crawler rules, as a
        paste-ready artefact. Our own comparison post listed it as part of what
        you get.
      </p>
      <p>
        Then we went looking for evidence that it works, and the evidence is much
        thinner than the volume of advice telling you to publish one. So here is
        what we actually found, including the part that makes our own feature look
        smaller.
      </p>

      <H2>What llms.txt is supposed to do</H2>
      <p>
        <code>llms.txt</code> is a proposed convention: a markdown file at the
        root of your domain that gives language models a clean, curated map of
        your site — what you do, which pages matter, where the documentation
        lives. The pitch is that instead of a model guessing its way through your
        marketing nav, you hand it the summary.
      </p>
      <p>
        It is a genuinely good idea. <code>robots.txt</code> and{" "}
        <code>sitemap.xml</code> both started as conventions before anyone
        honoured them. The question is not whether the idea is sound. It is
        whether anything reads the file today.
      </p>

      <H2>Who actually reads it</H2>
      <div className="cmp-wrap">
        <table className="cmp">
          <thead>
            <tr>
              <th scope="col">Engine</th>
              <th scope="col">Reads llms.txt?</th>
              <th scope="col">Basis</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Perplexity</th>
              <td>Yes</td>
              <td>
                PerplexityBot parses it at index time; the spec has been
                referenced publicly by their engineers.{" "}
                <Src href={S.rioja}>[1]</Src>
              </td>
            </tr>
            <tr>
              <th scope="row">ChatGPT / OpenAI</th>
              <td>Not confirmed</td>
              <td>
                No OpenAI statement that GPTBot or OAI-SearchBot parse it or
                treat it as a special input. <Src href={S.llmtxtInfo}>[2]</Src>
              </td>
            </tr>
            <tr>
              <th scope="row">Claude / Anthropic</th>
              <td>Not confirmed</td>
              <td>
                No published commitment that the file is read at crawl or
                inference time. <Src href={S.aeoengine}>[3]</Src>
              </td>
            </tr>
            <tr>
              <th scope="row">Gemini / Google</th>
              <td>Not confirmed</td>
              <td>
                Google has been publicly non-committal; it is not documented as a
                ranking or citation input. <Src href={S.mueller}>[4]</Src>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="src-note">
        Verified August 2026 from public sources:{" "}
        <Src href={S.rioja}>Alejandro Rioja</Src>,{" "}
        <Src href={S.llmtxtInfo}>llmtxt.info</Src>,{" "}
        <Src href={S.aeoengine}>AEO Engine</Src>,{" "}
        <Src href={S.mueller}>Webyes on Mueller’s comments</Src>,{" "}
        <Src href={S.weoptimizz}>We-Optimizz</Src>. “Not confirmed” means exactly
        that — an absence of any public commitment, not proof of absence. These
        are fast-moving products and any of them could start honouring the spec
        without announcing it.
      </p>

      <H2>The distinction that gets lost</H2>
      <p>
        Most arguments about this file are really two arguments wearing one coat.
      </p>
      <ul>
        <li>
          <strong>Crawl time.</strong> Does the bot fetch <code>llms.txt</code>{" "}
          while indexing? For Perplexity, yes. For the others, there is no
          evidence it is treated differently from any other file.
        </li>
        <li>
          <strong>Inference time.</strong> When an assistant answers a live
          question, does it load your <code>llms.txt</code> first to orient
          itself? No provider has claimed this, and it would be a strange design.
          The model retrieves and reads pages relevant to the question.
        </li>
      </ul>
      <p>
        Advice that promises the second thing is overselling. The first thing is
        real, narrow, and worth having if Perplexity matters to you.
      </p>

      <H2>So why do we still ship one?</H2>
      <p>Three honest reasons, none of them dramatic:</p>
      <ol>
        <li>
          <strong>Perplexity is not a rounding error.</strong> It is one of the
          five engines we track, and it demonstrably reads the file. That alone
          justifies twenty minutes of work.
        </li>
        <li>
          <strong>The cost is close to zero and the risk is zero.</strong> It is a
          static markdown file. It cannot slow your site, leak anything, or
          confuse a search engine that ignores it.
        </li>
        <li>
          <strong>Conventions get adopted.</strong> If OpenAI or Anthropic start
          honouring it, the sites that already have one are done. That is a cheap
          option to hold, as long as nobody has told you it is a strategy.
        </li>
      </ol>
      <p>
        What we will not do is put it at the top of your action list. In the
        product it now sits below the schema block and the third-party listings,
        which is where the evidence puts it.
      </p>

      <H2>What to do instead, in order</H2>
      <ol>
        <li>
          <strong>Get mentioned off your own domain.</strong> One analysis of
          21,311 brand mentions across ChatGPT, Claude and Perplexity found{" "}
          <strong>85% came from external domains</strong>, with brands roughly{" "}
          <strong>6.5× more likely</strong> to be surfaced through third-party
          sources than their own site. <Src href={S.reditus}>[5]</Src> This is the
          whole game, and it is the thing least under your direct control — which
          is exactly why it is worth starting now.
        </li>
        <li>
          <strong>Add schema to the pages you want quoted.</strong> Pages carrying
          structured data see around <strong>2.8× the citation rate</strong>. This
          one is fully in your control and takes an afternoon.
        </li>
        <li>
          <strong>Keep the page fresh.</strong> Content updated within 30 days
          gets roughly <strong>3.2× more citations</strong> than stale pages. A
          quarterly refresh of your best pages beats a new one nobody finds.
        </li>
        <li>
          <strong>Publish a number that exists nowhere else.</strong> Original
          data is the strongest citation magnet there is: if an engine wants to
          use your figure, it has to name you.
        </li>
        <li>
          <strong>Then write the llms.txt.</strong> Fifth. Not first.
        </li>
      </ol>

      <H2>The honest summary</H2>
      <p>
        <code>llms.txt</code> is a reasonable file to have and a bad thing to
        believe in. It buys you something concrete with Perplexity and an option
        on everyone else. It does not get you into ChatGPT’s answers, and any tool
        — including ours — that lets you think otherwise is selling you the easy
        version of a hard problem.
      </p>
      <p>
        If you want to know which sources are actually feeding the answers about
        your category,{" "}
        <Link href="/blog/how-to-measure-ai-visibility">
          that is measurable
        </Link>
        , and it is a better place to spend the afternoon.
      </p>
    </>
  );
}
