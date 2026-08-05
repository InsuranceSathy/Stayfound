import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { SignOutButton } from "@/components/sign-out-button";

export const TAB_KEYS = [
  "overview",
  "competitors",
  "citations",
  "actions",
  "analytics",
] as const;

export type TabKey = (typeof TAB_KEYS)[number];

/** 20px stroke icons — inline so the bottom bar costs no extra request. */
const ICONS: Record<TabKey, React.ReactNode> = {
  overview: (
    <>
      <path d="M3 12a9 9 0 0 1 18 0" />
      <path d="M12 12l4.5-3.5" />
    </>
  ),
  competitors: (
    <>
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-7" />
      <path d="M22 20H2" />
    </>
  ),
  citations: (
    <>
      <path d="M9 15l6-6" />
      <path d="M11 6l1-1a4 4 0 0 1 6 6l-1 1" />
      <path d="M13 18l-1 1a4 4 0 0 1-6-6l1-1" />
    </>
  ),
  actions: (
    <>
      <path d="M4 7h10" />
      <path d="M4 17h10" />
      <path d="M18 4l2 3-2 3" />
      <path d="M18 14l2 3-2 3" />
    </>
  ),
  analytics: (
    <>
      <path d="M3 12h4l3-7 4 14 3-7h4" />
    </>
  ),
};

const NAV: { key: TabKey; label: string; hint: string }[] = [
  { key: "overview", label: "Overview", hint: "Where you stand" },
  { key: "competitors", label: "Competitors", hint: "Who wins the answers" },
  { key: "citations", label: "Citations", hint: "Sources AI reads" },
  { key: "actions", label: "Actions", hint: "What to do" },
  { key: "analytics", label: "Analytics", hint: "Tone and history" },
];

export function normalizeTab(value?: string): TabKey {
  return (TAB_KEYS as readonly string[]).includes(value ?? "")
    ? (value as TabKey)
    : "overview";
}

function TabIcon({ tab }: { tab: TabKey }) {
  return (
    <svg
      className="sf-side-icon"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[tab]}
    </svg>
  );
}

/**
 * Navigation for the app.
 *
 * Desktop: a left rail. Phone: the same markup re-flows — the header becomes a
 * slim sticky bar and the links become a fixed bottom tab bar, which is where
 * thumbs actually reach. No duplicated DOM and no client-side state, so it
 * works installed to a home screen too.
 */
export function Sidebar({
  active,
  counts,
  email,
  image,
}: {
  active: TabKey;
  counts: Partial<Record<TabKey, number>>;
  email: string;
  image?: string | null;
}) {
  return (
    <aside className="sf-side">
      <div className="sf-side-top">
        <Link href="/dashboard" className="sf-side-brand">
          <BrandMark />
          StayFound
        </Link>
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
      </div>

      <nav className="sf-side-nav" aria-label="Report sections">
        {NAV.map((item) => (
          <Link
            key={item.key}
            href={`/dashboard?tab=${item.key}`}
            className={`sf-side-link ${item.key === active ? "on" : ""}`}
            aria-current={item.key === active ? "page" : undefined}
          >
            <TabIcon tab={item.key} />
            <span className="sf-side-l">{item.label}</span>
            <span className="sf-side-hint">{item.hint}</span>
            {counts[item.key] != null && counts[item.key]! > 0 && (
              <span className="sf-side-n">{counts[item.key]}</span>
            )}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
