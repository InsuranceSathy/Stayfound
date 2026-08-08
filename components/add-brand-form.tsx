"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { addBrand, type AddBrandState } from "@/app/dashboard/actions";
import { capture, EVENTS } from "@/lib/analytics";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary check-submit" disabled={pending}>
      {pending ? "Analyzing your visibility…" : "Start tracking"}
      {!pending && <span className="arr">→</span>}
    </button>
  );
}

export function AddBrandForm() {
  const [state, formAction] = useActionState<AddBrandState, FormData>(addBrand, {});

  // Activation. Fires on the transition into a successful state rather than on
  // submit, so a rejected form (duplicate brand, expired session) isn't counted
  // as an activated account.
  const submitted = useRef(false);
  const recorded = useRef(false);
  useEffect(() => {
    if (!submitted.current || recorded.current) return;
    if (state.error) {
      submitted.current = false;
      return;
    }
    recorded.current = true;
    capture(EVENTS.BRAND_ADDED);
  }, [state]);

  return (
    <form
      className="check-form"
      action={(formData) => {
        submitted.current = true;
        formAction(formData);
      }}
      style={{ marginTop: 0 }}
    >
      <div className="field">
        <label htmlFor="name">Your brand</label>
        <input id="name" name="name" placeholder="e.g. Linear" autoComplete="off" required />
      </div>
      <div className="field">
        <label htmlFor="category">Category</label>
        <input
          id="category"
          name="category"
          placeholder="e.g. project management software"
          autoComplete="off"
          required
        />
      </div>
      <SubmitButton />
      <p className="check-hint" style={{ flexBasis: "100%" }}>
        Tip: be specific with your category (e.g. &ldquo;corporate compliance
        software&rdquo;) so we track the right competitors.
      </p>
      {state.error && (
        <p className="check-error" style={{ flexBasis: "100%" }}>
          {state.error}
        </p>
      )}
    </form>
  );
}
