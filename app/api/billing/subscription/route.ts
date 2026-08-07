// What the signed-in account is on, for the dashboard's Billing panel.
//
// Returns the account's own row and nothing that identifies the Dodo customer:
// the portal route takes no id from the client, so the browser never needs one.

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { billingState, effectivePlan, getSubscription, isEntitled } from "@/lib/billing";
import { isDodoConfigured, yearlyConfigured } from "@/lib/dodo";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;
  if (!user) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }

  const sub = await getSubscription(user.id);

  return NextResponse.json(
    {
      plan: sub.plan,
      // What they may actually use. Differs from `plan` once a paid plan has
      // lapsed, and the panel says so rather than showing a plan that no
      // longer works.
      effectivePlan: effectivePlan(sub),
      entitled: isEntitled(sub),
      // How the panel should describe this — notably `never_started`, a plan
      // whose first charge was declined and which therefore granted nothing.
      state: billingState(sub),
      interval: sub.interval,
      status: sub.status,
      currentPeriodEnd: sub.currentPeriodEnd,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      hasBillingAccount: Boolean(sub.customerId),
      checkoutAvailable: isDodoConfigured(),
      // Whether there is a yearly plan to point them at. Server-side because
      // only the Dodo product config knows.
      yearlyAvailable: yearlyConfigured(),
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
