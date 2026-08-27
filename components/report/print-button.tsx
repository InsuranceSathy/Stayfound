"use client";

import { capture, EVENTS } from "@/lib/analytics";

/**
 * Hands the document to the browser's print dialog, where "Save as PDF" lives
 * on every platform we ship to.
 *
 * The label says Download rather than Print because that is what people want
 * from it — the dialog is the means, not the intent.
 */
export function PrintButton() {
  return (
    <button
      type="button"
      className="btn btn-primary btn-sm"
      onClick={() => {
        capture(EVENTS.REPORT_DOWNLOADED);
        window.print();
      }}
    >
      Download report
    </button>
  );
}
