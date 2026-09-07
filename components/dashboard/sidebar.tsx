import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { SignOutButton } from "@/components/sign-out-button";

export const TAB_KEYS = [
  "overview",
  // Answer Engine Insights: the same question asked of four dimensions, each
  // reading `daily_metric` rather than the latest snapshot.
  "visibility",
  "prompts",
  "platforms",
  "citations",
  "sentiment",
  // The report side, which is a single reading rather than a trend.
  "competitors",
  "actions",
  "analytics",
] as const;

export type TabKey = (typeof TAB_KEYS)[number];

/** Grouped, because the two halves answer different questions: the insight
 *  tabs are trends over many readings, the action tabs are today's reading. */
const GROUPS: { group: string; items: { key: TabKey; label: string; hint: string }[] }[] = [
  {
    group: "Analytics",
    items: [
      { key: "overview", label: "Overview", hint: "Where you stand" },
      { key: "visibility", label: "Visibility", hint: "Score over time" },
      { key: "prompts", label: "Prompts", hint: "Question by question" },
      { key: "platforms", label: "Platforms", hint: "Assistant by assistant" },
      { key: "citations", label: "Citations", hint: "Sources AI reads" },
      { key: "sentiment", label: "Sentiment", hint: "How they describe you" },
    ],
  },
  {
    group: "Action",
    items: [
      { key: "competitors", label: "Competitors", hint: "Who wins the answers" },
      { key: "actions", label: "Opportunities", hint: "What to do" },
      { key: "analytics", label: "History", hint: "Readings on record" },
    ],
  },
];

export function normalizeTab(value?: string): TabKey {
  return (TAB_KEYS as readonly string[]).includes(value ?? "")
    ? (value as TabKey)
    : "overview";
}

/**
 * Left rail for the app. Replaces the floating pill nav + tab strip, which
 * stacked two full-width bars on top of each other and collided on scroll.
 * On narrow screens it becomes a single scrollable row of links — no
 * hamburger, so no client-side state.
 */
export function Sidebar({
  active,
  counts,
  brandId,
  email,
  image,
}: {
  active: TabKey;
  counts: Partial<Record<TabKey, number>>;
  /** Kept in every link so changing tab does not silently switch brand. */
  brandId?: string;
  email: string;
  image?: string | null;
}) {
  return (
    <aside className="sf-side">
      <Link href="/dashboard" className="sf-side-brand">
        <BrandMark />
        StayFound
      </Link>

      <nav className="sf-side-nav" aria-label="Report sections">
        {GROUPS.map((g) => (
          <div className="sf-side-group" key={g.group}>
            <p className="sf-side-gl">{g.group}</p>
            {g.items.map((item) => (
              <Link
                key={item.key}
                href={
                  brandId
                    ? `/dashboard?brand=${brandId}&tab=${item.key}`
                    : `/dashboard?tab=${item.key}`
                }
                className={`sf-side-link ${item.key === active ? "on" : ""}`}
                aria-current={item.key === active ? "page" : undefined}
              >
                <span className="sf-side-l">{item.label}</span>
                <span className="sf-side-hint">{item.hint}</span>
                {counts[item.key] != null && counts[item.key]! > 0 && (
                  <span className="sf-side-n">{counts[item.key]}</span>
                )}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="sf-side-foot">
        <span className="sf-side-user">
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" width={22} height={22} />
          )}
          <span className="sf-side-mail">{email}</span>
        </span>
        <SignOutButton />
      </div>
    </aside>
  );
}
