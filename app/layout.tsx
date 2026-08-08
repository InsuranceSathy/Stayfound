import type { Metadata } from "next";
import { Geist, Geist_Mono, Caveat, Newsreader, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next"
import { PostHogProvider } from "@/components/posthog-provider";
import { endorselyOrgId } from "@/lib/referral";
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

export const metadata: Metadata = {
  title: "StayFound — Be the brand AI keeps recommending",
  description:
    "StayFound tracks how ChatGPT, Gemini, Perplexity, Claude and Grok answer your buyers' questions — then shows you the fix that earns the next mention.",
  openGraph: {
    title: "StayFound — Be the brand AI keeps recommending",
    description:
      "The AI answer visibility suite. Monitor, optimize, and autopublish your way into every answer.",
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
      className={`${geistSans.variable} ${geistMono.variable} ${caveat.variable} ${newsreader.variable} ${plexMono.variable} antialiased`}
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
