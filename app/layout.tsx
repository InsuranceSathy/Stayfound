import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Surfaced — Win customers in AI search",
  description:
    "See how ChatGPT, Gemini, Perplexity, Claude, and Grok talk about your brand — then take action to win the leads before your competitors do.",
  openGraph: {
    title: "Surfaced — Win customers in AI search",
    description:
      "The AI search visibility suite. Monitor, optimize, and autopublish your way to the top of every answer.",
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
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}
