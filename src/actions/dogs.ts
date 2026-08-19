"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { DOG_MEDIA_BUCKET, MAX_PHOTOS_PER_DOG, STORAGE_BUCKET } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";
import { dogSchema, firstError } from "@/lib/validation";

const photoPathsSchema = z.array(z.string().min(1).max(300)).max(MAX_PHOTOS_PER_DOG);
const optionalMediaPathSchema = z.string().max(300).optional().or(z.literal(""));

function parsePhotoPaths(formData: FormData, userId: string): string[] | null {
  try {
    const raw = JSON.parse((formData.get("photoPaths") as string) || "[]");
    const parsed = photoPathsSchema.parse(raw);
    if (parsed.some((p) => !p.startsWith(`${userId}/`))) return null;
    return parsed;
  } catch {
    return null;
  }
}

function parseMediaPath(formData: FormData, key: "videoPath" | "barkAudioPath", userId: string): string | null | undefined {
  const parsed = optionalMediaPathSchema.safeParse(formData.get(key) ?? "");
  if (!parsed.success) return undefined;
  if (!parsed.data) return null;
  if (!parsed.data.startsWith(`${userId}/`)) return undefined;
  return parsed.data;
}

function dogInputFromForm(formData: FormData) {
  return {
    name: formData.get("name"), breed: formData.get("breed"), ageYears: formData.get("ageYears"),
    size: formData.get("size"), energyLevel: formData.get("energyLevel"), gender: formData.get("gender"),
    temperament: formData.get("temperament"), specialNeeds: formData.get("specialNeeds"), description: formData.get("description"),
    listingType: formData.get("listingType"), city: formData.get("city"),
    goodWithKids: formData.get("goodWithKids") === "on", goodWithDogs: formData.get("goodWithDogs") === "on",
    goodWithCats: formData.get("goodWithCats") === "on", houseTrained: formData.get("houseTrained") === "on",
    vaccinated: formData.get("vaccinated") === "on", neutered: formData.get("neutered") === "on",
    isActive: formData.get("isActive") === "on" || formData.get("isActive") === "true",
  };
}

async function getShelterUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, allowed: false };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return { supabase, user, allowed: profile?.role === "shelter_admin" };
}

export async function createDog(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = dogSchema.safeParse(dogInputFromForm(formData));
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  const { supabase, user, allowed } = await getShelterUser();
  if (!user) return { ok: false, error: "Not authenticated." };
  if (!allowed) return { ok: false, error: "Only shelter managers can publish dogs." };

  const photoPaths = parsePhotoPaths(formData, user.id);
  const videoPath = parseMediaPath(formData, "videoPath", user.id);
  const barkAudioPath = parseMediaPath(formData, "barkAudioPath", user.id);
  if (photoPaths === null || videoPath === undefined || barkAudioPath === undefined) return { ok: false, error: "Invalid media." };

  const d = parsed.data;
  const { data: dog, error } = await supabase.from("dogs").insert({
    owner_id: user.id, name: d.name, breed: d.breed || null, age_years: d.ageYears, size: d.size,
    energy_level: d.energyLevel, gender: d.gender || null, temperament: d.temperament || null,
    special_needs: d.specialNeeds || null, description: d.description || null, listing_type: d.listingType,
    city: d.city, good_with_kids: d.goodWithKids, good_with_dogs: d.goodWithDogs, good_with_cats: d.goodWithCats,
    house_trained: d.houseTrained, vaccinated: d.vaccinated, neutered: d.neutered, is_active: d.isActive,
    video_path: videoPath, bark_audio_path: barkAudioPath,
  }).select("id").single();

  if (error || !dog) return { ok: false, error: "Could not create the dog profile." };

  if (photoPaths.length > 0) {
    await supabase.from("dog_photos").insert(photoPaths.map((path, i) => ({ dog_id: dog.id, storage_path: path, sort_order: i })));
  }
  revalidatePath("/dogs"); revalidatePath("/shelter"); redirect("/dogs");
}

export async function updateDog(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const dogId = z.string().uuid().safeParse(formData.get("dogId"));
  if (!dogId.success) return { ok: false, error: "Invalid dog." };
  const parsed = dogSchema.safeParse(dogInputFromForm(formData));
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  const { supabase, user, allowed } = await getShelterUser();
  if (!user) return { ok: false, error: "Not authenticated." };
  if (!allowed) return { ok: false, error: "Only shelter managers can edit dog listings." };

  const photoPaths = parsePhotoPaths(formData, user.id);
  const videoPath = parseMediaPath(formData, "videoPath", user.id);
  const barkAudioPath = parseMediaPath(formData, "barkAudioPath", user.id);
  if (photoPaths === null || videoPath === undefined || barkAudioPath === undefined) return { ok: false, error: "Invalid media." };

  const { data: previous } = await supabase.from("dogs").select("video_path,bark_audio_path").eq("id", dogId.data).eq("owner_id", user.id).single();
  const d = parsed.data;
  const { data: updated, error } = await supabase.from("dogs").update({
    name: d.name, breed: d.breed || null, age_years: d.ageYears, size: d.size, energy_level: d.energyLevel,
    gender: d.gender || null, temperament: d.temperament || null, special_needs: d.specialNeeds || null,
    description: d.description || null, listing_type: d.listingType, city: d.city, good_with_kids: d.goodWithKids,
    good_with_dogs: d.goodWithDogs, good_with_cats: d.goodWithCats, house_trained: d.houseTrained,
    vaccinated: d.vaccinated, neutered: d.neutered, is_active: d.isActive, video_path: videoPath, bark_audio_path: barkAudioPath,
  }).eq("id", dogId.data).eq("owner_id", user.id).select("id");

  if (error || !updated || updated.length === 0) return { ok: false, error: "Could not update the dog profile." };

  await supabase.from("dog_photos").delete().eq("dog_id", dogId.data);
  if (photoPaths.length > 0) await supabase.from("dog_photos").insert(photoPaths.map((path, i) => ({ dog_id: dogId.data, storage_path: path, sort_order: i })));

  const oldMedia = [previous?.video_path, previous?.bark_audio_path].filter((p): p is string => Boolean(p));
  const newMedia = new Set([videoPath, barkAudioPath].filter((p): p is string => Boolean(p)));
  const remove = oldMedia.filter((p) => !newMedia.has(p));
  if (remove.length > 0) await supabase.storage.from(DOG_MEDIA_BUCKET).remove(remove);

  revalidatePath("/dogs"); revalidatePath(`/dogs/${dogId.data}`); revalidatePath("/shelter"); redirect("/dogs");
}

export async function deleteDog(formData: FormData): Promise<void> {
  const dogId = z.string().uuid().safeParse(formData.get("dogId"));
  if (!dogId.success) return;
  const { supabase, user, allowed } = await getShelterUser();
  if (!user || !allowed) return;

  const { data: photos } = await supabase.from("dog_photos").select("storage_path").eq("dog_id", dogId.data);
  const { data: dog } = await supabase.from("dogs").select("video_path,bark_audio_path").eq("id", dogId.data).eq("owner_id", user.id).single();
  const { error } = await supabase.from("dogs").delete().eq("id", dogId.data).eq("owner_id", user.id);

  if (!error && photos?.length) await supabase.storage.from(STORAGE_BUCKET).remove(photos.map((p) => p.storage_path));
  const media = [dog?.video_path, dog?.bark_audio_path].filter((p): p is string => Boolean(p));
  if (!error && media.length) await supabase.storage.from(DOG_MEDIA_BUCKET).remove(media);

  revalidatePath("/dogs"); revalidatePath("/shelter");
}
