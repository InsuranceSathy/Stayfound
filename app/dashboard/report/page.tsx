import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import {
  getBrandById,
  getBrandForUser,
  getLatestSnapshot,
  getSnapshotHistory,
} from "@/lib/queries";
import { getTemplate, type TemplateId } from "@/lib/report-templates";
import { TemplatePicker } from "@/components/report/template-picker";
import { PrintButton } from "@/components/report/print-button";
import { BriefTemplate } from "@/components/report/templates/brief";
import { PitchTemplate } from "@/components/report/templates/pitch";
import { SlidesTemplate } from "@/components/report/templates/slides";
import { BoardroomTemplate } from "@/components/report/templates/boardroom";
import { StudioTemplate } from "@/components/report/templates/studio";
import { LedgerTemplate } from "@/components/report/templates/ledger";
import type { TemplateProps } from "@/components/report/shared";
import { SAMPLE_BRAND, SAMPLE_HISTORY, SAMPLE_SNAPSHOT } from "@/lib/report-sample";
import { SITE_URL } from "@/lib/site";
import "./report.css";

export const metadata = { title: "Report — StayFound" };

const TEMPLATES: Record<TemplateId, (p: TemplateProps) => React.ReactElement> = {
  pitch: PitchTemplate,
  slides: SlidesTemplate,
  brief: BriefTemplate,
  boardroom: BoardroomTemplate,
  studio: StudioTemplate,
  ledger: LedgerTemplate,
};

/**
 * The report as a document someone can hand to a client.
 *
 * Its own route rather than a print stylesheet over the dashboard, because the
 * two are different artefacts: one is navigated and has a rail, tabs and
 * disclosure; this is read start to finish and has none of them.
 *
 * Saving as PDF is the browser's own print dialog — no PDF library in the
 * bundle, no headless browser on a server, and the document keeps live text
 * that can be selected, searched and read by a screen reader.
 */
export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const sp = await searchParams;
  const template = getTemplate(typeof sp.template === "string" ? sp.template : null);
  const Doc = TEMPLATES[template.id];

  // `?sample=1` renders the worked example instead of the customer's own data.
  // It is how an agency shows a prospect what they would receive before there
  // is anything real to show them.
  const sample = sp.sample === "1";

  const wanted = typeof sp.brand === "string" ? sp.brand : null;
  const brand = sample
    ? SAMPLE_BRAND
    : ((wanted ? await getBrandById(session.user.id, wanted) : null) ??
      (await getBrandForUser(session.user.id)));

  if (!brand) redirect("/dashboard");

  const snapshot = sample ? SAMPLE_SNAPSHOT : await getLatestSnapshot(brand.id);
  const history = sample ? SAMPLE_HISTORY : await getSnapshotHistory(brand.id, 30);

  // A report of nothing is a blank page with a logo on it. Send them back to
  // the place that can produce one.
  if (!snapshot?.data) redirect(`/dashboard?brand=${brand.id}`);

  // Bare host: "www." in a footer of a printed document is noise, and the QR
  // resolves the same with or without it.
  const site = SITE_URL.replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");

  return (
    <div className="rp-shell">
      {/* Screen-only chrome, hidden at print time so the saved PDF opens on the
          cover rather than on a toolbar. */}
      <div className="rp-bar">
        <Link
          href={sample ? "/dashboard" : `/dashboard?brand=${brand.id}`}
          className="rp-back"
        >
          ← Dashboard
        </Link>
        <TemplatePicker
          current={template.id}
          brandId={sample ? undefined : brand.id}
          sample={sample}
        />
        <span className="rp-bar-sp" />
        <PrintButton />
      </div>

      {/* The paper size is a document-level rule that cannot be scoped to a
          class, so it is emitted for whichever template is rendering. */}
      <style>{`@page { size: ${template.page.width} ${template.page.height}; margin: 0 }`}</style>

      <Doc brand={brand} snapshot={snapshot} history={history} site={site} />
    </div>
  );
}
