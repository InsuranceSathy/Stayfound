// Subscription state: what a Dodo webhook means, and how it is written down.
//
// The parsing half is pure — it needs no database and no Dodo account, only
// this deployment's DODO_PRODUCT_* env to resolve a product id into a plan.

import { pool } from "@/lib/db";
import { planForProduct, referralMetadataKey } from "@/lib/dodo";
import { PAID_PLAN_IDS, type BillingInterval, type PlanId } from "@/lib/plans";

/** Dodo's status, stored verbatim. Only some of these decide access. */
export type SubscriptionStatus =
  | "pending"
  | "active"
  | "on_hold"
  | "paused"
  | "cancelled"
  | "expired"
  | "failed";

export interface Subscription {
  plan: PlanId;
  interval: BillingInterval;
  status: SubscriptionStatus | string;
  subscriptionId: string | null;
  customerId: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

/** The Free plan, which is what "no row" means. */
export const FREE_SUBSCRIPTION: Subscription = {
  plan: "free",
  interval: "monthly",
  status: "active",
  subscriptionId: null,
  customerId: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
};

/**
 * Is this subscription entitled to its paid plan right now?
 *
 * `on_hold` is Dodo's "a renewal charge failed and I am retrying". Cutting
 * access the instant a card expires punishes the customer for their bank's
 * timing, so access survives until the period they already paid for runs out.
 * A cancelled subscription is treated the same way for the same reason.
 */
export function isEntitled(sub: Subscription, now: number = Date.now()): boolean {
  if (sub.plan === "free") return true;
  if (sub.status === "active") return true;
  if (sub.status === "expired" || sub.status === "failed") return false;
  if (!sub.currentPeriodEnd) return false;
  return Date.parse(sub.currentPeriodEnd) > now;
}

/** The plan an account may actually use — Free once a paid plan has lapsed. */
export function effectivePlan(sub: Subscription, now: number = Date.now()): PlanId {
  return isEntitled(sub, now) ? sub.plan : "free";
}

/**
 * What to *say* about a subscription, which is not the same question as what
 * it is entitled to.
 *
 * `never_started` is the distinction worth naming. A subscription whose very
 * first charge was declined has a plan, an interval and a period end stored,
 * and none of it ever meant anything — so describing it the way a lapsed plan
 * is described ("access ends…", "keep this plan") tells the customer they lost
 * something they never had. Dodo separates the two already: `failed` is an
 * initial charge that never succeeded, `on_hold` is a renewal that failed on a
 * plan that was working.
 */
export type BillingState = "free" | "active" | "never_started" | "lapsed";

export function billingState(sub: Subscription, now: number = Date.now()): BillingState {
  if (sub.plan === "free") return "free";
  if (sub.status === "failed") return "never_started";
  if (isEntitled(sub, now)) return "active";
  return "lapsed";
}

// ---------------------------------------------------------------------------
// Webhook parsing
// ---------------------------------------------------------------------------

/** What a subscription webhook asks us to write. */
export interface SubscriptionUpdate {
  /** From metadata we set at checkout. Null when Dodo has no idea whose it is. */
  userId: string | null;
  subscriptionId: string;
  customerId: string | null;
  plan: PlanId;
  interval: BillingInterval;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  /** The event's own timestamp, used to drop out-of-order deliveries. */
  eventAt: string;
  /** Affiliate referral id, when this subscription came from a referred visitor. */
  referralId: string | null;
}

/** Events that change what an account is entitled to. */
const SUBSCRIPTION_EVENTS = new Set([
  "subscription.active",
  "subscription.renewed",
  "subscription.on_hold",
  "subscription.paused",
  "subscription.plan_changed",
  "subscription.cancelled",
  "subscription.expired",
  "subscription.failed",
]);

type DodoEvent = {
  type?: string;
  timestamp?: string;
  data?: {
    subscription_id?: string;
    product_id?: string;
    status?: string;
    next_billing_date?: string;
    cancel_at_next_billing_date?: boolean;
    customer?: { customer_id?: string };
    metadata?: Record<string, unknown>;
  };
};

/**
 * A Dodo webhook body -> the row it implies, or null to ignore it.
 *
 * The plan comes from the *product id*, resolved against this deployment's own
 * DODO_PRODUCT_* configuration — not from `metadata.plan`. Metadata is a
 * string that happens to round-trip; the product is what the customer was
 * actually charged for. A product this deployment does not sell is ignored
 * outright, which is what keeps NumberHill's subscriptions — same Dodo
 * business, same signing secret — from granting StayFound plans.
 */
export function parseSubscriptionEvent(event: DodoEvent): SubscriptionUpdate | null {
  const type = event?.type ?? "";
  if (!SUBSCRIPTION_EVENTS.has(type)) return null;

  const data = event?.data ?? {};
  const subscriptionId = data.subscription_id;
  if (!subscriptionId) return null;

  const mapped = planForProduct(data.product_id);
  if (!mapped) return null;

  // `subscription.cancelled` can arrive with the status still reading `active`
  // — Dodo means "cancelled, running until the period ends". Trusting the
  // status field alone would leave a cancelled plan looking permanent.
  const status =
    type === "subscription.cancelled" && data.status === "active"
      ? "cancelled"
      : (data.status ?? type.split(".")[1]);

  const metadata = data.metadata ?? {};
  const rawUserId = metadata.user_id;
  const userId = typeof rawUserId === "string" && rawUserId ? rawUserId : null;

  const rawReferral = metadata[referralMetadataKey()];
  const referralId =
    typeof rawReferral === "string" && rawReferral ? rawReferral : null;

  return {
    userId,
    subscriptionId,
    customerId: data.customer?.customer_id ?? null,
    plan: mapped.plan,
    interval: mapped.interval,
    status,
    currentPeriodEnd: data.next_billing_date ?? null,
    cancelAtPeriodEnd:
      Boolean(data.cancel_at_next_billing_date) || type === "subscription.cancelled",
    eventAt: event?.timestamp ?? new Date().toISOString(),
    referralId,
  };
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

let schemaReady = false;

/**
 * One row per account, because a StayFound account has at most one plan.
 * Re-subscribing after a cancellation replaces the row rather than adding a
 * second, so "what is this account entitled to?" is a single lookup with no
 * ordering rule to get wrong.
 *
 * The absence of a row means Free. Nothing writes a row for the free plan: a
 * signup that never pays should not need a billing write to succeed, and any
 * read that treats "no row" as Free is then correct by construction.
 *
 * `user_id` is text with no foreign key, matching lib/queries.ts — Better Auth
 * owns its own tables and we do not want a billing write to depend on its
 * schema.
 */
export async function ensureBillingSchema() {
  if (schemaReady) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS subscription (
      user_id               text PRIMARY KEY,
      plan                  text NOT NULL,
      billing_interval      text NOT NULL DEFAULT 'monthly',
      status                text NOT NULL,
      dodo_subscription_id  text,
      dodo_customer_id      text,
      current_period_end    timestamptz,
      cancel_at_period_end  boolean NOT NULL DEFAULT false,
      -- The \`timestamp\` of the most recent webhook applied to this row.
      -- Webhooks are not ordered: a retried \`subscription.active\` can land
      -- after the \`subscription.cancelled\` that superseded it, and applying it
      -- would silently restore a cancelled plan.
      last_event_at         timestamptz,
      created_at            timestamptz NOT NULL DEFAULT now(),
      updated_at            timestamptz NOT NULL DEFAULT now()
    )
  `);
  // Dodo's subscription id is the idempotency key for the webhook: a delivery
  // retried three times must not create three rows or move a subscription
  // between accounts.
  await pool.query(
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_subscription_dodo_id
       ON subscription(dodo_subscription_id)
       WHERE dodo_subscription_id IS NOT NULL`,
  );
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_subscription_customer ON subscription(dodo_customer_id)`,
  );
  schemaReady = true;
}

type SubscriptionRow = {
  user_id: string;
  plan: PlanId;
  billing_interval: BillingInterval | null;
  status: string;
  dodo_subscription_id: string | null;
  dodo_customer_id: string | null;
  current_period_end: Date | null;
  cancel_at_period_end: boolean;
};

function fromRow(row: SubscriptionRow): Subscription {
  return {
    plan: row.plan,
    interval: row.billing_interval ?? "monthly",
    status: row.status,
    subscriptionId: row.dodo_subscription_id,
    customerId: row.dodo_customer_id,
    currentPeriodEnd: row.current_period_end
      ? new Date(row.current_period_end).toISOString()
      : null,
    cancelAtPeriodEnd: Boolean(row.cancel_at_period_end),
  };
}

/** An account's subscription. Free when it has never paid. */
export async function getSubscription(userId: string): Promise<Subscription> {
  try {
    await ensureBillingSchema();
    const { rows } = await pool.query<SubscriptionRow>(
      `SELECT * FROM subscription WHERE user_id = $1`,
      [userId],
    );
    return rows[0] ? fromRow(rows[0]) : FREE_SUBSCRIPTION;
  } catch (err) {
    // A dashboard that 500s because billing is unreachable is worse than one
    // that shows the free plan: nobody is charged either way, and the paid
    // features are gated by a separate read that will fail closed.
    console.error("subscription read failed:", err);
    return FREE_SUBSCRIPTION;
  }
}

export type ApplyResult =
  | { status: "applied" }
  | { status: "stale" }
  | { status: "unknown-account" }
  | { status: "error"; message: string };

/**
 * Writes what a webhook said, unless something newer is already stored.
 *
 * Webhooks are not ordered and are retried on our 500s, so a redelivered
 * `subscription.active` can arrive after the `subscription.cancelled` that
 * superseded it. Applying it would silently un-cancel a plan the customer
 * ended, which they would next hear about as an unexpected charge. Comparing
 * event timestamps is what stops that.
 */
export async function applySubscriptionUpdate(
  update: SubscriptionUpdate,
): Promise<ApplyResult> {
  try {
    await ensureBillingSchema();

    // Which account this belongs to. Checkout metadata is the normal answer;
    // falling back to the subscription id covers a plan changed from Dodo's own
    // dashboard, where the metadata we set may not be carried forward.
    let userId = update.userId;
    if (!userId) {
      const { rows } = await pool.query<{ user_id: string }>(
        `SELECT user_id FROM subscription WHERE dodo_subscription_id = $1`,
        [update.subscriptionId],
      );
      userId = rows[0]?.user_id ?? null;
    }
    if (!userId) return { status: "unknown-account" };

    // `last_event_at IS DISTINCT FROM` rather than a read-then-write: two
    // deliveries of the same subscription can be in flight at once, and the
    // comparison has to happen inside the statement that writes.
    const { rowCount } = await pool.query(
      `INSERT INTO subscription (
         user_id, plan, billing_interval, status,
         dodo_subscription_id, dodo_customer_id,
         current_period_end, cancel_at_period_end, last_event_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (user_id) DO UPDATE SET
         plan = EXCLUDED.plan,
         billing_interval = EXCLUDED.billing_interval,
         status = EXCLUDED.status,
         dodo_subscription_id = EXCLUDED.dodo_subscription_id,
         dodo_customer_id = EXCLUDED.dodo_customer_id,
         current_period_end = EXCLUDED.current_period_end,
         cancel_at_period_end = EXCLUDED.cancel_at_period_end,
         last_event_at = EXCLUDED.last_event_at,
         updated_at = now()
       WHERE subscription.last_event_at IS NULL
          OR subscription.last_event_at <= EXCLUDED.last_event_at`,
      [
        userId,
        update.plan,
        update.interval,
        update.status,
        update.subscriptionId,
        update.customerId,
        update.currentPeriodEnd,
        update.cancelAtPeriodEnd,
        update.eventAt,
      ],
    );

    // No row touched means the WHERE dropped it: newer state is already stored.
    return rowCount ? { status: "applied" } : { status: "stale" };
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : String(err) };
  }
}

/** Guard for feature gates: does this account's plan include `required`? */
export function planIncludes(current: PlanId, required: PlanId): boolean {
  const order: PlanId[] = ["free", ...PAID_PLAN_IDS];
  return order.indexOf(current) >= order.indexOf(required);
}
