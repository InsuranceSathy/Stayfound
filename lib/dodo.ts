// Dodo Payments client — StayFound's own subscription billing.
//
// SERVER ONLY. It reads DODO_API_KEY; importing it from a client component
// would inline a live API key into the browser bundle.
//
// Raw fetch rather than the `dodopayments` SDK: three endpoints are used in
// total, and the SDK would be the only payment dependency in a project whose
// other integrations are all plain fetch.
//
// StayFound.tech is a *secondary brand* under the same Dodo business as
// NumberHill, so the API key and webhook secret are shared with that business
// while every DODO_PRODUCT_* id below must be a product created under the
// StayFound brand. Getting that wrong is silent: the charge succeeds, it just
// lands on the wrong brand's statement descriptor and invoices.
//
// Test vs live is chosen by DODO_ENVIRONMENT, not by sniffing the key, because
// the failure modes are asymmetric: a test key against the live host fails
// loudly and harmlessly, while a live key against the test host would silently
// take no money at all. Default is `test`, so an unconfigured deployment cannot
// accidentally charge anyone.
//
// The business is India-based, so checkouts bill in INR with GST. Test
// payments therefore need Dodo's *India* test cards — Stripe's 4242 card fails
// with a generic "something went wrong" that looks like a broken integration.
// See https://docs.dodopayments.com/miscellaneous/testing-process.

import {
  BILLING_INTERVALS,
  PAID_PLAN_IDS,
  isPaidPlan,
  type BillingInterval,
  type PlanId,
} from "./plans";

const HOSTS = {
  test: "https://test.dodopayments.com",
  live: "https://live.dodopayments.com",
} as const;

export type DodoEnvironment = keyof typeof HOSTS;

export function dodoEnvironment(): DodoEnvironment {
  return process.env.DODO_ENVIRONMENT === "live" ? "live" : "test";
}

export function isDodoConfigured(): boolean {
  return Boolean(process.env.DODO_API_KEY);
}

export const DODO_NOT_CONFIGURED =
  "Dodo Payments is not configured. Set DODO_API_KEY and the DODO_PRODUCT_* product ids, then restart.";

/**
 * The Dodo product a (plan, interval) pair maps to.
 *
 * One product per billing period, which is how Dodo models it — a yearly plan
 * is a separate product with its own id, not a flag on the monthly one.
 */
function productEnvVar(plan: PlanId, interval: BillingInterval): string {
  return `DODO_PRODUCT_${plan.toUpperCase()}_${interval.toUpperCase()}`;
}

export function productIdFor(
  plan: PlanId,
  interval: BillingInterval,
): string | null {
  if (!isPaidPlan(plan)) return null;
  return process.env[productEnvVar(plan, interval)] || null;
}

/**
 * Whether yearly plans can be sold at all.
 *
 * Yearly is optional: the account launched with three monthly products and no
 * yearly ones, and an interval toggle that offers a plan the checkout route
 * then refuses is worse than no toggle. Every paid plan must have a yearly
 * product before the toggle appears — a half-configured toggle would let
 * someone pick Yearly on Solo and then fail on Teams.
 *
 * Server-only, so the pricing page reads it and passes the answer down.
 */
export function yearlyConfigured(): boolean {
  return PAID_PLAN_IDS.every((plan) => Boolean(productIdFor(plan, "yearly")));
}

/** The env var name to set when a product id is missing, for error messages. */
export function missingProductVar(
  plan: PlanId,
  interval: BillingInterval,
): string {
  return productEnvVar(plan, interval);
}

/**
 * The (plan, interval) a Dodo product id means — the inverse of productIdFor.
 *
 * The webhook needs this: a `subscription.active` payload names a product, and
 * the entitlement it grants must come from our own configuration rather than
 * from anything in the payload. Returns null for a product this deployment
 * does not recognise, so a webhook for NumberHill's products — same Dodo
 * business, same webhook secret — can never grant a StayFound plan.
 */
export function planForProduct(
  productId: string | null | undefined,
): { plan: PlanId; interval: BillingInterval } | null {
  if (!productId) return null;
  for (const plan of PAID_PLAN_IDS) {
    for (const interval of BILLING_INTERVALS) {
      if (process.env[productEnvVar(plan, interval)] === productId) {
        return { plan, interval };
      }
    }
  }
  return null;
}

export class DodoError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "DodoError";
  }
}

async function dodoFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const key = process.env.DODO_API_KEY;
  if (!key) throw new DodoError(DODO_NOT_CONFIGURED, 500);

  const res = await fetch(`${HOSTS[dodoEnvironment()]}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    // Billing calls are never cached: a stale checkout url is a checkout that
    // 404s.
    cache: "no-store",
  });

  const text = await res.text();
  if (!res.ok) {
    // Dodo returns JSON errors, but a gateway in front of it may not. Either
    // way the body is for our logs only — see the routes, which never forward
    // it to the browser.
    throw new DodoError(
      `Dodo ${init?.method ?? "GET"} ${path} -> ${res.status}: ${text}`,
      res.status,
    );
  }
  return text ? (JSON.parse(text) as T) : ({} as T);
}

export interface CheckoutSession {
  /** Where to send the browser to pay. */
  url: string;
  sessionId: string | null;
}

/**
 * Opens a hosted checkout for one subscription product.
 *
 * `metadata.user_id` is the only link between the payment and the account, and
 * it is set here from the *authenticated* user — never from a request body.
 * The webhook trusts it because Dodo echoes back exactly what we sent, signed.
 */
export async function createCheckoutSession(opts: {
  productId: string;
  userId: string;
  email: string;
  name?: string | null;
  plan: PlanId;
  interval: BillingInterval;
  returnUrl: string;
  customerId?: string | null;
}): Promise<CheckoutSession> {
  const body = {
    product_cart: [{ product_id: opts.productId, quantity: 1 }],
    // An existing customer id keeps a re-subscribe attached to the same Dodo
    // customer, so their payment methods and invoice history stay in one place.
    customer: opts.customerId
      ? { customer_id: opts.customerId }
      : { email: opts.email, name: opts.name || opts.email.split("@")[0] },
    return_url: opts.returnUrl,
    metadata: {
      user_id: opts.userId,
      plan: opts.plan,
      interval: opts.interval,
    },
  };

  const json = await dodoFetch<{
    checkout_url?: string;
    payment_link?: string;
    session_id?: string;
  }>("/checkouts", { method: "POST", body: JSON.stringify(body) });

  const url = json.checkout_url || json.payment_link;
  if (!url) throw new DodoError("Dodo returned no checkout url", 502);
  return { url, sessionId: json.session_id ?? null };
}

/**
 * A link to Dodo's hosted customer portal, where a subscriber changes their
 * card, switches plan or cancels.
 *
 * Cancellation is deliberately not reimplemented here: doing it ourselves
 * would mean our idea of the subscription state and Dodo's could diverge, and
 * Dodo's is the one that decides whether the next charge happens.
 */
export async function createPortalSession(customerId: string): Promise<string> {
  const json = await dodoFetch<{ link?: string; url?: string }>(
    `/customers/${encodeURIComponent(customerId)}/customer-portal/session?send_email=false`,
    { method: "POST" },
  );
  const link = json.link || json.url;
  if (!link) throw new DodoError("Dodo returned no portal link", 502);
  return link;
}
