// Where sign-in lands someone who was midway through buying a plan.
//
// The session is checked here, on the server, so the page never flashes
// "Opening checkout…" at a signed-out browser that is about to be bounced. If
// they are still signed out, they go back to /sign-in with the same `next` they
// arrived with — so one failed round-trip retries rather than dropping the sale.

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ResumeCheckout } from "@/components/resume-checkout";
import { signInThenCheckout } from "@/lib/checkout-intent";
import { isPaidPlan, type BillingInterval, type PlanId } from "@/lib/plans";

export default async function ResumeCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const rawPlan = typeof sp.plan === "string" ? sp.plan : "";
  const interval: BillingInterval = sp.interval === "yearly" ? "yearly" : "monthly";

  // A url typed by hand, or a plan we retired. /pricing is where they can pick
  // a real one.
  if (!isPaidPlan(rawPlan)) redirect("/pricing");
  const plan = rawPlan as PlanId;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect(signInThenCheckout(plan, interval));

  return <ResumeCheckout plan={plan} interval={interval} />;
}
