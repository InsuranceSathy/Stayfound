import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

export function SiteFooter() {
  return (
    <footer>
      <div className="wrap foot-inner">
        <Link href="/" className="brand">
          <BrandMark />
          StayFound
        </Link>
        <div className="foot-links">
          <Link href="/#inside">Product</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/about">About</Link>
          <Link href="/demo">Book a demo</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
        </div>
        <div className="copy">© 2026 StayFound</div>
      </div>
    </footer>
  );
}
