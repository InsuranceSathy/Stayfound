"use client";

import { useEffect } from "react";
import { identify } from "@/lib/analytics";

/**
 * Names the current visitor in PostHog.
 *
 * Takes the user from the server rather than asking better-auth for a session
 * on the client: the dashboard already resolved it, and a client-side session
 * lookup would put an auth request in front of every page just to label it.
 *
 * Identifying here is what stitches the funnel together — the anonymous person
 * who ran a free report on the marketing site and this account are the same
 * distinct id, so "ran a report" and "subscribed" land on one timeline.
 */
export function AnalyticsIdentify({
  userId,
  email,
  name,
}: {
  userId: string;
  email?: string | null;
  name?: string | null;
}) {
  useEffect(() => {
    identify(userId, {
      ...(email ? { email } : {}),
      ...(name ? { name } : {}),
    });
  }, [userId, email, name]);

  return null;
}
