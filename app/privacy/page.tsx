import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Privacy Policy — Surfaced",
  description: "How Surfaced collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="wrap legal">
        <p className="eyebrow">Legal</p>
        <h1 className="legal-title">Privacy Policy</h1>
        <p className="legal-meta">Effective June 23, 2026</p>

        <div className="legal-note">
          This is a starting template, not legal advice. Have it reviewed by
          counsel and tailored to your jurisdiction (e.g. GDPR/CCPA) before
          launch.
        </div>

        <h2>1. What we collect</h2>
        <ul>
          <li>
            <strong>Account data</strong> — your name, email, and profile image
            when you sign in with Google.
          </li>
          <li>
            <strong>Brand data</strong> — the brands, categories, and prompts you
            ask us to track.
          </li>
          <li>
            <strong>Usage data</strong> — how you interact with the Service, for
            reliability and improvement.
          </li>
          <li>
            <strong>Demo requests</strong> — the details you submit through our
            contact form.
          </li>
        </ul>

        <h2>2. How we use it</h2>
        <p>
          We use your data to provide the Service, generate visibility insights,
          communicate with you, secure our systems, and improve our product. We do
          not sell your personal data.
        </p>

        <h2>3. Google sign-in</h2>
        <p>
          When you sign in with Google, we receive your basic profile (name,
          email, and avatar) to create and secure your account. We request only
          the scopes needed to authenticate you, and we don&apos;t access your
          Google data beyond that.
        </p>

        <h2>4. AI engine queries</h2>
        <p>
          To measure your visibility, we send prompts about your category to
          third-party AI engines. These prompts are crafted by us or configured by
          you; we don&apos;t share your account credentials with those engines.
          Their handling of queries is governed by their own policies.
        </p>

        <h2>5. Cookies</h2>
        <p>
          We use strictly necessary cookies to keep you signed in and to secure
          sessions. We use minimal analytics to understand product usage. You can
          control cookies through your browser settings.
        </p>

        <h2>6. Sharing</h2>
        <p>
          We share data only with service providers who help us operate the
          Service (such as hosting, database, and AI infrastructure providers),
          under appropriate confidentiality and data-processing terms, or when
          required by law.
        </p>

        <h2>7. Storage &amp; security</h2>
        <p>
          Your data is stored with reputable cloud providers and protected with
          encryption in transit and access controls. No system is perfectly
          secure, but we work to protect your information.
        </p>

        <h2>8. Retention</h2>
        <p>
          We keep your data while your account is active and as needed to provide
          the Service. You can request deletion at any time, subject to legal
          retention requirements.
        </p>

        <h2>9. Your rights</h2>
        <p>
          Depending on where you live, you may have rights to access, correct,
          export, or delete your personal data, and to object to certain
          processing. To exercise them, contact us.
        </p>

        <h2>10. Children</h2>
        <p>
          Surfaced is not intended for anyone under 18, and we don&apos;t
          knowingly collect their data.
        </p>

        <h2>11. Changes</h2>
        <p>
          We may update this policy. Material changes will be communicated through
          the Service or by email. The effective date above reflects the latest
          version.
        </p>

        <h2>12. Contact</h2>
        <p>
          For privacy questions or requests, email{" "}
          <a href="mailto:privacy@surfaced.app" className="legal-link">
            privacy@surfaced.app
          </a>
          . See also our{" "}
          <Link href="/terms" className="legal-link">
            Terms of Service
          </Link>
          .
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
