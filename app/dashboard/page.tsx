import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { SignOutButton } from "@/components/sign-out-button";
import { BrandMark } from "@/components/brand-mark";
import { AddBrandForm } from "@/components/add-brand-form";
import { removeBrand } from "@/app/dashboard/actions";
import {
  getBrandForUser,
  getLatestSnapshot,
  getSnapshotHistory,
} from "@/lib/queries";
import { relativeTime } from "@/lib/report-derive";
import { normalizeTab, TabNav } from "@/components/dashboard/tab-nav";
import { ScanButton } from "@/components/dashboard/scan-button";
import { OverviewPanel } from "@/components/dashboard/overview-panel";
import { CompetitorsPanel } from "@/components/dashboard/competitors-panel";
import { CitationsPanel } from "@/components/dashboard/citations-panel";
import { ActionsPanel } from "@/components/dashboard/actions-panel";
import { AnalyticsPanel } from "@/components/dashboard/analytics-panel";

export const maxDuration = 300;

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

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
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
          <h1 className="dash-hi">Welcome, {firstName}.</h1>
          <p className="sec-sub">
            Add your brand and category. We&apos;ll check how every major AI
            assistant answers when buyers ask about your category — and start
            tracking it.
          </p>
          <div className="check" style={{ marginTop: 34 }}>
            <p className="res-h">Set up your brand</p>
            <AddBrandForm />
          </div>
        </main>
      </div>
    );
  }

  const snapshot = await getLatestSnapshot(brand.id);
  const history = await getSnapshotHistory(brand.id, 30);
  const data = snapshot?.data;

  // ---------- first run: brand exists, no scan yet ----------
  if (!snapshot || !data) {
    return (
      <div className="dash-page">
        <AppHeader email={user.email} image={user.image} />
        <main className="wrap dash-main" style={{ paddingTop: 36 }}>
          <div className="brand-bar">
            <div>
              <h1 className="brand-title">{brand.name}</h1>
              <p className="brand-cat">{brand.category}</p>
            </div>
            <form action={removeBrand}>
              <button type="submit" className="btn btn-ghost btn-sm">
                Change brand
              </button>
            </form>
          </div>
          <section className="sf-panel" style={{ marginTop: 20 }}>
            <div className="sf-panel-head">
              <h2 className="sf-panel-t">Running your first scan</h2>
            </div>
            <p className="sf-lede">
              We&apos;re asking ChatGPT, Gemini, Perplexity and Claude the
              questions your buyers ask, then reading the sources behind their
              answers. This takes about two minutes.
            </p>
            <ScanButton
              brand={brand.name}
              category={brand.category}
              label="Run first scan"
              className="btn btn-primary"
              autoStart
              block
            />
          </section>
        </main>
      </div>
    );
  }

  const prev = history[1];
  const delta = prev ? snapshot.score - prev.score : null;
  const sp = await searchParams;
  const tab = normalizeTab(typeof sp.tab === "string" ? sp.tab : undefined);

  return (
    <div className="dash-page">
      <AppHeader email={user.email} image={user.image} />

      <TabNav
        active={tab}
        counts={{
          competitors: data.competitors.length,
          citations: data.citedSources?.length ?? 0,
          actions: data.actions.length,
        }}
      />

      <main className="wrap dash-main" style={{ paddingTop: 32 }}>
        <div className="brand-bar">
          <div>
            <h1 className="brand-title">{brand.name}</h1>
            <p className="brand-cat">
              {brand.category} · updated {relativeTime(snapshot.created_at)}
              {!snapshot.live && (
                <span className="badge-sample">sample data</span>
              )}
            </p>
          </div>
          <div className="brand-actions">
            <form action={removeBrand}>
              <button type="submit" className="btn btn-ghost btn-sm">
                Change brand
              </button>
            </form>
            <ScanButton
              brand={brand.name}
              category={brand.category}
              label="Refresh"
            />
          </div>
        </div>

        {tab === "overview" && (
          <OverviewPanel
            brandName={brand.name}
            data={data}
            score={snapshot.score}
            history={history}
            delta={delta}
          />
        )}
        {tab === "competitors" && (
          <CompetitorsPanel brandName={brand.name} data={data} />
        )}
        {tab === "citations" && <CitationsPanel data={data} />}
        {tab === "actions" && <ActionsPanel data={data} />}
        {tab === "analytics" && (
          <AnalyticsPanel data={data} history={history} />
        )}
      </main>
    </div>
  );
}
