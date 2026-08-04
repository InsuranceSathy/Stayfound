import Link from "next/link";

export const TAB_KEYS = [
  "overview",
  "competitors",
  "citations",
  "actions",
  "analytics",
] as const;

export type TabKey = (typeof TAB_KEYS)[number];

const LABELS: Record<TabKey, string> = {
  overview: "Overview",
  competitors: "Competitors",
  citations: "Citations",
  actions: "Actions",
  analytics: "Analytics",
};

export function normalizeTab(value?: string): TabKey {
  return (TAB_KEYS as readonly string[]).includes(value ?? "")
    ? (value as TabKey)
    : "overview";
}

/**
 * Tabs are links, not client state: each one is a real URL you can bookmark or
 * send to a teammate, and the panel behind it stays server-rendered. The count
 * badges show there is actual content behind every tab.
 */
export function TabNav({
  active,
  counts,
}: {
  active: TabKey;
  counts: Partial<Record<TabKey, number>>;
}) {
  return (
    <div className="app-tabs-bar">
      <nav className="wrap app-tabs" aria-label="Report sections">
        {TAB_KEYS.map((key) => (
          <Link
            key={key}
            href={`/dashboard?tab=${key}`}
            className={`app-tab ${key === active ? "on" : ""}`}
            aria-current={key === active ? "page" : undefined}
          >
            {LABELS[key]}
            {counts[key] != null && counts[key]! > 0 && (
              <span className="sf-tab-n">{counts[key]}</span>
            )}
          </Link>
        ))}
      </nav>
    </div>
  );
}
