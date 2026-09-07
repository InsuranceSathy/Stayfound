import Link from "next/link";
import type { TabKey } from "@/components/dashboard/sidebar";

/**
 * The horizontal tab strip across the top of the report.
 *
 * The rail already lists these, but a rail is for moving between *areas* and
 * tabs are for moving between *views of the same thing*. Every dashboard in
 * this category puts the dimensions of one brand's reading in a row under the
 * brand name, because that is what they are: the same measurement sliced eight
 * ways, not eight different pages.
 */
const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "visibility", label: "Visibility" },
  { key: "prompts", label: "Prompts" },
  { key: "platforms", label: "Platforms" },
  { key: "citations", label: "Citations" },
  { key: "sentiment", label: "Sentiment" },
  { key: "competitors", label: "Competitors" },
  { key: "actions", label: "Opportunities" },
];

export function TabRow({
  active,
  brandId,
  days,
}: {
  active: TabKey;
  brandId: string;
  /** Carried across tabs so changing view does not silently reset the range
   *  someone deliberately chose. */
  days: number;
}) {
  return (
    <nav className="ai-tabs" aria-label="Report views">
      {TABS.map((t) => (
        <Link
          key={t.key}
          href={`/dashboard?brand=${brandId}&tab=${t.key}&days=${days}`}
          className={`ai-tab ${t.key === active ? "on" : ""}`}
          aria-current={t.key === active ? "page" : undefined}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
