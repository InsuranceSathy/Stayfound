import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { MobileMenu } from "@/components/mobile-menu";

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
          <Link href="/blog">Blog</Link>
          <Link href="/about">About</Link>
        </div>
        <div className="nav-right">
          {/* Checkout is open, so there are accounts to come back to. Sign in
              was reachable only by typing the URL, which is fine for a private
              beta and not fine once someone is paying monthly. */}
          <Link href="/sign-in" className="signin">
            Sign in
          </Link>
          <Link href="/demo" className="signin nav-demo">
            Book a demo
          </Link>
          <Link href="/#report" className="btn btn-primary">
            Check my brand
          </Link>
          <MobileMenu />
        </div>
      </div>
    </nav>
  );
}
