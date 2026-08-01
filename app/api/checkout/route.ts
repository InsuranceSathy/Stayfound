import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

// Creates a Dodo Payments checkout link. Requires DODO_PAYMENT_API_KEY and
// DODO_PRODUCT_ID. Anonymous users are sent to sign-in first so the payment
// is tied to a real account.
const SIGN_IN = "https://app.stayfound.tech/sign-in";

export async function POST() {
  const key = process.env.DODO_PAYMENT_API_KEY;
  const productId = process.env.DODO_PRODUCT_ID;
  const base = process.env.DODO_BASE_URL || "https://test.dodopayments.com";
  const returnUrl =
    process.env.DODO_RETURN_URL || "https://app.stayfound.tech/dashboard";

  if (!key || !productId) {
    // Not configured yet — fall back to the login flow so the button still works.
    return NextResponse.json({ url: SIGN_IN, configured: false });
  }

  let email: string | undefined;
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    email = session?.user?.email;
  } catch {
    /* no session */
  }
  if (!email) {
    // Log in first so we can attach the payment to an account.
    return NextResponse.json({ url: SIGN_IN, needsLogin: true });
  }

  try {
    const res = await fetch(`${base}/payments`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        product_cart: [{ product_id: productId, quantity: 1 }],
        customer: { email },
        billing: { country: "US" },
        payment_link: true,
        return_url: returnUrl,
      }),
    });
    const data = await res.json();
    if (data?.payment_link) {
      return NextResponse.json({ url: data.payment_link });
    }
    return NextResponse.json({ url: SIGN_IN, error: "no payment_link" });
  } catch {
    return NextResponse.json({ url: SIGN_IN, error: "checkout failed" });
  }
}
