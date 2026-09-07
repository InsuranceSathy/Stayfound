import Link from "next/link";
import type { Brand } from "@/lib/queries";
import type { TabKey } from "@/components/dashboard/sidebar";

/**
 * Which brand the dashboard is about, and how to change it.
 *
 * Always rendered. An earlier version hid itself whenever there was nothing to
 * switch to, which is most accounts — the effect was that a single-brand
 * customer had no visible sign of which brand they were looking at or that
 * tracking more was even possible. A control that disappears is not restraint,
 * it is a missing answer to "where do I change this".
 *
 * Links rather than a dropdown: each brand is a real URL you can bookmark or
 * send, and the current tab travels with it so switching keeps your place.
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
  /** How many brands the plan allows, enforced in `addBrand`. */
  limit: number;
}) {
  const room = limit - brands.length;

  return (
    <nav className="sf-brands" aria-label="Tracked brands">
      <span className="sf-brands-k">Brand</span>

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

      {room > 0 ? (
        <Link href="/dashboard?add=1" className="sf-brand-add">
          + Add brand
          <span className="sf-brand-left">{room} left</span>
        </Link>
      ) : (
        // At the plan's ceiling. Say so and where the ceiling moves, rather
        // than showing an "add" link that the server would refuse.
        <span className="sf-brand-cap">
          {brands.length} of {limit} on your plan
          <Link href="/pricing" className="sf-brand-up">
            Track more →
          </Link>
        </span>
      )}
    </nav>
  );
}
