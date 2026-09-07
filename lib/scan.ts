import { resolveVisibility } from "@/lib/resolve-visibility";
import {
  setJobRunning,
  setJobDone,
  setJobError,
  putCachedScore,
} from "@/lib/queries";

/** Runs a scan job to completion and persists the result. Fire-and-forget. */
export async function runScan(
  jobId: string,
  brand: string,
  category: string,
  key: string,
): Promise<void> {
  try {
    await setJobRunning(jobId);
    const { live, result, source, cells } = await resolveVisibility(brand, category);
    await setJobDone(jobId, live, source, result, cells);
    if (live) {
      try {
        await putCachedScore(key, live, source, result);
      } catch {
        /* caching is best-effort */
      }
    }
  } catch (err) {
    await setJobError(jobId, (err as Error).message || "scan failed");
  }
}
