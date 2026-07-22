import type { Metadata } from "next";
import { Geist, Geist_Mono, Caveat } from "next/font/google";
import "./globals.css";

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
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${caveat.variable} antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}
