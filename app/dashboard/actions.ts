"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { resolveVisibility } from "@/lib/resolve-visibility";
import {
  createBrand,
  deleteBrand,
  getBrandForUser,
  saveSnapshot,
} from "@/lib/queries";

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
  if (!name || !category) {
    return { error: "Add both your brand name and category." };
  }

  // One brand per user for now — don't duplicate.
  const existing = await getBrandForUser(userId);
  if (existing) return { error: "You already have a brand set up." };

  const brand = await createBrand(userId, name, category);
  const { live, result } = await resolveVisibility(name, category);
  await saveSnapshot(brand.id, result.score, live, result);

  revalidatePath("/dashboard");
  return {};
}

export async function refreshSnapshot(): Promise<void> {
  const userId = await requireUserId();
  if (!userId) return;
  const brand = await getBrandForUser(userId);
  if (!brand) return;

  const { live, result } = await resolveVisibility(brand.name, brand.category);
  await saveSnapshot(brand.id, result.score, live, result);
  revalidatePath("/dashboard");
}

export async function removeBrand(): Promise<void> {
  const userId = await requireUserId();
  if (!userId) return;
  const brand = await getBrandForUser(userId);
  if (brand) await deleteBrand(userId, brand.id);
  revalidatePath("/dashboard");
}
