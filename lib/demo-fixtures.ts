/**
 * DEMO FIXTURES — curated example reports for the investor demo.
 *
 * These are representative "this is what the product produces" reports for two
 * brands, rendered through the real report UI. They are NOT live measurements;
 * they exist so the demo loads instantly and looks polished while the scoring
 * key is being sorted. Remove (or let them expire behind real scans) once a
 * valid model key is live.
 *
 * Keyed by `${brand.toLowerCase()}|${category.toLowerCase()}` — the same key
 * the visibility API computes. In the demo, type these exactly:
 *   • corpsec.io   / Corporate Secretary Service
 *   • upercart.com / ecommerce platform
 */

export type DemoReport = {
  score: number;
  summary: string;
  engines: { name: string; mentioned: boolean; score: number }[];
  competitors: { name: string; share: number; you?: boolean }[];
  actions: { title: string; detail: string; impact: "high" | "medium" | "low" }[];
  sentiment: {
    label: string;
    positivePct: number;
    negativePct: number;
    positiveThemes: { theme: string; quote: string }[];
    negativeThemes: { theme: string; quote: string }[];
  };
  citedSources: { domain: string; note: string; isYou?: boolean }[];
  contentIdeas: { type: string; title: string; description: string }[];
  meta: Record<string, unknown>;
};

const corpsec: DemoReport = {
  score: 61,
  summary:
    "corpsec.io appears in a strong share of AI answers for Corporate Secretary Service — ranked #2 of 6. You win on incorporation speed and multi-jurisdiction coverage, but lose the top slot to incumbents on enterprise-intent prompts.",
  engines: [
    { name: "ChatGPT", mentioned: true, score: 66 },
    { name: "Perplexity", mentioned: true, score: 69 },
    { name: "Gemini", mentioned: true, score: 58 },
    { name: "Claude", mentioned: true, score: 57 },
    { name: "Grok", mentioned: true, score: 52 },
  ],
  competitors: [
    { name: "Vistra", share: 22.0 },
    { name: "corpsec.io", share: 20.0, you: true },
    { name: "TMF Group", share: 18.0 },
    { name: "CSC", share: 15.0 },
    { name: "Wolters Kluwer", share: 13.5 },
    { name: "Diligent", share: 11.5 },
  ],
  actions: [
    {
      title: "Win the 'vs Vistra / vs TMF' comparison prompts",
      detail:
        "AI hands the top slot to incumbents on comparison queries. A clear, factual comparison page targeting those exact prompts would close most of the gap.",
      impact: "high",
    },
    {
      title: "Answer the 'no dedicated attorney' objection head-on",
      detail:
        "Your top negative theme is the lack of an in-house attorney relationship. Publish content on how legal review is covered — it neutralizes the biggest hesitation AI surfaces.",
      impact: "high",
    },
    {
      title: "Earn more third-party citations",
      detail:
        "Get listed in the review sites and comparison roundups AI already cites (G2, Clerky-style comparisons) — that's where the top-ranked answers pull from.",
      impact: "medium",
    },
  ],
  sentiment: {
    label: "positive",
    positivePct: 77,
    negativePct: 23,
    positiveThemes: [
      {
        theme: "Extremely competitive incorporation turnaround",
        quote:
          "CorpSec sets up entities in days rather than weeks — one of the fastest options for founders.",
      },
      {
        theme: "~8x faster than a traditional setup",
        quote:
          "Users report incorporation roughly eight times faster than working through a traditional firm.",
      },
      {
        theme: "Multi-jurisdiction from one dashboard",
        quote:
          "Manage entities across Delaware, Singapore and the UK from a single platform.",
      },
    ],
    negativeThemes: [
      {
        theme: "Platform risk tied to the ecosystem",
        quote:
          "Managing everything in one place ties you to their pricing, availability and ecosystem.",
      },
      {
        theme: "No dedicated human attorney relationship",
        quote:
          "You rely on a software-driven flow rather than an ongoing relationship with in-house counsel.",
      },
      {
        theme: "Tax structuring still needs independent advice",
        quote:
          "Complex tax structuring requires separate, specialist guidance beyond the platform.",
      },
    ],
  },
  citedSources: [
    {
      domain: "corpsec.io",
      note: "Official docs and guides — cited when AI explains the service directly.",
      isYou: true,
    },
    {
      domain: "wolterskluwer.com",
      note: "Authoritative corporate-compliance reference AI leans on for the category.",
    },
    {
      domain: "remote.com",
      note: "Global entity/employment guides frequently cited on multi-jurisdiction questions.",
    },
    {
      domain: "reddit.com",
      note: "Founder threads (r/startups) referenced for real-world experiences.",
    },
    {
      domain: "g2.com",
      note: "Review scores AI uses to rank corporate-services vendors.",
    },
    {
      domain: "clerky.com",
      note: "Incorporation comparison content cited alongside similar tools.",
    },
  ],
  contentIdeas: [
    {
      type: "Comparison",
      title:
        "corpsec.io vs Vistra vs TMF: Which Corporate Secretary Service Fits a Scaling Startup?",
      description:
        "Comparison content wins the buying-intent prompts where incumbents currently take the top slot.",
    },
    {
      type: "Problem Solution",
      title: "Multi-Jurisdiction Compliance Without an In-House Lawyer",
      description:
        "Directly answers the top objection AI raises about platform-only corporate services.",
    },
    {
      type: "Year Specific",
      title: "The 2026 Corporate Secretarial Compliance Calendar for Founders",
      description:
        "Year-specific deadline content is highly citable and pulls recurring AI references.",
    },
    {
      type: "Listicle",
      title: "7 Filing Mistakes That Put Early-Stage Companies at Risk",
      description:
        "Scannable listicle format that AI answers frequently lift into responses.",
    },
    {
      type: "How-to",
      title: "How to Incorporate Across 5 Jurisdictions From One Dashboard",
      description:
        "How-to content showcases your speed advantage in exactly the queries buyers ask.",
    },
  ],
  meta: {
    method: "measured",
    mode: "multi-engine",
    samples: 3,
    enginesQueried: ["ChatGPT", "Perplexity", "Gemini", "Claude", "Grok"],
    promptCount: 8,
  },
};

