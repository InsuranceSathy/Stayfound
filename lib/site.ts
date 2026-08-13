export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://stayfound.ai"
).replace(/\/$/, "");

/** Where "book a demo" meetings actually get scheduled. */
export const CAL_MEETING_URL = "https://cal.com/kamal-nebulaleap-tech/meeting";
