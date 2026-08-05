import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Caveat } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"
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
  // Installed-to-home-screen behaviour on iOS: run standalone, and let the
  // dark UI extend under the status bar.
  appleWebApp: {
    capable: true,
    title: "StayFound",
    statusBarStyle: "black-translucent",
  },
};

// themeColor lives here — the metadata option was deprecated in Next 14.
export const viewport: Viewport = {
  themeColor: "#08070d",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  // Let the app paint into the notch / home-indicator area; the CSS below
  // pads interactive edges back out with env(safe-area-inset-*).
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${caveat.variable} antialiased`}
    >
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
