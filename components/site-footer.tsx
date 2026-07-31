import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/#inside", label: "Overview" },
      { href: "/#loop", label: "How it works" },
      { href: "/pricing", label: "Pricing" },
      { href: "/#report", label: "Get your report" },
    ],
  },
  {
    title: "Engines",
    links: [
      { href: "/#engines", label: "ChatGPT" },
      { href: "/#engines", label: "Perplexity" },
      { href: "/#engines", label: "Gemini" },
      { href: "/#engines", label: "Claude" },
      { href: "/#engines", label: "Grok" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/demo", label: "Book a demo" },
      { href: "/demo", label: "Contact" },
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
  return (
    <footer>
      <div className="wrap">
        <div className="foot-box">
          <div className="foot-brand">
            <Link href="/" className="brand">
              <BrandMark />
              StayFound
            </Link>
            <p className="foot-eyebrow">Answer engine optimisation</p>
            <h3 className="foot-pitch">
              Be the brand AI keeps recommending.
            </h3>
            <p className="foot-blurb">
              We track how ChatGPT, Perplexity, Gemini, Claude and Grok answer
              the questions your buyers ask — and what it takes to get named.
            </p>
            <div className="foot-cta">
              <Link href="/#report" className="btn btn-primary">
                Get my free report <span className="arr">→</span>
              </Link>
              <Link href="/demo" className="btn btn-ghost">
                Book a demo
              </Link>
            </div>
          </div>

          <div className="foot-cols">
            {COLUMNS.map((col) => (
              <div className="foot-col" key={col.title}>
                <p className="foot-col-h">{col.title}</p>
                {col.links.map((l) => (
                  <Link key={l.label} href={l.href}>
                    {l.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="foot-base">
          <span className="copy">© 2026 StayFound</span>
          <span className="copy">Built for the answer era</span>
        </div>
      </div>
    </footer>
  );
}
