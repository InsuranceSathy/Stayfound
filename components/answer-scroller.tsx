"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Engine = { name: string; short: string; color: string };

const ENGINES: Engine[] = [
  { name: "ChatGPT", short: "GP", color: "#10a37f" },
  { name: "Gemini", short: "GE", color: "#4285f4" },
  { name: "Perplexity", short: "PP", color: "#22b8cf" },
  { name: "Claude", short: "CL", color: "#d97757" },
  { name: "Grok", short: "GR", color: "#cbd5e1" },
];

type Row = { name: string; val: number; d: string; up: boolean; you?: boolean };
type Dataset = { sort: string; unit: string; rows: Row[] };

/* left panel — what wins you answers */
const BY: Record<string, Dataset> = {
  Engine: {
    sort: "Answer share ↓",
    unit: "%",
    rows: [
      { name: "ChatGPT", val: 71, d: "+6.4", up: true },
      { name: "Perplexity", val: 64, d: "+3.1", up: true },
      { name: "Gemini", val: 48, d: "+1.2", up: true },
      { name: "Claude", val: 39, d: "-0.8", up: false },
      { name: "Grok", val: 22, d: "+0.4", up: true },
    ],
  },
  Prompt: {
    sort: "Answer share ↓",
    unit: "%",
    rows: [
      { name: "best pm software for startups", val: 88, d: "+9.0", up: true },
      { name: "notion alternative w/ roadmaps", val: 74, d: "+5.2", up: true },
      { name: "project tracker free tier", val: 57, d: "+1.4", up: true },
      { name: "cheapest async standup tool", val: 31, d: "-2.1", up: false },
      { name: "tools for remote teams 2026", val: 12, d: "-3.6", up: false },
    ],
  },
  Page: {
    sort: "Citations ↓",
    unit: "",
    rows: [
      { name: "/pricing", val: 34, d: "+7", up: true },
      { name: "/docs/getting-started", val: 21, d: "+4", up: true },
      { name: "/blog/vs-asana", val: 18, d: "+6", up: true },
      { name: "/changelog", val: 9, d: "0.0", up: true },
      { name: "/integrations", val: 5, d: "-1", up: false },
    ],
  },
};

/* right panel — who you're up against */
const VS: Record<string, Dataset> = {
  Competitor: {
    sort: "Share of voice ↓",
    unit: "%",
    rows: [
      { name: "Your brand", val: 61.5, d: "+4.2", up: true, you: true },
      { name: "Notion", val: 46.3, d: "+0.6", up: true },
      { name: "Asana", val: 45.1, d: "-0.6", up: false },
      { name: "Linear", val: 31.8, d: "+3.8", up: true },
      { name: "Monday", val: 22.6, d: "0.0", up: true },
    ],
  },
  Category: {
    sort: "Answer share ↓",
    unit: "%",
    rows: [
      { name: "project management", val: 61.5, d: "+4.2", up: true, you: true },
      { name: "async standups", val: 44.0, d: "+2.6", up: true },
      { name: "roadmap tools", val: 38.2, d: "+5.1", up: true },
      { name: "docs + wiki", val: 19.4, d: "-1.2", up: false },
      { name: "time tracking", val: 8.1, d: "-0.4", up: false },
    ],
  },
  Source: {
    sort: "Citations ↓",
    unit: "",
    rows: [
      { name: "yoursite.com/pricing", val: 34, d: "+7", up: true, you: true },
      { name: "g2.com", val: 28, d: "+2", up: true },
      { name: "reddit.com", val: 21, d: "+5", up: true },
      { name: "capterra.com", val: 17, d: "-1", up: false },
      { name: "producthunt.com", val: 11, d: "+1", up: true },
    ],
  },
};

type Answer = {
  engine: string;
  rank: string;
  tone: "good" | "bad" | "";
  hit: boolean;
  body: React.ReactNode;
  cites: { d: string; you?: boolean }[];
};

type PromptSet = {
  q: string;
  answers: Answer[];
  /* every brand the four answers named, most-named first */
  rivals: { name: string; n: number; you?: boolean }[];
  /* answer share for this prompt, one point per week */
  trend: number[];
};

