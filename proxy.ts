import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Host-based routing:
//   app.stayfound.tech        → the app. Hitting "/" sends you to the
//                               dashboard, which auth-gates to /sign-in.
//   www.stayfound.tech (etc.) → the marketing site + waitlist (unchanged).
export function proxy(request: NextRequest) {
  const host = (request.headers.get("host") || "").split(":")[0];
  const isAppSubdomain = host.startsWith("app.");

  if (isAppSubdomain && request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Only needs to catch the root; dashboard/sign-in handle the rest.
  matcher: "/",
};
