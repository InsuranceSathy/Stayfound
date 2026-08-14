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
import { ReportDocument } from "@/components/report/report-document";
import { PrintButton } from "@/components/report/print-button";

export const metadata = { title: "Report — StayFound" };

/**
 * The report as a printable document, on its own route.
 *
 * Separate from /dashboard rather than a print stylesheet over it, because the
 * two are different artefacts: the dashboard is navigated and has a rail, tabs
 * and disclosure; this is read start to finish and has none of them. Sharing
 * one DOM would mean hiding most of it at print time and still printing the
 * wrong shape.
 *
 * Saving as PDF is the browser's own print dialog. That keeps the product's
 * type and palette, needs no PDF library in the bundle and no headless browser
 * on a server, and prints correctly from any device the customer already has.
 */
export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const sp = await searchParams;
  const wanted = typeof sp.brand === "string" ? sp.brand : null;
  const brand =
    (wanted ? await getBrandById(session.user.id, wanted) : null) ??
    (await getBrandForUser(session.user.id));

  if (!brand) redirect("/dashboard");

  const snapshot = await getLatestSnapshot(brand.id);
  const history = await getSnapshotHistory(brand.id, 30);

  // A report of nothing is a blank page with a logo on it. Send them back to
  // the place that can produce one.
  if (!snapshot?.data) redirect(`/dashboard?brand=${brand.id}`);

  return (
    <div className="rp-shell">
      {/* Screen-only chrome. `rp-bar` is hidden at print time so the saved PDF
          opens on the cover rather than on a toolbar. */}
      <div className="rp-bar">
        <Link href={`/dashboard?brand=${brand.id}`} className="rp-back">
          ← Back to dashboard
        </Link>
        <PrintButton />
      </div>

      <ReportDocument brand={brand} snapshot={snapshot} history={history} />
    </div>
  );
}
