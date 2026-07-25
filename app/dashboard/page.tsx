import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { SignOutButton } from "@/components/sign-out-button";
import { BrandMark } from "@/components/brand-mark";
import { AddBrandForm } from "@/components/add-brand-form";
import { refreshSnapshot, removeBrand } from "@/app/dashboard/actions";
import {
  getBrandForUser,
  getLatestSnapshot,
  getSnapshotHistory,
} from "@/lib/queries";

export const maxDuration = 300;

const TABS = ["Visibility", "Citations", "Prompts", "Competitors", "Actions", "Analytics"];

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

// Server-rendered trend line for the score history — a single accent series, so
// no legend or categorical palette is needed. Oldest → newest, left → right.
function Sparkline({ scores }: { scores: number[] }) {
  if (scores.length < 2) return null;
  const w = 200;
  const h = 48;
  const pad = 5;
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min || 1;
  const step = (w - pad * 2) / (scores.length - 1);
  const pts = scores.map((s, i) => {
    const x = pad + i * step;
    const y = pad + (h - pad * 2) * (1 - (s - min) / range);
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x},${y}`).join(" ");
  const area = `${pad},${h - pad} ${line} ${w - pad},${h - pad}`;
  const [lx, ly] = pts[pts.length - 1];
  return (
    <svg
      className="spark"
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={`Visibility score trend across ${scores.length} checks, from ${scores[0]} to ${scores[scores.length - 1]}`}
    >
      <defs>
        <linearGradient id="sparkLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7c6cf5" />
          <stop offset="1" stopColor="#b07ff0" />
        </linearGradient>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgba(144,133,233,0.26)" />
          <stop offset="1" stopColor="rgba(144,133,233,0)" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#sparkFill)" />
      <polyline
        points={line}
        fill="none"
        stroke="url(#sparkLine)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lx} cy={ly} r="3.2" fill="#b07ff0" />
    </svg>
  );
}

function AppHeader({ email, image }: { email: string; image?: string | null }) {
  return (
    <nav className="app-nav">
      <div className="wrap nav-inner">
        {/* In-app: the logo returns to the dashboard, not the marketing site —
            a stray click shouldn't bounce a signed-in user out of their workspace. */}
        <Link href="/dashboard" className="brand">
          <BrandMark />
          StayFound
        </Link>
        <div className="nav-right">
          <span className="user-chip">
            {image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" width={24} height={24} />
            )}
            {email}
          </span>
          <SignOutButton />
        </div>
      </div>
    </nav>
  );
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const { user } = session;
  const firstName = user.name?.split(" ")[0] || "there";
  const brand = await getBrandForUser(user.id);

  // ---------- onboarding: no brand yet ----------
  if (!brand) {
    return (
      <div className="dash-page">
        <AppHeader email={user.email} image={user.image} />
        <main className="wrap dash-main">
          <p className="eyebrow">Your workspace</p>
          <h1 className="dash-hi">Welcome, {firstName}.</h1>
          <p className="sec-sub">
            Add your brand and category. We&apos;ll analyze your visibility
            across every AI engine and start tracking it.
          </p>
          <div className="check" style={{ marginTop: 34 }}>
            <p className="res-h">Set up your brand</p>
            <AddBrandForm />
          </div>
        </main>
      </div>
    );
  }

  // ---------- has brand: show Visibility ----------
  const snapshot = await getLatestSnapshot(brand.id);
  const history = await getSnapshotHistory(brand.id, 14);
  const prev = history[1];
  const data = snapshot?.data;
  const delta = snapshot && prev ? snapshot.score - prev.score : null;
  const maxShare = data
    ? Math.max(...data.competitors.map((c) => c.share), 1)
    : 1;

  // Derived KPIs for the stat-tile row.
  const youShare = data?.competitors.find((c) => c.you)?.share ?? 0;
  const rank = data
    ? [...data.competitors].sort((a, b) => b.share - a.share).findIndex((c) => c.you) + 1
    : 0;
  const enginesIn = data?.engines.filter((e) => e.mentioned).length ?? 0;
  // History is newest-first; the sparkline wants oldest → newest.
  const scoreTrend = history.map((s) => s.score).reverse();

  return (
    <div className="dash-page">
      <AppHeader email={user.email} image={user.image} />

      <div className="app-tabs-bar">
        <div className="wrap app-tabs">
          {TABS.map((t) => (
            <span key={t} className={`app-tab ${t === "Visibility" ? "on" : "soon"}`}>
              {t}
              {t !== "Visibility" && <span className="soon-tag">soon</span>}
            </span>
          ))}
        </div>
      </div>

      <main className="wrap dash-main" style={{ paddingTop: 36 }}>
        <div className="brand-bar">
          <div>
            <h1 className="brand-title">{brand.name}</h1>
            <p className="brand-cat">
              {brand.category}
              {snapshot && <> · updated {relativeTime(snapshot.created_at)}</>}
            </p>
          </div>
          <div className="brand-actions">
            <form action={removeBrand}>
              <button type="submit" className="btn btn-ghost btn-sm">
                Change brand
              </button>
            </form>
            <form action={refreshSnapshot}>
              <button type="submit" className="btn btn-primary btn-sm">
                Refresh <span className="arr">→</span>
              </button>
            </form>
          </div>
        </div>

        {!data ? (
          <div className="check" style={{ marginTop: 24 }}>
            <p className="res-h">No data yet</p>
            <p className="sec-sub">Run your first visibility check.</p>
            <form action={refreshSnapshot} style={{ marginTop: 16 }}>
              <button type="submit" className="btn btn-primary">
                Run check <span className="arr">→</span>
              </button>
            </form>
          </div>
        ) : (
          <>
            <div className="kpi-grid">
              <div className="kpi">
                <p className="kpi-label">Visibility score</p>
                <p className="kpi-value grad-text">{Math.round(snapshot!.score)}</p>
                <p className="kpi-sub">
                  {delta === null || delta === 0 ? (
                    "No change vs. last check"
                  ) : (
                    <span className={delta > 0 ? "up" : "down"}>
                      {delta > 0 ? "↑" : "↓"} {Math.abs(delta)} vs. last check
                    </span>
                  )}
                </p>
              </div>
              <div className="kpi">
                <p className="kpi-label">Share of voice</p>
                <p className="kpi-value">{Math.round(youShare)}%</p>
                <p className="kpi-sub">
                  Rank #{rank || "—"} of {data.competitors.length}
                </p>
              </div>
              <div className="kpi">
                <p className="kpi-label">Engine presence</p>
                <p className="kpi-value">
                  {enginesIn}
                  <span className="kpi-of"> / {data.engines.length}</span>
                </p>
                <p className="kpi-sub">AI engines mention you</p>
              </div>
              <div className="kpi">
                <p className="kpi-label">Last updated</p>
                <p className="kpi-value kpi-value-sm">
                  {relativeTime(snapshot!.created_at)}
                </p>
                <p className="kpi-sub">
                  {snapshot!.live ? (
                    "Live estimate"
                  ) : (
                    <>
                      Sample estimate
                      <span className="badge-sample">sample data</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="dash-grid">
              <section className="panel panel-score">
                <div className="panel-head">
                  <p className="res-h">Score trend</p>
                  {delta !== null && delta !== 0 && (
                    <span className={`score-delta ${delta > 0 ? "up" : "down"}`}>
                      {delta > 0 ? "↑" : "↓"} {Math.abs(delta)}
                    </span>
                  )}
                </div>
                {scoreTrend.length >= 2 ? (
                  <Sparkline scores={scoreTrend} />
                ) : (
                  <p className="panel-empty">
                    Trend appears after your next refresh.
                  </p>
                )}
                <p className="score-sum">{data.summary}</p>
                <div className="engine-grid">
                  {data.engines.map((eng) => (
                    <span
                      key={eng.name}
                      className={`eng-chip ${eng.mentioned ? "in" : "out"}`}
                    >
                      <span className="led" />
                      {eng.name}
                    </span>
                  ))}
                </div>
              </section>

              <section className="panel panel-sov">
                <div className="panel-head">
                  <p className="res-h">Share of voice vs. competitors</p>
                </div>
                {data.competitors.map((c) => (
                  <div key={c.name} className={`bar-row ${c.you ? "you" : ""}`}>
                    <span className="nm">
                      {c.name}
                      {c.you && <span className="badge-you">You</span>}
                    </span>
                    <span className="bar-track">
                      <span
                        className="bar-fill"
                        style={{ width: `${(c.share / maxShare) * 100}%` }}
                      />
                    </span>
                    <span className="bar-val">{Math.round(c.share)}%</span>
                  </div>
                ))}
              </section>
            </div>

            <section className="panel panel-moves">
              <div className="panel-head">
                <p className="res-h">Recommended moves</p>
              </div>
              <div className="moves-list">
                {data.actions.map((a, i) => (
                  <div className="action" key={i}>
                    <span className={`impact ${a.impact}`}>{a.impact}</span>
                    <div className="a-body">
                      <h4>{a.title}</h4>
                      <p>{a.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
