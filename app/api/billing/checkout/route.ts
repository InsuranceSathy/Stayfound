// Start a Dodo Payments checkout for one of StayFound's plans.
//
// The request body chooses a plan and a billing period and nothing else. It
// does not carry a price, a product id, or a user id: the price lives on the
// Dodo product, the product id is resolved from this deployment's env, and the
// user comes from the verified session. A client that could name its own
// product could subscribe itself to a $0 one.

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getSubscription } from "@/lib/billing";
import {
  createCheckoutSession,
  isDodoConfigured,
  missingProductVar,
  productIdFor,
  DODO_NOT_CONFIGURED,
  DodoError,
} from "@/lib/dodo";
import { checkoutOpen, isPaidPlan, type BillingInterval } from "@/lib/plans";
import { SITE_URL } from "@/lib/site";

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: NO_STORE });
}

/**
 * Where Dodo sends the browser back to. Built from the request's own origin so
 * a preview deployment returns to itself rather than to production; SITE_URL is
 * the fallback for the case where the origin header is missing.
 */
function returnUrl(req: Request): string {
  let origin = SITE_URL;
  try {
    origin = new URL(req.url).origin || SITE_URL;
  } catch {
    /* keep the configured site url */
  }
  // `tab=overview` explicitly, because that is the only tab that renders the
  // Billing panel — relying on it being the default tab would break the
  // post-checkout confirmation the day the default changes.
  return `${origin.replace(/\/$/, "")}/dashboard?tab=overview&checkout=complete`;
}

/**
 * The affiliate referral id off the request body.
 *
 * The only body field this route trusts besides plan and interval, and the
 * exception is deliberate: Endorsely exposes the id as `window.endorsely_referral`
 * rather than a server-readable cookie, so the browser is the only thing that
 * can see it. It is safe to accept because it grants nothing — it decides who
 * is credited a commission, never what the payer receives — and self-referral
 * is equally possible by clicking your own link, so the body adds no new abuse.
 *
 * Length-capped: it ends up in Dodo's metadata on every payment we create.
 */
function referralId(body: { referral?: unknown }): string | null {
  const raw = body?.referral;
  return typeof raw === "string" && raw ? raw.slice(0, 200) : null;
}

export async function POST(req: Request) {
  // Enforced here, not just in the UI. Hiding the buttons stops the honest
  // path; this stops every other one, and a charge landing while the pricing
  // page says "no card required today" is the kind of mistake that gets
  // refunded loudly.
  if (!checkoutOpen()) {
    return fail(
      "Checkout isn't open yet — our team is onboarding brands by hand. Book a spot and we'll get you set up.",
      403,
    );
  }

  if (!isDodoConfigured()) return fail(DODO_NOT_CONFIGURED, 503);

  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;
  if (!user) return fail("Please sign in first.", 401);
  if (!user.email) return fail("This account has no email address to bill.", 400);

  let body: { plan?: unknown; interval?: unknown; referral?: unknown };
  try {
    body = await req.json();
  } catch {
    return fail("Invalid request.", 400);
  }

  const plan = String(body?.plan ?? "");
  const interval: BillingInterval = body?.interval === "yearly" ? "yearly" : "monthly";
  if (!isPaidPlan(plan)) return fail("Choose a paid plan.", 400);

  const productId = productIdFor(plan, interval);
  if (!productId) {
    // A missing product id is a deployment mistake, not a customer mistake, so
    // it names the variable to set instead of failing generically.
    return fail(
      `No Dodo product configured for the ${plan} ${interval} plan. Set ${missingProductVar(plan, interval)}.`,
      503,
    );
  }

  // Reuse the Dodo customer if this account has subscribed before, so a
  // re-subscribe keeps one invoice history instead of creating a second
  // customer with the same email.
  const existing = await getSubscription(user.id);

  try {
    const checkout = await createCheckoutSession({
      productId,
      userId: user.id,
      email: user.email,
      name: user.name,
      plan,
      interval,
      returnUrl: returnUrl(req),
      customerId: existing.customerId,
      referralId: referralId(body),
    });
    return NextResponse.json({ url: checkout.url }, { headers: NO_STORE });
  } catch (err) {
    // The Dodo error body can name the API key and the product; it belongs in
    // the server log, not in a response the browser can read.
    console.error("dodo checkout failed:", err);
    const badKey = err instanceof DodoError && err.status === 401;
    return fail(
      badKey
        ? "Dodo Payments rejected this deployment's API key."
        : "Couldn't start checkout. Please try again.",
      badKey ? 503 : 502,
    );
  }
}
