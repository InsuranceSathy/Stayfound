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

function AppHeader({ email, image }: { email: string; image?: string | null }) {
  return (
    <nav className="app-nav">
      <div className="wrap nav-inner">
        <Link href="/" className="brand">
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
          <div className="result" style={{ marginTop: 24, borderTop: "none", paddingTop: 0 }}>
            <div className="score-block">
              <p className="res-h">Visibility score</p>
              <div className="score-num">
                {Math.round(snapshot!.score)}
                {delta !== null && delta !== 0 && (
                  <span className={`score-delta ${delta > 0 ? "up" : "down"}`}>
                    {delta > 0 ? "↑" : "↓"} {Math.abs(delta)}
                  </span>
                )}
              </div>
              <p className="score-sum">{data.summary}</p>
              <div className="engine-grid">
                {data.engines.map((eng) => (
                  <span key={eng.name} className={`eng-chip ${eng.mentioned ? "in" : "out"}`}>
                    <span className="led" />
                    {eng.name}
                  </span>
                ))}
              </div>
              <p className="check-note" style={{ marginTop: 16 }}>
                {snapshot!.live
                  ? "Live estimate across AI engines."
                  : "Sample estimate"}
                {!snapshot!.live && <span className="badge-sample">sample data</span>}
              </p>
            </div>

            <div>
              <p className="res-h">Share of voice vs. competitors</p>
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

              <div className="actions">
                <p className="res-h">Recommended moves</p>
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
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
