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
          <Link href="/sign-in" className="signin">
            Sign in
          </Link>
          <Link href="/sign-in" className="btn btn-primary">
            Get started <span className="arr">→</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
