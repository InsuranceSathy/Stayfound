/**
 * The report templates on offer, in one place because three things have to
 * agree about them: the picker in the toolbar, the route that renders one, and
 * the print stylesheet that has to set the right paper size.
 *
 * Client-safe — the picker is a client component and imports this directly.
 */

export type TemplateId =
  | "pitch"
  | "slides"
  | "brief"
  | "boardroom"
  | "studio"
  | "ledger";

export interface ReportTemplate {
  id: TemplateId;
  name: string;
  /** What kind of room this one is for — the picker shows this verbatim. */
  blurb: string;
  /**
   * The paper this template is composed on. `@page size` is a document-level
   * rule that cannot be scoped to a class, so the route emits the rule for
   * whichever template is rendering, and this is where it reads it from.
   */
  page: { width: string; height: string; orientation: "portrait" | "landscape" };
}

export const REPORT_TEMPLATES: readonly ReportTemplate[] = [
  {
    id: "pitch",
    name: "Pitch",
    blurb: "Bold 16:9 client presentation. Colour, big numbers, one idea a slide.",
    page: { width: "338.7mm", height: "190.5mm", orientation: "landscape" },
  },
  {
    id: "slides",
    name: "Slides",
    blurb: "Widescreen 16:9 deck. For presenting, or sending as a deck.",
    // 13.33 x 7.5in, the canvas Keynote, Google Slides and PowerPoint all
    // default to, so the PDF opens full-bleed rather than letterboxed.
    page: { width: "338.7mm", height: "190.5mm", orientation: "landscape" },
  },
  {
    id: "brief",
    name: "Brief",
    blurb: "Dense two-column analyst note. Most information per page.",
    page: { width: "210mm", height: "297mm", orientation: "portrait" },
  },
  {
    id: "boardroom",
    name: "Boardroom",
    blurb: "Formal, high contrast, generous margins. For an exec audience.",
    page: { width: "210mm", height: "297mm", orientation: "portrait" },
  },
  {
    id: "studio",
    name: "Studio",
    blurb: "Editorial and expressive, with colour and pull quotes.",
    page: { width: "210mm", height: "297mm", orientation: "portrait" },
  },
  {
    id: "ledger",
    name: "Ledger",
    blurb: "Strict typographic grid, no ornament. Quietest of the five.",
    page: { width: "210mm", height: "297mm", orientation: "portrait" },
  },
] as const;

/** The deck: it is the one people present from, and the one that survives
 *  being forwarded to someone who was not in the room. */
export const DEFAULT_TEMPLATE: TemplateId = "pitch";

export function getTemplate(id: string | null | undefined): ReportTemplate {
  return (
    REPORT_TEMPLATES.find((t) => t.id === id) ??
    REPORT_TEMPLATES.find((t) => t.id === DEFAULT_TEMPLATE)!
  );
}
