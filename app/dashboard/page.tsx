import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AddBrandForm, type BrandDefaults } from "@/components/add-brand-form";
import { BillingPanel } from "@/components/billing-panel";
import { ReferralPanel } from "@/components/referral-panel";
import { ChangeBrand } from "@/components/dashboard/change-brand";
import {
  getBrandForUser,
  getDeviceContext,
  getLatestSnapshot,
  getSnapshotHistory,
} from "@/lib/queries";
import { relativeTime, scanScope } from "@/lib/report-derive";
import { normalizeTab, Sidebar } from "@/components/dashboard/sidebar";
import { ScanButton } from "@/components/dashboard/scan-button";
import { OverviewPanel } from "@/components/dashboard/overview-panel";
import { CompetitorsPanel } from "@/components/dashboard/competitors-panel";
import { CitationsPanel } from "@/components/dashboard/citations-panel";
import { ActionsPanel } from "@/components/dashboard/actions-panel";
import { AnalyticsPanel } from "@/components/dashboard/analytics-panel";

export const maxDuration = 300;

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
  const sp = await searchParams;
  const tab = normalizeTab(typeof sp.tab === "string" ? sp.tab : undefined);

  // ---------- onboarding: no brand yet ----------
  if (!brand) {
    /**
     * Most people arriving here just bought from a report they ran on the public
     * site, so we already know the brand, the category and the market — asking
     * for them again is a form they have filled in once, and a second chance to
     * type the category differently and get a different set of competitors back.
     *
     * `sf_device` is the year-long cookie the free check sets. It survives
     * sign-in and the round trip out to Dodo and back, which is why the context
     * rides on it rather than on the checkout url.
     */
    // Except when they got here by deleting a brand: "start over" means an
    // empty form, not the brand they just replaced. See `removeBrand`.
    const startingOver = sp.startover === "1";
    const deviceId = startingOver
      ? undefined
      : (await cookies()).get("sf_device")?.value;
    const ctx = deviceId ? await getDeviceContext(deviceId) : null;
    const defaults: BrandDefaults | null = ctx?.brand
      ? { name: ctx.brand, category: ctx.category, market: ctx.market }
      : null;

    return (
      <div className="sf-shell">
        <Sidebar active={tab} counts={{}} email={user.email} image={user.image} />
        <main className="sf-main">
          <h1 className="dash-hi">Welcome, {firstName}.</h1>
          <p className="sec-sub">
            {defaults
              ? "Here's the check you ran — confirm it and we'll start tracking this brand daily. The full report opens on the numbers you already saw."
              : "Add your brand and category. We'll check how every major AI assistant answers when buyers ask about your category — and start tracking it."}
          </p>
          <div className="check" style={{ marginTop: 30, maxWidth: 620 }}>
            <p className="res-h">
              {defaults ? "Confirm your brand" : "Set up your brand"}
            </p>
            <AddBrandForm defaults={defaults} />
          </div>
        </main>
      </div>
    );
  }

  // What every scan of this brand is run against. The scope, not the bare
  // category, so a reading here is the same measurement as the free check that
  // brought them in — including reusing its cached result on the first scan.
  const scope = scanScope(brand.category, brand.market);

  const snapshot = await getLatestSnapshot(brand.id);
  const history = await getSnapshotHistory(brand.id, 30);
  const data = snapshot?.data;

  // ---------- first run: brand exists, no scan yet ----------
  if (!snapshot || !data) {
    return (
      <div className="sf-shell">
        <Sidebar active={tab} counts={{}} email={user.email} image={user.image} />
        <main className="sf-main">
          <header className="sf-top">
            <div>
              <h1 className="sf-top-t">{brand.name}</h1>
              {/* Category and market read as two facts. The scope string that
                  joins them is a prompt, not a label. */}
              <p className="sf-top-s">
                {brand.category}
                {brand.market && ` · ${brand.market}`}
              </p>
            </div>
            <ChangeBrand brand={brand.name} scans={0} />
          </header>
          <section className="sf-panel">
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
              category={scope}
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

  return (
    <div className="sf-shell">
      <Sidebar
        active={tab}
        counts={{
          competitors: data.competitors.length,
          citations: data.citedSources?.length ?? 0,
          actions: data.actions.length,
        }}
        email={user.email}
        image={user.image}
      />

      <main className="sf-main">
        <header className="sf-top">
          <div>
            <h1 className="sf-top-t">{brand.name}</h1>
            <p className="sf-top-s">
              {brand.category}
              {brand.market && ` · ${brand.market}`} · updated{" "}
              {relativeTime(snapshot.created_at)}
              {!snapshot.live && <span className="badge-sample">sample data</span>}
            </p>
          </div>
          <div className="sf-top-actions">
            <ChangeBrand brand={brand.name} scans={history.length} />
            <ScanButton brand={brand.name} category={scope} label="Refresh" />
          </div>
        </header>

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
        {tab === "actions" && (
          <ActionsPanel
            data={data}
            brand={{ name: brand.name, category: brand.category }}
          />
        )}
        {tab === "analytics" && (
          <AnalyticsPanel data={data} history={history} />
        )}

        {/* Billing sits under Overview rather than in the rail: the sidebar is
            a report navigator, and a plan is not a section of the report. It
            renders nothing at all until checkout is open — see lib/plans.ts.
            The checkout return url points back at this tab. */}
        {tab === "overview" && <BillingPanel />}

        {/* Same placement reasoning, and the same all-or-nothing switch: it
            renders nothing until an affiliate portal url is configured. */}
        {tab === "overview" && <ReferralPanel />}
      </main>
    </div>
  );
}
