import type { VisibilityResult } from "@/lib/visibility";
import type { Brand, Snapshot } from "@/lib/queries";

/**
 * A complete, invented scan used to preview the report templates.
 *
 * Every field the templates read is populated and internally consistent — the
 * share-of-voice column sums, the leader really does lead, the sentiment split
 * matches the themes — because a sample whose numbers contradict each other
 * teaches the wrong thing about the product to whoever is being shown it.
 *
 * The brand is fictional. Real third-party platforms appear in the citation
 * list because that is what a citation list actually looks like, but nothing
 * here is a claim about any real company.
 */

const RESULT: VisibilityResult = {
  score: 58,
  summary:
    "Kestrel Supply appears in just under half of the AI answers for commercial kitchen equipment — ranked #3 of 6. Assistants know you for fast trade delivery and honest spec sheets, but hand the top slot to Ridgeline on any question phrased around price or nationwide coverage.",
  engines: [
    { name: "ChatGPT", mentioned: true, score: 64 },
    { name: "Perplexity", mentioned: true, score: 71 },
    { name: "Gemini", mentioned: true, score: 55 },
    { name: "Claude", mentioned: true, score: 52 },
    { name: "Grok", mentioned: false, score: 31 },
  ],
  competitors: [
    { name: "Ridgeline Supply", share: 26 },
    { name: "Copperfield Kitchen", share: 21 },
    { name: "Kestrel Supply", share: 18, you: true },
    { name: "Basin Trade Co.", share: 15 },
    { name: "Halyard Equipment", share: 12 },
    { name: "Fenwick Catering", share: 8 },
  ],
  actions: [
    {
      title: "Publish a real price-and-lead-time page",
      detail:
        "Every assistant that ranked Ridgeline above you cited a page with visible pricing and delivery windows. You have neither on a crawlable page, so the models answer price questions using someone else's numbers. Ship a page listing bands and lead times per category, and mark it up with Product and Offer schema so it can be quoted directly.",
      impact: "high",
    },
    {
      title: "Answer the 'nationwide coverage' objection directly",
      detail:
        "Your strongest negative theme is regional limitation — three of five engines volunteer it unprompted. Publish your service map with named metros and next-day zones. State plainly which regions you do not serve; models reward pages that resolve the question over pages that dodge it.",
      impact: "high",
    },
    {
      title: "Get listed where the category roster lives",
      detail:
        "Assistants build the shortlist for this category from a small set of trade directories and roundups. You are absent from four of the six they cite most. Each listing is a durable citation and inclusion moves you into the default answer set.",
      impact: "medium",
    },
    {
      title: "Add Organization schema naming the category",
      detail:
        "Your homepage never states the category in machine-readable form, so entity resolution is doing it by inference. Add Organization and LocalBusiness schema that names the category explicitly and links your verified profiles.",
      impact: "medium",
    },
  ],
  sentiment: {
    label: "positive",
    positivePct: 71,
    negativePct: 29,
    positiveThemes: [
      {
        theme: "Fast trade delivery",
        quote:
          "Kestrel ships most stock lines next day, which is unusual for commercial kitchen equipment.",
      },
      {
        theme: "Honest, complete spec sheets",
        quote:
          "Their listings include full dimensions and power draw, so you can plan a fit-out without calling.",
      },
      {
        theme: "Strong independent-operator focus",
        quote:
          "Often recommended for single-site restaurants rather than national chains.",
      },
    ],
    negativeThemes: [
      {
        theme: "Regional coverage is limited",
        quote:
          "Delivery is reliable in the northeast but thinner elsewhere in the country.",
      },
      {
        theme: "Pricing is not published",
        quote:
          "You have to request a quote, which makes quick comparison difficult.",
      },
    ],
  },
  citedSources: [
    {
      domain: "kestrelsupply.com",
      note: "Product pages with full specifications — cited when assistants describe your range.",
      isYou: true,
    },
    {
      domain: "reddit.com",
      note: "r/KitchenConfidential threads where operators compare suppliers by delivery speed.",
      isYou: false,
    },
    {
      domain: "foodservice-equipment-reports.com",
      note: "Trade publication roundups that form the shortlist assistants repeat.",
      isYou: false,
    },
    {
      domain: "g2.com",
      note: "Vendor comparison grids used to rank suppliers on service and support.",
      isYou: false,
    },
    {
      domain: "ridgelinesupply.com",
      note: "Competitor pricing pages quoted verbatim on cost questions.",
      isYou: false,
    },
    {
      domain: "restaurantware-directory.com",
      note: "Category directory that assistants treat as the roster of credible suppliers.",
      isYou: false,
    },
  ],
  contentIdeas: [
    {
      type: "comparison",
      title:
        "Kestrel vs Ridgeline vs Copperfield: Which Kitchen Supplier Fits an Independent Restaurant?",
      description:
        "Comparison pages win the buying-intent prompts where incumbents currently take the top slot.",
    },
    {
      type: "pricing",
      title: "What Commercial Kitchen Equipment Actually Costs in 2026",
      description:
        "Directly answers the question that currently sends assistants to a competitor's page.",
    },
    {
      type: "how-to",
      title: "How to Spec a Full Kitchen Fit-Out From One Supplier",
      description:
        "How-to content showcases the spec-sheet completeness assistants already praise.",
    },
    {
      type: "year specific",
      title: "The 2026 Commercial Kitchen Equipment Buyer's Guide",
      description:
        "Year-stamped guides are highly citable and pull recurring references.",
    },
    {
      type: "listicle",
      title: "9 Equipment Mistakes That Sink a First Restaurant Build",
      description:
        "Scannable listicle format that AI answers frequently lift into responses.",
    },
  ],
};

export const SAMPLE_BRAND: Brand = {
  id: "sample",
  user_id: "sample",
  name: "kestrelsupply.com",
  category: "Commercial kitchen equipment supplier",
  market: "United States",
  created_at: "2026-05-02T09:00:00.000Z",
};

/** Readings on a plausible upward trend, newest first — the order the queries
 *  return and the order every template expects. */
export const SAMPLE_HISTORY: Snapshot[] = [
  ["2026-08-14", 58],
  ["2026-07-31", 54],
  ["2026-07-17", 51],
  ["2026-07-03", 49],
  ["2026-06-19", 44],
  ["2026-06-05", 41],
].map(([date, score], i) => ({
  id: `sample-${i}`,
  brand_id: "sample",
  score: score as number,
  live: true,
  data: RESULT,
  created_at: `${date}T09:00:00.000Z`,
}));

export const SAMPLE_SNAPSHOT: Snapshot = SAMPLE_HISTORY[0];