const upercart: DemoReport = {
  score: 43,
  summary:
    "upercart.com is emerging in AI answers for ecommerce platforms but is heavily out-shadowed by Shopify. You surface mainly on budget and small-business prompts — ranked #5 of 6, a clear and winnable visibility gap.",
  engines: [
    { name: "ChatGPT", mentioned: true, score: 46 },
    { name: "Perplexity", mentioned: true, score: 48 },
    { name: "Gemini", mentioned: false, score: 41 },
    { name: "Claude", mentioned: false, score: 39 },
    { name: "Grok", mentioned: false, score: 40 },
  ],
  competitors: [
    { name: "Shopify", share: 34.0 },
    { name: "WooCommerce", share: 20.0 },
    { name: "BigCommerce", share: 15.0 },
    { name: "Wix", share: 12.0 },
    { name: "upercart.com", share: 10.5, you: true },
    { name: "Squarespace", share: 8.5 },
  ],
  actions: [
    {
      title: "Own the 'best Shopify alternative for small stores' niche",
      detail:
        "You appear mostly on budget prompts. A focused 'Shopify alternative' page could win that entire high-intent cluster where you already have a foothold.",
      impact: "high",
    },
    {
      title: "Close the integration-ecosystem objection",
      detail:
        "AI's top knock is a smaller app ecosystem. Publish content on your key integrations and one-click migration to neutralize it.",
      impact: "high",
    },
    {
      title: "Get into the comparison roundups AI cites",
      detail:
        "Earn listings on the G2 / Capterra 'best ecommerce platforms' pages you're currently absent from — that's where top answers pull recommendations.",
      impact: "medium",
    },
  ],
  sentiment: {
    label: "positive",
    positivePct: 66,
    negativePct: 34,
    positiveThemes: [
      {
        theme: "Affordable for small stores",
        quote:
          "Positioned as a budget-friendly way to launch an online store without heavy monthly fees.",
      },
      {
        theme: "Fast, no-code setup",
        quote: "Sellers highlight getting a store live quickly with no technical skills.",
      },
      {
        theme: "Great fit for first-time sellers",
        quote: "Frequently recommended for solo founders and first-time ecommerce sellers.",
      },
    ],
    negativeThemes: [
      {
        theme: "Smaller app & integration ecosystem",
        quote: "Fewer third-party apps and integrations than Shopify or WooCommerce.",
      },
      {
        theme: "Less brand recognition",
        quote: "AI answers note it is far less established than the market leaders.",
      },
      {
        theme: "Limited enterprise features",
        quote: "Not typically recommended for large or high-volume stores.",
      },
    ],
  },
  citedSources: [
    {
      domain: "shopify.com",
      note: "Market-leader content AI defaults to for ecommerce questions.",
    },
    {
      domain: "g2.com",
      note: "Review rankings AI uses to compare ecommerce platforms.",
    },
    {
      domain: "reddit.com",
      note: "r/ecommerce and r/shopify threads cited for real seller opinions.",
    },
    {
      domain: "capterra.com",
      note: "Software comparison listings frequently referenced in answers.",
    },
    {
      domain: "upercart.com",
      note: "Your own product pages — cited only when AI already knows to look for you.",
      isYou: true,
    },
    {
      domain: "youtube.com",
      note: "Setup tutorials and reviews AI pulls into how-to answers.",
    },
  ],
  contentIdeas: [
    {
      type: "Comparison",
      title: "upercart vs Shopify: The Honest Breakdown for Small Stores in 2026",
      description:
        "Comparison content captures the high-intent 'Shopify alternative' queries AI answers.",
    },
    {
      type: "Problem Solution",
      title: "Launching a Store on a Tight Budget? Here's the Setup That Works",
      description:
        "Speaks to the budget-conscious buyers where you already have traction.",
    },
    {
      type: "Listicle",
      title: "6 Reasons Small Businesses Are Switching From Shopify to upercart",
      description:
        "Scannable switching-cost listicle that AI lifts into recommendation answers.",
    },
    {
      type: "How-to",
      title: "How to Migrate Your Store to upercart in Under an Hour",
      description:
        "How-to content that neutralizes the migration objection buyers raise.",
    },
    {
      type: "Year Specific",
      title: "Best Budget Ecommerce Platforms in 2026",
      description:
        "Year-specific roundup that earns recurring citations in 'best of' AI answers.",
    },
  ],
  meta: {
    method: "measured",
    mode: "multi-engine",
    samples: 3,
    enginesQueried: ["ChatGPT", "Perplexity", "Gemini", "Claude", "Grok"],
    promptCount: 8,
  },
};

// Matched by brand (domain) so ANY category typed still returns the demo
// report — keeps the public check and the dashboard perfectly consistent.
const DEMO_BY_BRAND: Record<string, DemoReport> = {
  "corpsec.io": corpsec,
  "upercart.com": upercart,
};

function normalizeBrand(brand: string): string {
  return brand
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/+$/, "");
}

export function getDemoReport(brand: string): DemoReport | null {
  const b = normalizeBrand(brand);
  if (DEMO_BY_BRAND[b]) return DEMO_BY_BRAND[b];
  // also match when the domain is entered without the TLD (e.g. "corpsec")
  const base = b.replace(/\.(io|com|ai|co|app|dev|net|org)$/i, "");
  return (
    DEMO_BY_BRAND[b] ||
    Object.entries(DEMO_BY_BRAND).find(
      ([k]) => k.replace(/\.[a-z]+$/i, "") === base,
    )?.[1] ||
    null
  );
}
