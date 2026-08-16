import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { referralPortalUrl } from "@/lib/referral";

type FooterLink = {
  href: string;
  label: string;
  /** Hidden until the affiliate program is configured — /refer 404s without it. */
  needsReferral?: boolean;
};

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: "Product",
    links: [
      { href: "/#inside", label: "Overview" },
      { href: "/pricing", label: "Pricing" },
      { href: "/#report", label: "Check my brand" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/blog", label: "Blog" },
      { href: "/demo", label: "Book a demo" },
      { href: "/refer", label: "Refer & earn", needsReferral: true },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms" },
      { href: "/privacy", label: "Privacy" },
    ],
  },
];

/** The drawing-sheet footer: brand and tagline left, ruled columns right. */
export function SiteFooter() {
  const hasReferral = Boolean(referralPortalUrl());

  return (
    <div className="nf">
      <footer className="ns2-foot">
        <div className="wrap-p ns2-foot-in">
          <div className="ns2-foot-brand">
            <Link href="/" className="ns2-foot-mark">
              <BrandMark size={22} />
              StayFound
            </Link>
            <p>
              Answer engine optimisation for brands that would rather be
              recommended than ranked.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <a
                href="https://startupfa.me/s/stayfound?utm_source=stayfound.tech"
                target="_blank"
                rel="noopener noreferrer"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://startupfa.me/badges/featured-badge.webp"
                  alt="StayFound - Featured on Startup Fame"
                  width={171}
                  height={54}
                />
              </a>
              <a
                href="https://www.superlaun.ch/products/3139"
                target="_blank"
                rel="noopener noreferrer"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://www.superlaun.ch/badge.png"
                  alt="Featured on Super Launch"
                  width={100}
                  height={100}
                />
              </a>
            </div>
          </div>

          <div className="ns2-foot-cols">
            {COLUMNS.map((col) => (
              <div className="ns2-foot-col" key={col.title}>
                <p>{col.title}</p>
                {col.links
                  .filter((l) => !l.needsReferral || hasReferral)
                  .map((l) => (
                    <Link key={l.label} href={l.href}>
                      {l.label}
                    </Link>
                  ))}
              </div>
            ))}
          </div>
        </div>

        <div className="wrap-p ns2-foot-fine">
          <span>© 2026 StayFound</span>
          <span>
            reads chatgpt · gemini · perplexity · claude + 3 more
          </span>
        </div>
      </footer>
    </div>
  );
}
