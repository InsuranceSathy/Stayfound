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
      { href: "/#loop", label: "How it works" },
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
      { href: "/demo", label: "Contact" },
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

export function SiteFooter() {
  const hasReferral = Boolean(referralPortalUrl());

  return (
    <footer className="foot">
      <div className="wrap foot-top">
        <div className="foot-id">
          <Link href="/" className="brand">
            <BrandMark />
            StayFound
          </Link>
          <p className="foot-tag">
            Answer engine optimisation for brands that would rather be
            recommended than ranked.
          </p>
          {/* The engines were a column of links that all pointed at the same
              anchor — a content hub that doesn't exist. Same information, told
              honestly. */}
          <p className="foot-live">
            <span className="dot-live" />
            Now tracking
          </p>
          <ul className="foot-engines">
            {["ChatGPT", "Perplexity", "Gemini", "Claude", "Grok", "Copilot", "AI Overviews"].map(
              (e) => (
                <li key={e}>{e}</li>
              ),
            )}
          </ul>
        </div>

        <div className="foot-cols">
          {COLUMNS.map((col) => (
            <div className="foot-col" key={col.title}>
              <p className="foot-col-h">{col.title}</p>
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

      <div className="wrap foot-base">
        <span className="copy">© 2026 StayFound</span>
        <span className="copy">Built for the answer era</span>
      </div>

      {/* Signature end-cap: oversized wordmark clipped by the footer's bottom
          edge, so the page ends on the brand rather than a rule. */}
      <div className="foot-mark" aria-hidden="true">
        StayFound
      </div>
    </footer>
  );
}