/* one answer set per tracked prompt — the chips switch between them */
const PROMPT_SETS: PromptSet[] = [
  {
    q: "best pm software for startups",
    answers: [
      {
        engine: "ChatGPT",
        rank: "Ranked #1",
        tone: "good",
        hit: true,
        body: (
          <>
            For teams that need docs and roadmaps together,{" "}
            <mark>your brand</mark> is usually the first pick.
          </>
        ),
        cites: [{ d: "yoursite.com/pricing", you: true }, { d: "g2.com" }],
      },
      {
        engine: "Perplexity",
        rank: "Ranked #2",
        tone: "good",
        hit: true,
        body: (
          <>
            Top options include Notion and <mark>your brand</mark>, rated highest
            for onboarding speed.
          </>
        ),
        cites: [{ d: "yoursite.com/docs", you: true }, { d: "capterra.com" }],
      },
      {
        engine: "Gemini",
        rank: "Not mentioned",
        tone: "bad",
        hit: false,
        body: (
          <>
            Popular choices are Asana, Notion and Linear, each with strong
            integrations.
          </>
        ),
        cites: [{ d: "asana.com" }, { d: "techradar.com" }],
      },
      {
        engine: "Claude",
        rank: "Ranked #4",
        tone: "",
        hit: true,
        body: (
          <>
            Asana and Notion lead; <mark>your brand</mark> suits smaller product
            teams.
          </>
        ),
        cites: [{ d: "yoursite.com/blog", you: true }, { d: "producthunt.com" }],
      },
    ],
    rivals: [
      { name: "Your brand", n: 3, you: true },
      { name: "Notion", n: 3 },
      { name: "Asana", n: 2 },
      { name: "Linear", n: 1 },
    ],
    trend: [41, 44, 43, 49, 55, 58, 63, 71],
  },
  {
    q: "notion alternative w/ roadmaps",
    answers: [
      {
        engine: "ChatGPT",
        rank: "Ranked #2",
        tone: "good",
        hit: true,
        body: (
          <>
            Linear and <mark>your brand</mark> both add real roadmaps on top of
            Notion-style docs.
          </>
        ),
        cites: [{ d: "yoursite.com/blog", you: true }, { d: "reddit.com" }],
      },
      {
        engine: "Perplexity",
        rank: "Ranked #1",
        tone: "good",
        hit: true,
        body: (
          <>
            <mark>Your brand</mark> is the closest drop-in replacement, with
            import from Notion built in.
          </>
        ),
        cites: [{ d: "yoursite.com/docs", you: true }, { d: "g2.com" }],
      },
      {
        engine: "Gemini",
        rank: "Ranked #5",
        tone: "",
        hit: true,
        body: (
          <>
            Consider Coda, Linear, Asana, ClickUp, or <mark>your brand</mark> for
            smaller teams.
          </>
        ),
        cites: [{ d: "coda.io" }, { d: "zapier.com" }],
      },
      {
        engine: "Claude",
        rank: "Not mentioned",
        tone: "bad",
        hit: false,
        body: <>Coda and Linear are the usual recommendations here.</>,
        cites: [{ d: "linear.app" }, { d: "coda.io" }],
      },
    ],
    rivals: [
      { name: "Your brand", n: 3, you: true },
      { name: "Linear", n: 3 },
      { name: "Coda", n: 3 },
      { name: "ClickUp", n: 1 },
    ],
    trend: [52, 50, 55, 54, 61, 66, 70, 74],
  },
  {
    q: "tools for remote teams 2026",
    answers: [
      {
        engine: "ChatGPT",
        rank: "Not mentioned",
        tone: "bad",
        hit: false,
        body: <>Slack, Notion and Asana anchor most remote stacks this year.</>,
        cites: [{ d: "slack.com" }, { d: "zapier.com" }],
      },
      {
        engine: "Perplexity",
        rank: "Ranked #6",
        tone: "",
        hit: true,
        body: (
          <>
            A long list, with <mark>your brand</mark> near the bottom for async
            updates.
          </>
        ),
        cites: [{ d: "reddit.com" }, { d: "yoursite.com/blog", you: true }],
      },
      {
        engine: "Gemini",
        rank: "Not mentioned",
        tone: "bad",
        hit: false,
        body: <>Notion, Asana and Monday dominate the round-ups it cites.</>,
        cites: [{ d: "techradar.com" }, { d: "monday.com" }],
      },
      {
        engine: "Claude",
        rank: "Not mentioned",
        tone: "bad",
        hit: false,
        body: <>It names Slack, Linear and Notion, with no mention of you.</>,
        cites: [{ d: "linear.app" }, { d: "notion.so" }],
      },
    ],
    rivals: [
      { name: "Notion", n: 4 },
      { name: "Slack", n: 2 },
      { name: "Asana", n: 2 },
      { name: "Your brand", n: 1, you: true },
    ],
    trend: [34, 30, 28, 25, 22, 19, 15, 12],
  },
];

