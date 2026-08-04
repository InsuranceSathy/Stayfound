/**
 * Turns the scan's prose into something scannable.
 *
 * The model writes each recommendation as one dense paragraph. Nothing is
 * rewritten or summarised here — the text is only split on sentence
 * boundaries so the first sentence can lead and the rest can read as steps.
 */

// Abbreviations that end in a period but don't end a sentence.
const ABBR = /(?:e\.g|i\.e|etc|vs|approx|Inc|Ltd|Co|No|Fig|Dr|Mr|Mrs|St)\.$/i;

function sentences(text: string): string[] {
  const out: string[] = [];
  let buf = "";
  for (const token of text.trim().split(/(?<=[.!?])\s+/)) {
    const candidate = buf ? `${buf} ${token}` : token;
    if (ABBR.test(candidate.trim())) {
      buf = candidate;
      continue;
    }
    out.push(candidate.trim());
    buf = "";
  }
  if (buf.trim()) out.push(buf.trim());
  return out.filter(Boolean);
}

/** The one-line "why this matters" — the paragraph's opening sentence. */
export function takeaway(detail: string): string {
  return sentences(detail)[0] ?? detail;
}

/**
 * The remaining sentences as steps. Very long sentences are split again on
 * semicolons, which is how the model tends to string separate instructions.
 */
export function steps(detail: string, max = 6): string[] {
  const rest = sentences(detail).slice(1);
  const out: string[] = [];
  for (const part of rest) {
    if (part.length > 170 && part.includes("; ")) {
      out.push(...part.split("; ").map((s) => s.trim()).filter(Boolean));
    } else {
      out.push(part);
    }
  }
  return out.slice(0, max);
}

/** Trims a long string for a collapsed preview without cutting mid-word. */
export function preview(text: string, chars = 120): string {
  if (text.length <= chars) return text;
  const cut = text.slice(0, chars);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}
