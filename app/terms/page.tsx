import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Terms of Service — StayFound",
  description: "The terms that govern your use of StayFound.",
};

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main className="wrap legal">
        <p className="eyebrow">Legal</p>
        <h1 className="legal-title">Terms of Service</h1>
        <p className="legal-meta">Effective June 23, 2026</p>

        <div className="legal-note">
          This is a starting template, not legal advice. Have it reviewed by
          counsel before launch.
        </div>

        <h2>1. Agreement</h2>
        <p>
          These Terms govern your access to and use of StayFound (the
          &ldquo;Service&rdquo;), operated by StayFound (&ldquo;we,&rdquo;
          &ldquo;us&rdquo;). By creating an account or using the Service, you
          agree to these Terms. If you&apos;re using StayFound on behalf of a
          company, you represent that you&apos;re authorized to bind it.
        </p>

        <h2>2. The Service</h2>
        <p>
          StayFound helps you monitor and improve how your brand appears in
          AI-powered search and answer engines. Visibility scores, rankings, and
          recommendations are estimates based on observed and modeled data, and
          are provided for informational purposes — they are not guarantees of
          any outcome.
        </p>

        <h2>3. Accounts</h2>
        <p>
          You&apos;re responsible for safeguarding your account and for all
          activity under it. Keep your credentials secure and notify us promptly
          of any unauthorized use. You must provide accurate information and be at
          least 18 years old.
        </p>

        <h2>4. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Service to violate any law or third party&apos;s rights;</li>
          <li>Reverse engineer, resell, or abuse the Service or its rate limits;</li>
          <li>Submit data you don&apos;t have the right to submit;</li>
          <li>Interfere with the integrity or performance of the Service.</li>
        </ul>

        <h2>5. Subscriptions &amp; billing</h2>
        <p>
          Paid plans are billed in advance on a recurring basis. Fees are
          non-refundable except where required by law. You can change or cancel
          your plan at any time from your dashboard; changes take effect at the
          end of the current billing period unless stated otherwise. We may change
          pricing with reasonable notice.
        </p>

        <h2>6. Your data</h2>
        <p>
          You retain ownership of the brand and content data you submit. You grant
          us a limited license to process it to provide and improve the Service,
          as described in our{" "}
          <Link href="/privacy" className="legal-link">
            Privacy Policy
          </Link>
          . We do not sell your data.
        </p>

        <h2>7. Third-party AI engines</h2>
        <p>
          StayFound queries third-party engines (such as ChatGPT, Gemini,
          Perplexity, Claude, and Grok). We don&apos;t control those services,
          their outputs, or their availability, and we&apos;re not responsible for
          them. Their results may change at any time.
        </p>

        <h2>8. Intellectual property</h2>
        <p>
          The Service, including its software, design, and content (excluding your
          data), is owned by us and protected by law. We grant you a limited,
          non-exclusive, non-transferable right to use it under these Terms.
        </p>

        <h2>9. Disclaimers</h2>
        <p>
          The Service is provided &ldquo;as is&rdquo; without warranties of any
          kind. We don&apos;t warrant that visibility estimates are accurate or
          that the Service will be uninterrupted or error-free.
        </p>

        <h2>10. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, we are not liable for indirect,
          incidental, or consequential damages, and our total liability is limited
          to the amount you paid us in the twelve months before the claim.
        </p>

        <h2>11. Termination</h2>
        <p>
          You may stop using the Service at any time. We may suspend or terminate
          access if you breach these Terms. Sections that by their nature should
          survive termination will survive.
        </p>

        <h2>12. Changes</h2>
        <p>
          We may update these Terms. If we make material changes, we&apos;ll
          provide reasonable notice. Continued use after changes take effect means
          you accept the updated Terms.
        </p>

        <h2>13. Contact</h2>
        <p>
          Questions about these Terms? Reach us through our{" "}
          <Link href="/demo" className="legal-link">
            contact form
          </Link>
          .
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
