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

/**
 * Left rail for the app. Replaces the floating pill nav + tab strip, which
 * stacked two full-width bars on top of each other and collided on scroll.
 * On narrow screens it becomes a single scrollable row of links — no
 * hamburger, so no client-side state.
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
      <Link href="/dashboard" className="sf-side-brand">
        <BrandMark />
        StayFound
      </Link>

      <nav className="sf-side-nav" aria-label="Report sections">
        {NAV.map((item) => (
          <Link
            key={item.key}
            href={`/dashboard?tab=${item.key}`}
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
