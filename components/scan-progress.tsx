"use client";

/**
 * What the wait looks like.
 *
 * A scan takes about two minutes because it genuinely goes and reads the web,
 * and the old grey skeleton made that feel like a page that had stalled. This
 * shows the work instead.
 *
 * It only claims what we actually know. The backend reports two states —
 * queued and running — and the four assistants are queried as a set, not in
 * sequence, so every engine shows as in flight together and none of them ever
 * gets a tick this component cannot verify. The clock is the real elapsed
 * time; nothing here is a simulated progress bar creeping toward a number it
 * invented.
 */

const ENGINES = ["ChatGPT", "Gemini", "Perplexity", "Claude"];

export function ScanProgress({
  elapsed,
  queued,
}: {
  /** Real seconds since the scan was submitted. */
  elapsed: number;
  /** True while the job is still waiting for a worker. */
  queued: boolean;
}) {
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const clock = mins ? `${mins}m ${String(secs).padStart(2, "0")}s` : `${secs}s`;

  return (
    <div className="scanp" role="status" aria-live="polite">
      <div className="scanp-head">
        <span className="scanp-state">
          <i className="scanp-dot" aria-hidden="true" />
          {queued ? "queued" : "reading the answers"}
        </span>
        <span className="scanp-clock">{clock}</span>
      </div>

      {/* All four at once, because that is how they are asked. */}
      <ul className="scanp-engines">
        {ENGINES.map((name, i) => (
          <li className="scanp-engine" key={name}>
            <span className="scanp-name">{name}</span>
            <span className="scanp-bar" aria-hidden="true">
              <span
                className="scanp-fill"
                /* staggered only so four identical bars don't pulse as one
                   block — it does not encode per-engine progress */
                style={{ animationDelay: `${i * 0.22}s` }}
              />
            </span>
          </li>
        ))}
      </ul>

      <p className="scanp-note">
        Asking the questions your buyers ask, then reading the roundups,
        directories and threads the answers are built from.
      </p>
    </div>
  );
}
