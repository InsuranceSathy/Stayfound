"use client";

import { useEffect, useState } from "react";
import Cal, { getCalApi } from "@calcom/embed-react";
import { CAL_MEETING_URL } from "@/lib/site";

/**
 * The booking calendar, inline.
 *
 * A link sent people to cal.com and asked them to come back; most of the drop
 * happens at exactly that hop. The calendar is the page now, and the link stays
 * underneath for anyone whose browser blocks the embed.
 *
 * Themed to the site rather than to Cal's default: the marketing pages are
 * light paper with a single orange accent, and a stock Cal embed in the middle
 * of that reads as an advert for Cal.
 */

/** The `user/event` part of the booking URL — what the embed wants, rather
 *  than the full link we already keep for the fallback. */
const calLink = CAL_MEETING_URL.replace(/^https?:\/\/(www\.)?cal\.com\//, "").replace(/\/$/, "");

export function CalEmbed() {
  // Rendered only after the embed API has been configured, so the first paint
  // is never Cal's default palette flashing before ours is applied.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cal = await getCalApi();
      cal("ui", {
        // Locked to light. The marketing site does not have a dark mode, and
        // "auto" would hand a dark calendar to anyone whose OS is dark — on a
        // white page.
        theme: "light",
        cssVarsPerTheme: {
          light: {
            "cal-brand": "#d13b06",
            "cal-text": "#101114",
            "cal-text-emphasis": "#101114",
            "cal-text-subtle": "#55575f",
            "cal-text-muted": "#87878f",
            "cal-bg": "#ffffff",
            "cal-bg-emphasis": "#f4f3ef",
            "cal-border": "#e3e2dd",
            "cal-border-subtle": "#efeeea",
            "cal-border-emphasis": "#c9c8c2",
          },
          dark: {},
        },
        hideEventTypeDetails: false,
        layout: "month_view",
      });
      if (!cancelled) setReady(true);
    })().catch(() => {
      // The embed script is third-party and can be blocked. Failing here just
      // leaves the fallback link visible, which still books a meeting.
      if (!cancelled) setReady(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="cal-wrap">
      {ready ? (
        <Cal
          calLink={calLink}
          className="cal-frame"
          // A concrete height, not 100%. The wrapper has no height of its own,
          // so a percentage collapses the container and the month grid renders
          // on top of whatever follows it.
          style={{ width: "100%", height: "720px", overflow: "auto" }}
          config={{ layout: "month_view", theme: "light" }}
        />
      ) : (
        <div className="cal-loading" role="status">
          Loading the calendar…
        </div>
      )}

      <p className="cal-fallback">
        Calendar not loading?{" "}
        <a href={CAL_MEETING_URL} target="_blank" rel="noopener noreferrer">
          Open it in a new tab
        </a>
        .
      </p>
    </div>
  );
}
