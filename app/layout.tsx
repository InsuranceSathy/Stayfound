import type { Metadata } from "next";
import { Geist, Geist_Mono, Caveat } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next"
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
      className={`${geistSans.variable} ${geistMono.variable} ${caveat.variable} antialiased`}
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
      </body>
    </html>
  );
}
