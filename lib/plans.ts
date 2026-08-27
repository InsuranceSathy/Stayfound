// The plan catalogue, in one place because three things have to agree about it:
// the pricing cards, the checkout route that picks a Dodo product, and the
// webhook that maps a product id back to an entitlement. When those disagree
// the symptom is a customer paying the Agencies price and getting Solo, which
// is the kind of bug you hear about from the customer.
//
// Client-safe on purpose — nothing here reads env except `checkoutOpen`, which
// reads a NEXT_PUBLIC_ flag. Dodo product ids live in lib/dodo.ts, which is
// server-only.

export type PlanId = "free" | "solo" | "teams" | "agencies";
export type BillingInterval = "monthly" | "yearly";

export interface Plan {
  id: PlanId;
  name: string;
  /** USD per month, billed monthly. Yearly is ten of these — two months free. */
  monthly: number;
  /**
   * The struck-through "was" price, when the plan is being sold below list.
   *
   * Optional because most plans have no anchor, and absent rather than equal to
   * `monthly` so a card can never strike through the price it is charging.
   * Display only — `periodPrice` is what Dodo has to agree with.
   */
  anchor?: number;
  blurb: string;
  featured: boolean;
  /**
   * How many brands this plan may track, enforced in `addBrand`.
   *
   * The number is the source of truth and the feature line is written from it
   * below, because the two used to disagree: the cards sold three and ten
   * brands while the code allowed exactly one, so an agency paying to "add one
   * per client" could add one client.
   */
  brands: number;
  features: readonly string[];
}

/** The feature line for a brand allowance, so the card cannot promise a number
 *  the product does not enforce. */
function brandsLine(n: number, note = ""): string {
  return `${n} brand${n === 1 ? "" : "s"}${note}`;
}

export const PLANS: readonly Plan[] = [
  {
    id: "free",
    name: "Free",
    monthly: 0,
    blurb: "See where you stand. No card required.",
    featured: false,
    brands: 1,
    features: [
      brandsLine(1),
      "15 tracked prompts",
      "ChatGPT only",
      "Weekly refresh",
      "Visibility score + competitor ranking",
    ],
  },
  {
    id: "solo",
    name: "Solo",
    monthly: 14.99,
    anchor: 19.99,
    blurb: "For a single business owning its niche.",
    featured: true,
    brands: 1,
    features: [
      brandsLine(1),
      "30 tracked prompts",
      "All engines — ChatGPT, Gemini, Perplexity, Claude, Grok",
      "Daily refresh",
      "Sentiment + cited sources",
      "Content recommendations — the posts to write, with titles",
    ],
  },
  {
    id: "teams",
    name: "Teams",
    monthly: 149,
    blurb: "For teams ready to win AI search.",
    featured: false,
    brands: 5,
    features: [
      brandsLine(5),
      "150 tracked prompts",
      "Everything in Solo",
      "You-vs-Competitors tracking",
      "Optimization recommendations",
      "Email + Slack alerts",
    ],
  },
  {
    id: "agencies",
    name: "Agencies",
    monthly: 499,
    blurb: "Resell AI visibility — pays for itself inside one client retainer.",
    featured: false,
    brands: 20,
    features: [
      brandsLine(20, " — add one per client"),
      "1,000 tracked prompts",
      "Everything in Teams",
      "White-label reports & API access",
      "Per-client trend history & sentiment reporting",
      "Priority support",
    ],
  },
] as const;

/** Plans that are actually bought. Free is the absence of a subscription. */
export const PAID_PLAN_IDS = ["solo", "teams", "agencies"] as const;

export const BILLING_INTERVALS = ["monthly", "yearly"] as const;

export function getPlan(id: string): Plan | null {
  return PLANS.find((p) => p.id === id) ?? null;
}

/**
 * A plan that must exist — for callers naming one as a constant, where a miss
 * is a typo rather than user input. Throws at module load instead of rendering
 * a paywall with a blank name and "$undefined/mo".
 */
export function requirePlan(id: PlanId): Plan {
  const plan = getPlan(id);
  if (!plan) throw new Error(`Unknown plan: ${id}`);
  return plan;
}

export function isPaidPlan(id: string): id is (typeof PAID_PLAN_IDS)[number] {
  return (PAID_PLAN_IDS as readonly string[]).includes(id);
}

/**
 * How many months a yearly plan is charged for. Two months free is the whole
 * reason anyone picks yearly, so it is a named constant rather than a `* 10`
 * scattered across the pricing card and the Dodo product description.
 */
export const YEARLY_MONTHS = 10;

/**
 * What a plan costs for one billing period, in whole USD.
 *
 * This must match the price configured on the Dodo product. Dodo charges what
 * its product says, not what we display, so a mismatch here is a pricing page
 * that lies rather than an overcharge — but it is still the customer's word
 * against ours, so check both when changing either.
 */
export function periodPrice(plan: Plan, interval: BillingInterval): number {
  return interval === "yearly"
    ? round2(plan.monthly * YEARLY_MONTHS)
    : plan.monthly;
}

/** The "/mo" figure on the cards — a yearly plan spread back over 12 months. */
export function displayMonthly(plan: Plan, interval: BillingInterval): number {
  if (plan.monthly === 0) return 0;
  return interval === "yearly"
    ? round2((plan.monthly * YEARLY_MONTHS) / 12)
    : plan.monthly;
}

/** Two decimal places, without the float dust — 149.9/12 is 12.491666…, and
 *  0.1 + 0.2 is not 0.3 on any machine we ship to. */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * A price as people write it: `$15` stays `$15`, `$14.99` keeps its cents.
 *
 * Prices are no longer whole dollars, and `${plan.monthly}` renders 14.9 for
 * 14.90 and 149.9 for a year of it — a price that looks like a typo. Every
 * place that prints money goes through here so they cannot drift apart.
 */
export function formatUSD(amount: number): string {
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
}

/**
 * Whether the public site offers checkout at all.
 *
 * Off by default, which is the state the site launched in: the pricing page
 * says "no card required today" and every CTA books a waitlist spot, because
 * onboarding is still done by hand. Setting
 * `NEXT_PUBLIC_BILLING_CHECKOUT_ENABLED=1` swaps those CTAs for real Dodo
 * checkout and reveals the Billing panel on the dashboard.
 *
 * NEXT_PUBLIC_ because the pricing cards and the Billing panel are client
 * components and must agree with the route that enforces it — a Subscribe
 * button the server then refuses is worse than no button. Being inlined at
 * build time, flipping it needs a rebuild, not just a restart.
 *
 * The same check runs in /api/billing/checkout. Hiding the buttons only stops
 * the honest path; the route is public, so the server refusing is the only
 * thing that actually prevents a charge while the site advertises none.
 */
export function checkoutOpen(): boolean {
  return process.env.NEXT_PUBLIC_BILLING_CHECKOUT_ENABLED === "1";
}

/**
 * How many brands a plan may track. Unknown plan ids fall back to the Free
 * allowance rather than to unlimited — a bad id should cost nothing, never
 * grant everything.
 */
export function brandLimit(id: string): number {
  return getPlan(id)?.brands ?? 1;
}
