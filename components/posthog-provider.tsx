"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { markAnalyticsReady } from "@/lib/analytics";

/**
 * Boots PostHog once, for the whole site.
 *
 * Mounted in the root layout because the funnel starts on the marketing pages:
 * the visitor who runs a free report on stayfound.tech and the account that
 * subscribes on app.stayfound.tech have to be the same person, or the funnel
 * reads as two unrelated strangers. `cross_subdomain_cookie` is what carries
 * the id across that boundary, so it is set explicitly rather than left to a
 * default that could change.
 *
 * Renders nothing and initialises nothing when the key is absent.
 */
export function PostHogProvider() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;

    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",

      // App Router navigations are history pushes, not document loads, so the
      // classic `capture_pageview: true` would only ever record the first page
      // of a session.
      capture_pageview: "history_change",
      capture_pageleave: true,

      // Keep the id when a visitor moves from stayfound.tech to
      // app.stayfound.tech — without this the sign-up looks like a new person
      // and every acquisition funnel breaks at the last step.
      cross_subdomain_cookie: true,

      // Anonymous events are still recorded; they just don't create a person
      // profile until someone signs in. 'never' would be cheaper still, but it
      // drops the anonymous-to-identified merge that the whole funnel needs.
      person_profiles: "identified_only",

      defaults: "2025-05-24",
    });

    markAnalyticsReady();
  }, []);

  return null;
}
