import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

export function SiteHeader() {
  // in normal flow — scrolls away with the page so the sticky analytics panel
  // below gets the full viewport height
  return (
    <nav className="site-nav">
      <div className="wrap nav-inner">
        <Link href="/" className="brand">
          <BrandMark />
          StayFound
        </Link>
        <div className="nav-links">
          <Link href="/#inside">Product</Link>
          <Link href="/#loop">How it works</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/about">About</Link>
        </div>
        <div className="nav-right">
          {/* Self-serve sign-up is off while we run reports by hand — the only
              way in is asking us for one. /sign-in still works by URL. */}
          <Link href="/demo" className="signin">
            Book a demo
          </Link>
          <Link href="/#report" className="btn btn-primary">
            Get my report <span className="arr">→</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
