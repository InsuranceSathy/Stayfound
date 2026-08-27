import Link from "next/link";
import { REPORT_TEMPLATES, type TemplateId } from "@/lib/report-templates";

/**
 * Which template the report is dressed in.
 *
 * Links rather than a dropdown, for the same reason the brand switcher is:
 * each template is a real URL, so an agency can bookmark the one they always
 * send, or paste it to a colleague and have them see the same document.
 *
 * Server component — it is a set of anchors and needs no interactivity beyond
 * navigation.
 */
export function TemplatePicker({
  current,
  brandId,
  sample,
}: {
  current: TemplateId;
  brandId?: string;
  /** Preserve preview mode when switching, so browsing templates on the
   *  sample doesn't silently drop you back onto real client data. */
  sample?: boolean;
}) {
  return (
    <nav className="rp-picker" aria-label="Report template">
      {REPORT_TEMPLATES.map((t) => {
        const params = new URLSearchParams();
        if (brandId) params.set("brand", brandId);
        params.set("template", t.id);
        if (sample) params.set("sample", "1");
        return (
          <Link
            key={t.id}
            href={`/dashboard/report?${params.toString()}`}
            className={`rp-pick ${t.id === current ? "on" : ""}`}
            aria-current={t.id === current ? "page" : undefined}
            title={t.blurb}
          >
            <span className="rp-pick-b">{t.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
