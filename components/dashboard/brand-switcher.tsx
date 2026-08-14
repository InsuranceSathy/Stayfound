import Link from "next/link";
import type { Brand } from "@/lib/queries";
import type { TabKey } from "@/components/dashboard/sidebar";

/**
 * Which brand the report is about.
 *
 * Renders nothing for a single-brand account, which is most of them — a
 * switcher with one option is a control that cannot be used. Once there are
 * several it is links rather than a dropdown: each brand is a real URL you can
 * bookmark or send, and the current tab travels with it so switching brands
 * keeps you on the page you were reading.
 */
export function BrandSwitcher({
  brands,
  current,
  tab,
  limit,
}: {
  brands: Brand[];
  current: Brand;
  tab: TabKey;
  /** How many brands the plan allows, so "add" only appears when it can work. */
  limit: number;
}) {
  if (brands.length < 2 && brands.length >= limit) return null;

  return (
    <nav className="sf-brands" aria-label="Tracked brands">
      {brands.map((b) => (
        <Link
          key={b.id}
          href={`/dashboard?brand=${b.id}&tab=${tab}`}
          className={`sf-brand-chip ${b.id === current.id ? "on" : ""}`}
          aria-current={b.id === current.id ? "page" : undefined}
        >
          {b.name}
        </Link>
      ))}
      {brands.length < limit && (
        <Link href="/dashboard?add=1" className="sf-brand-add">
          + Add brand
          <span className="sf-brand-left">
            {limit - brands.length} left
          </span>
        </Link>
      )}
    </nav>
  );
}
