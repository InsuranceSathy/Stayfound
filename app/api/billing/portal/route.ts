// A link into Dodo's hosted customer portal — change card, switch plan, cancel,
// download invoices.
//
// The customer id comes from the caller's own subscription row, never from the
// request. Accepting one would let any signed-in account open the billing
// portal of any customer whose id they could guess.

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getSubscription } from "@/lib/billing";
import { createPortalSession, isDodoConfigured, DODO_NOT_CONFIGURED } from "@/lib/dodo";

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: NO_STORE });
}

export async function POST() {
  if (!isDodoConfigured()) return fail(DODO_NOT_CONFIGURED, 503);

  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;
  if (!user) return fail("Please sign in first.", 401);

  const sub = await getSubscription(user.id);
  if (!sub.customerId) {
    return fail("This account has no billing history yet.", 404);
  }

  try {
    const url = await createPortalSession(sub.customerId);
    return NextResponse.json({ url }, { headers: NO_STORE });
  } catch (err) {
    console.error("dodo portal failed:", err);
    return fail("Couldn't open the billing portal. Please try again.", 502);
  }
}