type Prompt = {
  q: string;
  rank: string;
  seen: boolean;
  mv: string;
  sources: { d: string; n: number; you?: boolean }[];
};

const PROMPTS: Prompt[] = [
  {
    q: "best project management software for startups",
    rank: "#1",
    seen: true,
    mv: "+3",
    sources: [
      { d: "yoursite.com/pricing", n: 34, you: true },
      { d: "g2.com", n: 28 },
      { d: "reddit.com/r/productivity", n: 21 },
      { d: "capterra.com", n: 17 },
    ],
  },
  {
    q: "notion alternative with roadmaps",
    rank: "#2",
    seen: true,
    mv: "+5",
    sources: [
      { d: "yoursite.com/docs", n: 26, you: true },
      { d: "reddit.com/r/notion", n: 19 },
      { d: "g2.com", n: 14 },
      { d: "coda.io", n: 8 },
    ],
  },
  {
    q: "cheapest tool for async standups",
    rank: "#4",
    seen: true,
    mv: "0",
    sources: [
      { d: "producthunt.com", n: 22 },
      { d: "yoursite.com/pricing", n: 12, you: true },
      { d: "monday.com", n: 11 },
      { d: "techradar.com", n: 6 },
    ],
  },
  {
    q: "asana vs linear for small teams",
    rank: "—",
    seen: false,
    mv: "-2",
    sources: [
      { d: "asana.com", n: 31 },
      { d: "linear.app", n: 27 },
      { d: "g2.com", n: 15 },
      { d: "reddit.com", n: 9 },
    ],
  },
  {
    q: "project tracker with free tier",
    rank: "#3",
    seen: true,
    mv: "+1",
    sources: [
      { d: "yoursite.com/pricing", n: 18, you: true },
      { d: "capterra.com", n: 16 },
      { d: "zapier.com", n: 7 },
      { d: "producthunt.com", n: 5 },
    ],
  },
  {
    q: "tools for remote product teams 2026",
    rank: "—",
    seen: false,
    mv: "-1",
    sources: [
      { d: "techradar.com", n: 24 },
      { d: "notion.so", n: 20 },
      { d: "slack.com", n: 12 },
      { d: "monday.com", n: 8 },
    ],
  },
];

const FIXES = [
  {
    t: "Publish a Gemini-shaped comparison page",
    d: "Gemini cites listicles for this category and never sees you. One structured comparison page closes the gap.",
    lift: "+9.1 pts",
  },
  {
    t: "Claim the G2 category profile",
    d: "G2 is cited in 28 of the answers you lose. Your profile is incomplete on 4 of 9 fields.",
    lift: "+5.4 pts",
  },
  {
    t: "Add pricing schema to /pricing",
    d: "Answers that quote a price cite you 2.3× more often. Machine-readable pricing makes you quotable.",
    lift: "+3.8 pts",
  },
];

const CAPTIONS = [
  <>
    Every buyer question, asked to all five engines — <b>continuously</b>.
  </>,
  <>
    The <b>exact wording</b> each assistant uses — and who it names instead.
  </>,
  <>
    <b>Prompt-level data</b>: where you rank, and which sources built the answer.
  </>,
  <>
    The <b>highest-leverage fix</b>, with the lift it should earn you.
  </>,
];

const STEPS = ["Overview", "Answers", "Prompts", "Fixes"];

/** matches `.story-sticky { top }` in globals.css */
const STICKY_TOP = 24;

