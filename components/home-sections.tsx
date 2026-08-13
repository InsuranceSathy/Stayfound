"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Reveal,
  useCountUp,
} from "@/components/nf-shared";

/**
 * The homepage sections under the hero, in the NF drawing-sheet system:
 * one continuous ruled shell, figure chips sitting on the rules, artifacts
 * annotated in the gutter like a proof. Ported from the approved /design lab.
 */

/* ---- 1. specimen: what it says today ------------------------------------ */

function Specimen() {
  return (
    <Reveal className="ns2-sec ns2-specimen">
      <header className="ns2-hd">
        <span className="ns2-fig">fig. 02</span>
        <h2 className="ns2-h2">
          The answer names three brands. <span>There is no page two.</span>
        </h2>
      </header>

      <div className="ns2-proof">
        <dl className="ns2-gutter">
          <div>
            <dt>engine</dt>
            <dd>ChatGPT</dd>
          </div>
          <div>
            <dt>prompt</dt>
            <dd>“best tool for a small team”</dd>
          </div>
          <div>
            <dt>asked</dt>
            <dd>today, 09:14</dd>
          </div>
          <div className="ns2-gutter-verdict">
            <dt>you</dt>
            <dd>absent</dd>
          </div>
        </dl>

        <div className="ns2-proof-body">
          <p className="ns2-ans">
            For a small team, most people choose <u className="ns2-redact w2" />
            , <u className="ns2-redact w1" /> or <u className="ns2-redact w3" />{" "}
            — they come up in nearly every comparison thread the model has
            read.
          </p>
          <p className="ns2-slot">
            <span aria-hidden="true">[</span>
            where you should be
            <span aria-hidden="true">]</span>
          </p>
          <p className="ns2-proof-note">
            No impression count. No line in your analytics. The visit simply
            never happens.
          </p>
        </div>
      </div>
    </Reveal>
  );
}

/* ---- 2. contents --------------------------------------------------------- */

const CONTENTS = [
  {
    n: "01",
    k: "Where you rank",
    v: "Every brand the assistants name, the share of voice each takes, and how far back you sit.",
  },
  {
    n: "02",
    k: "The pages they read",
    v: "The sources behind the answers — and which of them you are missing from.",
  },
  {
    n: "03",
    k: "The fixes",
    v: "Ranked by impact, written out ready to ship.",
  },
];

function Contents() {
  return (
    <Reveal className="ns2-sec ns2-contents">
      <header className="ns2-hd">
        <span className="ns2-fig">contents</span>
        <h2 className="ns2-h2">One scan. Three answers.</h2>
      </header>

      <ol className="ns2-index">
        {CONTENTS.map((c) => (
          <li className="ns2-row" key={c.n}>
            <span className="ns2-row-n" aria-hidden="true">
              {c.n}
            </span>
            <h3 className="ns2-row-k">{c.k}</h3>
            <p className="ns2-row-v">{c.v}</p>
          </li>
        ))}
      </ol>
    </Reveal>
  );
}

/* ---- 3. report plate ------------------------------------------------------ */

const KPIS = [
  { k: "Visibility score", v: 34, suffix: "/100" },
  { k: "Assistants naming you", v: 2, suffix: "of 7" },
  { k: "Sources you're missing", v: 9, suffix: "pages" },
];

function Kpi({ k, v, suffix, started }: (typeof KPIS)[0] & { started: boolean }) {
  const n = useCountUp(v, started);
  return (
    <div className="ns2-kpi">
      <p className="ns2-kpi-k">{k}</p>
      <p className="ns2-kpi-v">
        {n}
        <small>{suffix}</small>
      </p>
    </div>
  );
}

function Plate() {
  const [started, setStarted] = useState(false);

  return (
    <Reveal className="ns2-sec ns2-plate-sec" id="inside">
      <div className="ns2-split">
        <div className="ns2-split-copy">
          <span className="ns2-fig">fig. 03</span>
          <h2 className="ns2-h2">A page per question, not a dashboard.</h2>
          <p className="ns2-lede">
            The report reads like the answer it fixes: your score, who is
            taking your place, and the exact pages that change it.
          </p>
        </div>

        <div className="ns2-plate" onAnimationStart={() => setStarted(true)}>
          <div className="ns2-plate-hd">
            <span className="ns2-fig">stayfound report — sample</span>
          </div>
          <div className="ns2-kpis">
            {KPIS.map((k) => (
              <Kpi {...k} started={started} key={k.k} />
            ))}
          </div>
          <div className="ns2-fixrow">
            <span className="ns2-fixrow-k">top fix</span>
            <span className="ns2-fixrow-v">
              Get listed on the two comparison pages every assistant cites
            </span>
            <b>high impact</b>
          </div>
          <div className="ns2-fixrow">
            <span className="ns2-fixrow-k">then</span>
            <span className="ns2-fixrow-v">
              Publish the comparison page buyers already ask for
            </span>
            <b className="quiet">ready to paste</b>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

/* ---- 4. the check frame — wraps the real VisibilityCheck ------------------- */

function CheckFrame({ children }: { children: React.ReactNode }) {
  return (
    <Reveal className="ns2-sec ns2-check" id="report">
      <div className="ns2-check-frame">
        <span className="n-reg n-reg-tl" aria-hidden="true" />
        <span className="n-reg n-reg-tr" aria-hidden="true" />
        <span className="n-reg n-reg-bl" aria-hidden="true" />
        <span className="n-reg n-reg-br" aria-hidden="true" />
        <span className="ns2-fig">run the check</span>
        {children}
      </div>
    </Reveal>
  );
}

/* ---- 5. final CTA ----------------------------------------------------------- */

function Final() {
  return (
    <Reveal className="ns2-final">
      <div className="ns2-final-in">
        <div className="ns2-final-copy">
          <h2 className="ns2-final-h">
            Every day it answers <em>without you</em>.
          </h2>
          <div className="ns2-final-row">
            <a href="#report" className="btn-p">
              Check my brand
              <ArrowRight />
            </a>
            <Link href="/pricing" className="ns2-final-quiet">
              See plans
            </Link>
          </div>
        </div>
        <div className="ns2-final-bird" aria-hidden="true">
          <Image
            src="/design/parrot-halftone-inverse.png"
            alt=""
            width={980}
            height={1150}
            className="ns2-final-img"
          />
        </div>
      </div>
    </Reveal>
  );
}

export function HomeSections({ check }: { check: React.ReactNode }) {
  return (
    <div className="nf">
      <div className="ns2-shell">
        <Specimen />
        <Contents />
        <Plate />
        <CheckFrame>{check}</CheckFrame>
      </div>
      <Final />
    </div>
  );
}
