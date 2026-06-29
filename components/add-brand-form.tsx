"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { addBrand, type AddBrandState } from "@/app/dashboard/actions";

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

  return (
    <form className="check-form" action={formAction} style={{ marginTop: 0 }}>
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
      {state.error && (
        <p className="check-error" style={{ flexBasis: "100%" }}>
          {state.error}
        </p>
      )}
    </form>
  );
}