export function AnswerScroller() {
  const spacerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let raf = 0;
    function measure() {
      const spacer = spacerRef.current;
      const sticky = stickyRef.current;
      if (!spacer || !sticky) return;
      const rect = spacer.getBoundingClientRect();
      const travel = rect.height - sticky.offsetHeight;
      if (travel <= 0) return;
      const p = Math.min(1, Math.max(0, (STICKY_TOP - rect.top) / travel));
      const next = Math.min(STEPS.length - 1, Math.floor(p * STEPS.length));
      setIndex((cur) => (cur === next ? cur : next));
    }
    function onScroll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    }
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const jumpTo = useCallback((i: number) => {
    const spacer = spacerRef.current;
    const sticky = stickyRef.current;
    if (!spacer || !sticky) return;
    const travel = spacer.offsetHeight - sticky.offsetHeight;
    const top =
      spacer.getBoundingClientRect().top +
      window.scrollY -
      STICKY_TOP +
      travel * ((i + 0.5) / STEPS.length);
    window.scrollTo({ top, behavior: "smooth" });
  }, []);

  return (
    <section id="inside" className="story">
      <div className="wrap">
        <div className="story-intro">
          <p className="sec-eyebrow">Inside the product</p>
          <h2 className="sec-title" style={{ maxWidth: "none", margin: "0 auto 14px" }}>
            One question. <span className="grad-text">Five answers.</span>
          </h2>
          <p className="sec-sub" style={{ margin: "0 auto" }}>
            Scroll to walk through a real StayFound report — or click into any
            panel below and explore it yourself.
          </p>
        </div>
      </div>

      <div className="wrap">
        <div className="story-spacer" ref={spacerRef}>
          <div className="story-sticky" ref={stickyRef}>
            <div className="browser">
              <div className="browser-bar">
                <div className="lights">
                  <i />
                  <i />
                  <i />
                </div>
                <div className="browser-url">
                  stayfound.ai/<b>acme.com</b>
                </div>
                <svg
                  className="browser-exp"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                </svg>
              </div>

              <div className="story-frame">
                <div className="story-viewport">
                  <div
                    className="story-track"
                    style={{
                      // % on translateY resolves against the TRACK's own height
                      // (all 4 slides), not one slide — so divide by the count.
                      transform: `translateY(-${(index * 100) / STEPS.length}%)`,
                    }}
                  >
                    <Overview on={index === 0} />
                    <Answers on={index === 1} />
                    <Prompts on={index === 2} />
                    <Fixes on={index === 3} />
                  </div>
                </div>
                <div className="story-scrollbar" aria-hidden="true">
                  <div
                    className="story-thumb"
                    style={{
                      height: `${100 / STEPS.length}%`,
                      transform: `translateY(${index * 100}%)`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="story-steps">
              {STEPS.map((s, i) => (
                <button
                  key={s}
                  className={`story-step ${i === index ? "on" : ""}`}
                  onClick={() => jumpTo(i)}
                  aria-current={i === index}
                >
                  <span className="sn">0{i + 1}</span>
                  {s}
                </button>
              ))}
            </div>
            <p className="story-cap">{CAPTIONS[index]}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- shared ---------------- */

function BarPanel({
  sets,
  tab,
  onTab,
  on,
  tint,
}: {
  sets: Record<string, Dataset>;
  tab: string;
  onTab: (t: string) => void;
  on: boolean;
  tint?: "blue";
}) {
  const data = sets[tab];
  const max = Math.max(...data.rows.map((r) => r.val));
  const ranked = tab === "Competitor";

  return (
    <div className="card flex1">
      <div className="panel-tabs">
        <span className="ptabs">
          {Object.keys(sets).map((k) => (
            <button
              key={k}
              type="button"
              className={k === tab ? "on" : ""}
              onClick={() => onTab(k)}
              aria-pressed={k === tab}
            >
              {k}
            </button>
          ))}
        </span>
        <span className="sort-l">{data.sort}</span>
      </div>
      <div className={`hbars ${tint ?? ""}`}>
        {data.rows.map((r, i) => (
          <div className={`hbar ${r.you ? "you" : ""}`} key={r.name}>
            <span
              className="hbar-fill"
              style={{ width: on ? `${(r.val / max) * 100}%` : "3%" }}
            />
            {ranked && <span className="hbar-n">{i + 1}</span>}
            <span className="hbar-name">
              {r.name}
              {r.you && <span className="badge-you">You</span>}
            </span>
            <span
              className="hbar-d"
              style={{
                color:
                  r.d === "0.0" || r.d === "0"
                    ? "var(--muted-2)"
                    : r.up
                      ? "var(--good)"
                      : "var(--bad)",
              }}
            >
              {r.d === "0.0" || r.d === "0" ? "–" : r.d}
            </span>
            <span className="hbar-val">
              {r.val}
              {data.unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- slides ---------------- */

function Overview({ on }: { on: boolean }) {
  const [left, setLeft] = useState("Engine");
  const [right, setRight] = useState("Competitor");

  const kpis = [
    { l: "Answer share", v: "61.5%", d: "↑ 4.2", grad: true },
    { l: "Prompts tracked", v: "42", d: "12 categories" },
    { l: "Mentions", v: "29/42", d: "↑ 3 this week" },
    { l: "Citations won", v: "118", d: "↑ 22" },
    { l: "Sentiment", v: "4.6", d: "of 5.0" },
    { l: "Engines live", v: "5", d: "checked hourly" },
  ];

  return (
    <div className="story-slide">
      <div className="kpis">
        {kpis.map((k) => (
          <div className="kpi" key={k.l}>
            <p className="kpi-l">{k.l}</p>
            <div className={`kpi-v ${k.grad ? "grad" : ""}`}>{k.v}</div>
            <div
              className="kpi-d"
              style={{ color: k.d.startsWith("↑") ? "var(--good)" : "var(--muted-2)" }}
            >
              {k.d}
            </div>
          </div>
        ))}
      </div>

      <div className="split">
        <BarPanel sets={BY} tab={left} onTab={setLeft} on={on} />
        <BarPanel sets={VS} tab={right} onTab={setRight} on={on} tint="blue" />
      </div>
    </div>
  );
}

function Answers({ on }: { on: boolean }) {
  const [sel, setSel] = useState(0);
  const set = PROMPT_SETS[sel];
  const hitCount = set.answers.filter((a) => a.hit).length;

  return (
    <div className="story-slide">
      <div className="slide-h">
        <h3>Ask any tracked prompt</h3>
        <span className="ans-score">
          <span className="ans-score-v">
            {hitCount}/{set.answers.length}
          </span>
          engines name you
        </span>
      </div>
      <div className="chips-row">
        <div className="chips">
          {PROMPT_SETS.map((p, i) => (
            <button
              key={p.q}
              type="button"
              className={`chip ${i === sel ? "on" : ""}`}
              onClick={() => setSel(i)}
              aria-pressed={i === sel}
            >
              {p.q}
            </button>
          ))}
        </div>
        <span className="hint">refreshed 2h ago</span>
      </div>
      <div className="answers">
        {set.answers.map((a) => {
          const eng = ENGINES.find((x) => x.name === a.engine)!;
          const share = BY.Engine.rows.find((r) => r.name === a.engine)!;
          return (
            <div
              className={`ans ${a.hit ? "hit" : ""}`}
              key={a.engine}
              style={
                {
                  opacity: on ? 1 : 0.25,
                  transition: "opacity .5s ease",
                  "--eng": eng.color,
                } as React.CSSProperties
              }
            >
              <div className="ans-top">
                <span className="glyph" style={{ background: eng.color }}>
                  {eng.short}
                </span>
                <span className="ans-name" style={{ color: eng.color }}>
                  {a.engine}
                </span>
                <span className={`ans-rank ${a.tone}`}>
                  <i className={`ans-dot ${a.tone}`} aria-hidden="true" />
                  {a.rank}
                </span>
              </div>
              <p className="ans-body">{a.body}</p>
              <div className="ans-share">
                <span className="ans-share-l">Overall answer share</span>
                <span className="ans-share-track">
                  <span
                    className="ans-share-fill"
                    style={{ width: on ? `${share.val}%` : "0%" }}
                  />
                </span>
                <span className="ans-share-v">{share.val}%</span>
              </div>
              <div className="ans-cites">
                {a.cites.map((c) => (
                  <span className={`cite ${c.you ? "you" : ""}`} key={c.d}>
                    {c.d}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="ans-foot">
        <div className="card ans-foot-card">
          <div className="slide-h" style={{ marginBottom: 12 }}>
            <h3>Who else got named</h3>
            <span className="hint">across these 4 answers</span>
          </div>
          <div className="rivals">
            {set.rivals.map((r) => (
              <div className={`rival ${r.you ? "you" : ""}`} key={r.name}>
                <span className="rival-name">{r.name}</span>
                <span className="rival-track">
                  <span
                    className="rival-fill"
                    style={{ width: on ? `${(r.n / 4) * 100}%` : "0%" }}
                  />
                </span>
                <span className="rival-n">{r.n}/4</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card ans-foot-card">
          <div className="slide-h" style={{ marginBottom: 12 }}>
            <h3>Answer share</h3>
            <span className="hint">last 8 weeks</span>
          </div>
          <Spark points={set.trend} on={on} />
        </div>
      </div>
    </div>
  );
}

/* inline sparkline — no chart lib, just a path over a normalised series */
function Spark({ points, on }: { points: number[]; on: boolean }) {
  const W = 260;
  const H = 64;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const xy = points.map((p, i) => [
    (i / (points.length - 1)) * W,
    H - ((p - min) / span) * (H - 8) - 4,
  ]);
  const line = xy.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");
  const area = `${line} L${W} ${H} L0 ${H} Z`;
  const last = points[points.length - 1];
  const first = points[0];
  const up = last >= first;
  const [cx, cy] = xy[xy.length - 1];

  return (
    <div className="spark-wrap">
      <svg
        className="spark"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor={up ? "#34d399" : "#fb7185"}
              stopOpacity="0.28"
            />
            <stop
              offset="100%"
              stopColor={up ? "#34d399" : "#fb7185"}
              stopOpacity="0"
            />
          </linearGradient>
        </defs>
        <path
          d={area}
          fill="url(#sparkFill)"
          className={`spark-area ${on ? "on" : ""}`}
        />
        <path
          d={line}
          fill="none"
          stroke={up ? "#34d399" : "#fb7185"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          vectorEffect="non-scaling-stroke"
          className={`spark-line ${on ? "on" : ""}`}
        />
        <circle cx={cx} cy={cy} r="3.5" fill={up ? "#34d399" : "#fb7185"} />
      </svg>
      <div className="spark-meta">
        <span className="spark-v">{last}%</span>
        <span
          className="spark-d"
          style={{ color: up ? "var(--good)" : "var(--bad)" }}
        >
          {up ? "↑" : "↓"} {Math.abs(last - first)} pts
        </span>
      </div>
    </div>
  );
}

function Prompts({ on }: { on: boolean }) {
  const [sel, setSel] = useState(0);
  const prompt = PROMPTS[sel];

  return (
    <div className="story-slide">
      <div className="split">
        <div className="card flex1 ptable">
          <div className="slide-h" style={{ marginBottom: 12 }}>
            <h3>Tracked prompts</h3>
            <span className="hint">42 total · pick one</span>
          </div>
          <div className="ph">
            <span>Prompt</span>
            <span>Your rank</span>
            <span>Mentioned</span>
            <span>7d</span>
          </div>
          {PROMPTS.map((p, i) => (
            <button
              type="button"
              className={`pr ${i === sel ? "on" : ""}`}
              key={p.q}
              onClick={() => setSel(i)}
              aria-pressed={i === sel}
            >
              <span className="pq">{p.q}</span>
              <span className="pv">{p.rank}</span>
              <span className={p.seen ? "chip-yes" : "chip-no"}>
                {p.seen ? "yes" : "no"}
              </span>
              <span
                className="pv"
                style={{
                  color: p.mv.startsWith("+")
                    ? "var(--good)"
                    : p.mv.startsWith("-")
                      ? "var(--bad)"
                      : "var(--muted-2)",
                }}
              >
                {p.mv}
              </span>
            </button>
          ))}
        </div>

        <div className="card flex1">
          <div className="slide-h">
            <h3>Sources behind it</h3>
          </div>
          <p className="check-note" style={{ margin: "6px 0 4px" }}>
            {prompt.q}
          </p>
          <div style={{ marginTop: 8 }}>
            {prompt.sources.map((s) => (
              <div className="src" key={s.d}>
                <span className={`fav ${s.you ? "own" : ""}`}>
                  {s.d[0].toUpperCase()}
                </span>
                <span
                  className="sd"
                  style={{ color: s.you ? "var(--accent)" : undefined }}
                >
                  {s.d}
                </span>
                <span className="sc">{on ? s.n : 0} cites</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Fixes({ on }: { on: boolean }) {
  return (
    <div className="story-slide">
      <div className="slide-h">
        <h3>Recommended moves</h3>
        <span className="hint">ranked by projected lift</span>
      </div>
      <div className="card flex1">
        {FIXES.map((f) => (
          <div className="fix" key={f.t}>
            <span className="lift">{f.lift}</span>
            <div>
              <h4>{f.t}</h4>
              <p>{f.d}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="slide-h" style={{ marginBottom: 14 }}>
          <h3>Projected answer share</h3>
          <span className="hint">if all three ship</span>
        </div>
        <div className="hbars">
          <div className="hbar">
            <span
              className="hbar-fill"
              style={{
                width: on ? "61.5%" : "3%",
                background: "rgba(255,255,255,0.14)",
                borderLeftColor: "rgba(255,255,255,0.4)",
              }}
            />
            <span className="hbar-name">Today</span>
            <span className="hbar-val">61.5%</span>
          </div>
          <div className="hbar you">
            <span
              className="hbar-fill"
              style={{ width: on ? "79.8%" : "3%" }}
            />
            <span className="hbar-name">In 60 days</span>
            <span className="hbar-val">79.8%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
