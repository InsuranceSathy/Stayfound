"use client";

import { useState } from "react";
import type { Snippet } from "@/lib/snippets";

/** A code block you can paste straight into a project, with one-click copy. */
export function CopyBlock({ snippet }: { snippet: Snippet }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — the text is selectable anyway */
    }
  }

  return (
    <figure className="sf-code">
      <figcaption className="sf-code-bar">
        <span className="sf-code-label">
          <span className="sf-code-lang">{snippet.lang}</span>
          {snippet.label}
        </span>
        <button type="button" className="sf-copy" onClick={copy}>
          {copied ? "Copied" : "Copy"}
        </button>
      </figcaption>
      <pre>
        <code>{snippet.code}</code>
      </pre>
    </figure>
  );
}
