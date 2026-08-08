import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { AnalyticsIdentify } from "@/components/analytics-identify";

/**
 * Wraps the whole signed-in area purely to name the visitor in analytics.
 *
 * A layout rather than a line in page.tsx: the dashboard renders three
 * different trees (onboarding, first scan, the report), and the first two are
 * exactly the activation moments worth measuring — identifying in only the
 * third would lose them. Doing it here also keeps this out of the way of
 * anyone editing the page itself.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;

  return (
    <>
      {user && (
        <AnalyticsIdentify
          userId={user.id}
          email={user.email}
          name={user.name}
        />
      )}
      {children}
    </>
  );
}
