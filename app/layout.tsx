import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Caveat,
  Newsreader,
  IBM_Plex_Mono,
  Archivo,
  Instrument_Sans,
} from "next/font/google";
import "./globals.css";
// The NF marketing design system (ported from the /design lab). Imported after
// globals.css on purpose: its :root token bridge must win the cascade.
import "./nf.css";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next"
import { PostHogProvider } from "@/components/posthog-provider";
import { endorselyOrgId } from "@/lib/referral";
import { SITE_URL } from "@/lib/site";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
});

// The answer is prose a machine wrote, so it is set in a text serif; the
// measurements around it are set in a mono. Two voices, no neutral SaaS sans.
const newsreader = Newsreader({
  variable: "--font-answer",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// The NF marketing faces. Archivo carries display sizes (its width axis lets
// headlines be tuned optically, not just bolded); Instrument Sans carries
// everything read at text size.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

const instrumentSans = Instrument_Sans({
  variable: "--font-inst-sans",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

export const metadata: Metadata = {
  // Without this, Next resolves file-convention images (the per-post
  // opengraph-image routes) against http://localhost:3000 at build time, and
  // every social preview in production points at a machine that isn't there.
  // Explicit canonicals elsewhere are unaffected — this only fixes the
  // generated ones.
  metadataBase: new URL(SITE_URL),
  title: "StayFound — Be the brand AI keeps recommending",
  description:
    "StayFound tracks how ChatGPT, Gemini, Perplexity, Claude and Grok answer your buyers' questions — then shows you the fix that earns the next mention.",
  openGraph: {
    title: "StayFound — Be the brand AI keeps recommending",
    description:
      "See what ChatGPT, Gemini, Perplexity and Claude say about your category — and get the exact pages that put you in the answer.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const orgId = endorselyOrgId();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${caveat.variable} ${newsreader.variable} ${plexMono.variable} ${archivo.variable} ${instrumentSans.variable} antialiased`}
    >
      <body>
        {children}
        {/* Affiliate attribution. Loads before the page is interactive so
            `window.endorsely_referral` is populated by the time anyone can
            click a Subscribe button — `afterInteractive` would race the
            checkout request on a fast click and silently lose the referral. */}
        {orgId && (
          <Script
            id="endorsely"
            strategy="beforeInteractive"
            src="https://assets.endorsely.com/endorsely.js"
            data-endorsely={orgId}
          />
        )}
        <Analytics />
        <PostHogProvider />
      </body>
    </html>
  );
}
