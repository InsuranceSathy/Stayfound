"use client";

import { useEffect, useRef, useState } from "react";
import { removeBrand } from "@/app/dashboard/actions";

/**
 * Changing the tracked brand deletes it, and visibility_snapshot cascades on
 * that delete — so the button was one unconfirmed click away from destroying
 * every scan on the account. The trend line is the thing people pay to watch,
 * each scan costs about two minutes, and none of it is recoverable.
 *
 * So the action names what it costs before it happens. It confirms in place
 * rather than in a dialog: there is one decision to make, and it belongs next
 * to the brand it applies to. Escape backs out, and the destructive button is
 * never the one under the cursor when the strip opens.
 */
export function ChangeBrand({
  brand,
  brandId,
  scans,
}: {
  brand: string;
  /** The brand this button deletes — not simply the account's first. */
  brandId?: string;
  scans: number;
}) {
  const [confirming, setConfirming] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!confirming) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setConfirming(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirming]);

  if (!confirming) {
    return (
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={() => setConfirming(true)}
      >
        Change brand
      </button>
    );
  }

  return (
    <div className="sf-confirm" role="group" aria-label="Confirm changing brand">
      <p className="sf-confirm-q">
        Replace <b>{brand}</b>?
        {scans > 0 && (
          <>
            {" "}
            <span className="sf-confirm-cost">
              {scans} scan{scans === 1 ? "" : "s"} and the trend are deleted.
            </span>
          </>
        )}
      </p>
      <div className="sf-confirm-a">
        <button
          type="button"
          ref={cancelRef}
          className="btn btn-ghost btn-sm"
          onClick={() => setConfirming(false)}
        >
          Keep {brand}
        </button>
        <form action={() => removeBrand(brandId ?? null)}>
          <button type="submit" className="sf-danger">
            Delete and start over
          </button>
        </form>
      </div>
    </div>
  );
}
