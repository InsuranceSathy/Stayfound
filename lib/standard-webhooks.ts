// Standard Webhooks signature verification — the scheme Dodo Payments sends
// (https://github.com/standard-webhooks/standard-webhooks).
//
// It is not a plain body HMAC, which is the mistake that makes an integration
// reject every real delivery: the signature covers
// `${webhook-id}.${webhook-timestamp}.${body}`, is base64 rather than hex, and
// arrives as a space-delimited list of versioned signatures so a sender can
// rotate keys without downtime.
//
//   webhook-id:        msg_2KWPBgLlAfxdpx2AI54pPJ85f4W
//   webhook-timestamp: 1674087231
//   webhook-signature: v1,K5oZfzN95Z9UVu1EsfQmfVNQhnkZ2pj9o9NDN/H/pI4=

import { createHmac, timingSafeEqual } from "crypto";

/**
 * How far out of date a delivery may be. The spec requires a tolerance without
 * naming one; five minutes is what the reference implementations use, and it
 * is the window in which a captured payload can be replayed.
 */
export const TIMESTAMP_TOLERANCE_SECONDS = 5 * 60;

/**
 * The HMAC keys a stored secret could plausibly mean.
 *
 * The spec says a symmetric secret is base64 after a `whsec_` prefix, and Dodo
 * hands out exactly that. Both readings are tried anyway — a secret pasted
 * without the prefix, or a sender that signs with the raw UTF-8 bytes, is a
 * five-minute debugging session that this avoids entirely.
 */
function keyCandidates(secret: string): Buffer[] {
  const raw = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  const keys = [Buffer.from(raw, "utf8")];

  if (raw.length > 0 && raw.length % 4 === 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(raw)) {
    const decoded = Buffer.from(raw, "base64");
    if (decoded.length > 0 && !decoded.equals(keys[0])) keys.push(decoded);
  }
  return keys;
}

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/**
 * True when `payload` carries a valid, in-date Standard Webhooks signature.
 *
 * @param payload the *raw* request text — verifying a re-serialised JSON object
 *   fails, because key order and whitespace are part of what was signed.
 * @param nowMs injectable clock, so the replay window is testable.
 */
export function verifyStandardWebhook(
  payload: string,
  headers: Headers,
  secret: string,
  nowMs: number = Date.now(),
): boolean {
  const id = headers.get("webhook-id");
  const timestamp = headers.get("webhook-timestamp");
  const signatureHeader = headers.get("webhook-signature");
  if (!id || !timestamp || !signatureHeader) return false;

  const sentAt = Number(timestamp);
  if (!Number.isFinite(sentAt)) return false;
  // Rejecting an old timestamp is the only thing stopping a captured delivery
  // from being replayed forever — the signature over it stays valid.
  if (Math.abs(nowMs / 1000 - sentAt) > TIMESTAMP_TOLERANCE_SECONDS) return false;

  // Only the v1 (HMAC-SHA256) scheme. A v1a asymmetric signature is a different
  // algorithm entirely and must not be compared against an HMAC.
  const provided = signatureHeader
    .split(" ")
    .filter((part) => part.startsWith("v1,"))
    .map((part) => part.slice(3));
  if (provided.length === 0) return false;

  const signedContent = `${id}.${timestamp}.${payload}`;
  for (const key of keyCandidates(secret)) {
    const expected = createHmac("sha256", key)
      .update(signedContent, "utf8")
      .digest("base64");
    if (provided.some((sig) => safeEqual(expected, sig))) return true;
  }
  return false;
}
