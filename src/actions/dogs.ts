"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { MAX_PHOTOS_PER_DOG, STORAGE_BUCKET } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";
import { dogSchema, firstError } from "@/lib/validation";

// Photos are uploaded directly from the browser to Supabase Storage
// (under the user's own folder, enforced by a storage RLS policy).
// The form then submits the resulting storage paths here.
const photoPathsSchema = z
  .array(z.string().min(1).max(300))
  .max(MAX_PHOTOS_PER_DOG, `At most ${MAX_PHOTOS_PER_DOG} photos`);

function parsePhotoPaths(
  formData: FormData,
  userId: string
): string[] | null {
  try {
    const raw = JSON.parse((formData.get("photoPaths") as string) || "[]");
    const parsed = photoPathsSchema.parse(raw);
    // A user may only reference files inside their own storage folder.
    if (parsed.some((p) => !p.startsWith(`${userId}/`))) return null;
    return parsed;
  } catch {
    return null;
  }
}

function dogInputFromForm(formData: FormData) {
  return {
    name: formData.get("name"),
    breed: formData.get("breed"),
    ageYears: formData.get("ageYears"),
    size: formData.get("size"),
    energyLevel: formData.get("energyLevel"),
    temperament: formData.get("temperament"),
    specialNeeds: formData.get("specialNeeds"),
    description: formData.get("description"),
    listingType: formData.get("listingType"),
    city: formData.get("city"),
    isActive: formData.get("isActive") === "on" || formData.get("isActive") === "true",
  };
}

export async function createDog(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed = dogSchema.safeParse(dogInputFromForm(formData));
  if (!parsed.success) {
    return { ok: false, error: firstError(parsed.error) };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  const photoPaths = parsePhotoPaths(formData, user.id);
  if (photoPaths === null) {
    return { ok: false, error: "Invalid photos." };
  }

  const d = parsed.data;
  const { data: dog, error } = await supabase
    .from("dogs")
    .insert({
      owner_id: user.id,
      name: d.name,
      breed: d.breed || null,
      age_years: d.ageYears,
      size: d.size,
      energy_level: d.energyLevel,
      temperament: d.temperament || null,
      special_needs: d.specialNeeds || null,
      description: d.description || null,
      listing_type: d.listingType,
      city: d.city,
      is_active: d.isActive,
    })
    .select("id")
    .single();

  if (error || !dog) {
    return { ok: false, error: "Could not create the dog profile." };
  }

  if (photoPaths.length > 0) {
    await supabase.from("dog_photos").insert(
      photoPaths.map((path, i) => ({
        dog_id: dog.id,
        storage_path: path,
        sort_order: i,
      }))
    );
  }

  revalidatePath("/dogs");
  redirect("/dogs");
}

export async function updateDog(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const dogId = z.string().uuid().safeParse(formData.get("dogId"));
  if (!dogId.success) return { ok: false, error: "Invalid dog." };

  const parsed = dogSchema.safeParse(dogInputFromForm(formData));
  if (!parsed.success) {
    return { ok: false, error: firstError(parsed.error) };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  const photoPaths = parsePhotoPaths(formData, user.id);
  if (photoPaths === null) {
    return { ok: false, error: "Invalid photos." };
  }

  const d = parsed.data;
  // RLS guarantees only the owner's row can match this update.
  const { data: updated, error } = await supabase
    .from("dogs")
    .update({
      name: d.name,
      breed: d.breed || null,
      age_years: d.ageYears,
      size: d.size,
      energy_level: d.energyLevel,
      temperament: d.temperament || null,
      special_needs: d.specialNeeds || null,
      description: d.description || null,
      listing_type: d.listingType,
      city: d.city,
      is_active: d.isActive,
    })
    .eq("id", dogId.data)
    .select("id");

  if (error || !updated || updated.length === 0) {
    return { ok: false, error: "Could not update the dog profile." };
  }

  // Replace the photo set with the submitted one (simple and predictable).
  await supabase.from("dog_photos").delete().eq("dog_id", dogId.data);
  if (photoPaths.length > 0) {
    await supabase.from("dog_photos").insert(
      photoPaths.map((path, i) => ({
        dog_id: dogId.data,
        storage_path: path,
        sort_order: i,
      }))
    );
  }

  revalidatePath("/dogs");
  redirect("/dogs");
}

export async function deleteDog(formData: FormData): Promise<void> {
  const dogId = z.string().uuid().safeParse(formData.get("dogId"));
  if (!dogId.success) return;

  const supabase = await createClient();

  // Collect photo paths first so we can clean up storage afterwards.
  const { data: photos } = await supabase
    .from("dog_photos")
    .select("storage_path")
    .eq("dog_id", dogId.data);

  // RLS: delete succeeds only if the current user owns the dog.
  const { error } = await supabase.from("dogs").delete().eq("id", dogId.data);

  if (!error && photos && photos.length > 0) {
    await supabase.storage
      .from(STORAGE_BUCKET)
      .remove(photos.map((p) => p.storage_path));
  }

  revalidatePath("/dogs");
}
