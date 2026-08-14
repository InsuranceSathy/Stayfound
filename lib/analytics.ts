import posthog from "posthog-js";

/**
 * Product analytics — the funnel from a stranger on the landing page to a
 * paying account.
 *
 * Everything here is inert until NEXT_PUBLIC_POSTHOG_KEY is set: `capture` is
 * a no-op before the provider initialises, so a missing key degrades to
 * silence rather than a console full of warnings, and local development
 * doesn't pollute production numbers unless you opt in.
 *
 * Event names are constants rather than string literals at the call site. A
 * typo in an event name doesn't fail anywhere — it quietly creates a second,
 * near-identical event that splits the funnel in half and is only noticed
 * weeks later in PostHog.
 */

export const EVENTS = {
  // --- landing: the free report ---
  REPORT_STARTED: "report_started",
  REPORT_COMPLETED: "report_completed",
  REPORT_FAILED: "report_failed",
  /** The one free report is spent — this is the paywall being seen. */
  PAYWALL_SHOWN: "paywall_shown",
  PAYWALL_CTA_CLICKED: "paywall_cta_clicked",

  // --- activation: inside the app ---
  BRAND_ADDED: "brand_added",
  SCAN_STARTED: "scan_started",
  SCAN_COMPLETED: "scan_completed",
  SCAN_FAILED: "scan_failed",
  /** The report was handed to the print dialog to be saved or printed. */
  REPORT_DOWNLOADED: "report_downloaded",
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

/** Flipped on by the provider once init() has actually run. */
let ready = false;

export function markAnalyticsReady() {
  ready = true;
}

export function analyticsEnabled(): boolean {
  return ready;
}

/** Record an event. Silently does nothing when analytics is not configured. */
export function capture(
  event: EventName,
  properties?: Record<string, unknown>,
): void {
  if (!ready || typeof window === "undefined") return;
  try {
    posthog.capture(event, properties);
  } catch {
    // Analytics must never break the thing it is measuring.
  }
}

/**
 * Tie the current browser to an account.
 *
 * Called from the dashboard, which already has the session server-side — the
 * alternative, asking better-auth for the session on every page, would put an
 * auth request in front of every marketing page just to name the visitor.
 */
export function identify(userId: string, traits?: Record<string, unknown>): void {
  if (!ready || typeof window === "undefined") return;
  try {
    posthog.identify(userId, traits);
  } catch {
    /* ignore */
  }
}

/** Forget the account on sign-out, so the next person isn't merged into it. */
export function resetAnalytics(): void {
  if (!ready || typeof window === "undefined") return;
  try {
    posthog.reset();
  } catch {
    /* ignore */
  }
}
