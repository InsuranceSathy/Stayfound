"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { persistScan } from "@/app/dashboard/actions";
import { capture, EVENTS } from "@/lib/analytics";

/**
 * Kicks off a scan without blocking a server action for two minutes.
 *
 * A web-grounded scan takes ~100-120s, so this enqueues a background job via
 * the same queue the public check uses, polls for completion, then asks the
 * server to persist the result. The result is always read back server-side
 * (from the job row or the cache) — the browser never supplies the numbers.
 */
export function ScanButton({
  brand,
  brandId,
  category,
  label = "Refresh",
  className = "btn btn-primary btn-sm",
  autoStart = false,
  block = false,
}: {
  brand: string;
  /** Which brand the snapshot belongs to — see persistScan. */
  brandId?: string;
  category: string;
  label?: string;
  className?: string;
  autoStart?: boolean;
  /** Render as a full progress panel rather than an inline button. */
  block?: boolean;
}) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  const run = useCallback(async () => {
    if (started.current) return;
    started.current = true;
    setError(null);
    setElapsed(0);
    setRunning(true);
    // `autoStart` distinguishes the very first scan of a new account from a
    // deliberate refresh — they are different moments in the funnel.
    capture(EVENTS.SCAN_STARTED, { brand, category, auto: autoStart });

    const finish = async (jobId: string | null) => {
      const res = await persistScan(jobId, brandId ?? null);
      if (!alive.current) return;
      if (res?.error) {
        setError(res.error);
        setRunning(false);
        started.current = false;
        capture(EVENTS.SCAN_FAILED, { brand, category, reason: "persist" });
        return;
      }
      setRunning(false);
      started.current = false;
      capture(EVENTS.SCAN_COMPLETED, { brand, category, cached: jobId === null });
      router.refresh();
    };

    try {
      const res = await fetch("/api/visibility", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ brand, category }),
      });
      const data = await res.json();

      // Cached or fixture result — the server reads it back itself.
      if (data.status === "done") return void (await finish(null));

      const jobId: string | undefined = data.jobId;
      if (!jobId) throw new Error("Could not start the scan.");

      // ~6 min ceiling at 4s intervals.
      for (let i = 0; i < 90; i++) {
        await new Promise((r) => setTimeout(r, 4000));
        if (!alive.current) return;
        const s = await fetch(`/api/visibility/status?job=${jobId}`, {
          cache: "no-store",
        });
        const sd = await s.json();
        if (sd.status === "done") return void (await finish(jobId));
        if (sd.status === "error") throw new Error("The scan failed. Try again.");
      }
      throw new Error("The scan is taking longer than expected. Try again.");
    } catch (e) {
      if (!alive.current) return;
      setError((e as Error).message || "Something went wrong.");
      setRunning(false);
      started.current = false;
      capture(EVENTS.SCAN_FAILED, {
        brand,
        category,
        reason: (e as Error).message || "unknown",
      });
    }
  }, [brand, brandId, category, router, autoStart]);

  useEffect(() => {
    if (autoStart && !started.current) void run();
  }, [autoStart, run]);

  if (running) {
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    const clock = mins ? `${mins}m ${secs}s` : `${secs}s`;
    return (
      <div className={block ? "sf-scanning block" : "sf-scanning"}>
        <span className="sf-spinner" aria-hidden="true" />
        <span>
          <b>Scanning ChatGPT, Gemini, Perplexity and Claude…</b>
          <span className="sf-scan-sub">
            Reading live search results — usually about two minutes. {clock} elapsed.
          </span>
        </span>
      </div>
    );
  }

  return (
    <div className={block ? "sf-scan-block" : undefined}>
      <button type="button" className={className} onClick={() => void run()}>
        {label} <span className="arr">→</span>
      </button>
      {error && <p className="sf-scan-err">{error}</p>}
    </div>
  );
}
