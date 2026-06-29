import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

export function SiteHeader() {
  return (
    <nav>
      <div className="wrap nav-inner">
        <Link href="/" className="brand">
          <BrandMark />
          Surfaced
        </Link>
        <div className="nav-links">
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
