"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { resolveVisibility } from "@/lib/resolve-visibility";
import {
  createBrand,
  deleteBrand,
  getBrandForUser,
  getCachedScore,
  getJob,
  saveSnapshot,
} from "@/lib/queries";
import { scanKey, scanScope } from "@/lib/report-derive";

async function requireUserId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id ?? null;
}

export type AddBrandState = { error?: string };

export async function addBrand(
  _prev: AddBrandState,
  formData: FormData,
): Promise<AddBrandState> {
  const userId = await requireUserId();
  if (!userId) return { error: "Your session expired. Please sign in again." };

  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const category = String(formData.get("category") ?? "").trim().slice(0, 120);
  // Optional: only the public check insists on it. Stored so every scan of this
  // brand measures the market it was measured at the first time.
  const market = String(formData.get("market") ?? "").trim().slice(0, 80);
  if (!name || !category) {
    return { error: "Add both your brand name and category." };
  }

  // One brand per user for now — don't duplicate.
  const existing = await getBrandForUser(userId);
  if (existing) return { error: "You already have a brand set up." };

  // Create only. The first scan runs as a background job started from the
  // dashboard, so adding a brand returns immediately instead of holding the
  // request open for the ~2 minutes a web-grounded scan takes.
  await createBrand(userId, name, category, market);
  revalidatePath("/dashboard");
  return {};
}

/**
 * Saves a finished scan as the brand's latest snapshot.
 *
 * The result is always read back on the server — from the job row when a
 * background scan ran, or from the score cache when it resolved instantly — so
 * a browser can never post made-up numbers into its own report.
 */
export async function persistScan(
  jobId: string | null,
): Promise<{ error?: string }> {
  const userId = await requireUserId();
  if (!userId) return { error: "Your session expired. Please sign in again." };
  const brand = await getBrandForUser(userId);
  if (!brand) return { error: "No brand set up yet." };

  // The scope, not the bare category: it is what the scan was actually run
  // against, so it is what the job's cache key was built from. Using the
  // category here would reject every job as "doesn't match your brand".
  const key = scanKey(brand.name, scanScope(brand.category, brand.market));

  if (jobId) {
    const job = await getJob(jobId);
    if (!job) return { error: "That scan could not be found." };
    if (job.status !== "done" || !job.data) {
      return { error: "That scan hasn't finished yet." };
    }
    // Only accept a job that was actually run for this user's own brand.
    if (job.cache_key !== key) {
      return { error: "That scan doesn't match your brand." };
    }
    await saveSnapshot(brand.id, job.data.score, job.live ?? false, job.data);
    revalidatePath("/dashboard");
    return {};
  }

  const cached = await getCachedScore(key);
  if (cached) {
    await saveSnapshot(brand.id, cached.data.score, cached.live, cached.data);
    revalidatePath("/dashboard");
    return {};
  }

  // Nothing cached: resolve directly. Only reached when the scan already
  // reported done (a fixture or a warm cache), so this returns fast.
  const { live, result } = await resolveVisibility(
    brand.name,
    scanScope(brand.category, brand.market),
  );
  await saveSnapshot(brand.id, result.score, live, result);
  revalidatePath("/dashboard");
  return {};
}

export async function removeBrand(): Promise<void> {
  const userId = await requireUserId();
  if (!userId) return;
  const brand = await getBrandForUser(userId);
  if (brand) await deleteBrand(userId, brand.id);
  revalidatePath("/dashboard");
  // Onboarding prefills from the free check this device ran, which is right for
  // someone who just bought and wrong for someone who just pressed "Delete and
  // start over" — they asked for an empty form. The flag rides in the url rather
  // than in storage so it clears itself on the next navigation.
  redirect("/dashboard?startover=1");
}
