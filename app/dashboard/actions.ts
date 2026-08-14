"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { resolveVisibility } from "@/lib/resolve-visibility";
import {
  countBrandsForUser,
  createBrand,
  deleteBrand,
  getBrandById,
  getBrandForUser,
  getBrandsForUser,
  getCachedScore,
  getJob,
  saveSnapshot,
} from "@/lib/queries";
import { getSubscription, effectivePlan } from "@/lib/billing";
import { brandLimit, getPlan } from "@/lib/plans";
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

  // What the account actually paid for. Teams buys three brands and Agencies
  // ten; until now the code allowed one regardless, so those plans sold
  // something they could not deliver.
  const sub = await getSubscription(userId);
  const plan = effectivePlan(sub);
  const limit = brandLimit(plan);
  const used = await countBrandsForUser(userId);

  if (used >= limit) {
    const planName = getPlan(plan)?.name ?? "Your plan";
    return {
      error:
        limit === 1
          ? `${planName} tracks one brand. Upgrade to track more, or change the brand you're tracking.`
          : `${planName} tracks ${limit} brands and you're using all ${limit}. Upgrade, or remove one first.`,
    };
  }

  // Same brand twice is a mistake rather than a second brand, and it would
  // split one report's history across two rows.
  const already = (await getBrandsForUser(userId)).some(
    (b) => b.name.trim().toLowerCase() === name.toLowerCase(),
  );
  if (already) return { error: `You're already tracking ${name}.` };

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
  /**
   * Which brand this scan belongs to. Required once an account can hold
   * several: without it the result of scanning the second brand was written
   * onto the first, silently corrupting the wrong report's history. Omitted
   * means the only brand, which is still the common case.
   */
  brandId?: string | null,
): Promise<{ error?: string }> {
  const userId = await requireUserId();
  if (!userId) return { error: "Your session expired. Please sign in again." };
  const brand = brandId
    ? await getBrandById(userId, brandId)
    : await getBrandForUser(userId);
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

export async function removeBrand(brandId?: string | null): Promise<void> {
  const userId = await requireUserId();
  if (!userId) return;
  // Scoped to the brand named by the caller. `getBrandById` puts the user id in
  // the WHERE clause, so a guessed uuid deletes nothing.
  const brand = brandId
    ? await getBrandById(userId, brandId)
    : await getBrandForUser(userId);
  if (brand) await deleteBrand(userId, brand.id);
  revalidatePath("/dashboard");
  // Onboarding prefills from the free check this device ran, which is right for
  // someone who just bought and wrong for someone who just pressed "Delete and
  // start over" — they asked for an empty form. The flag rides in the url rather
  // than in storage so it clears itself on the next navigation.
  redirect("/dashboard?startover=1");
}
