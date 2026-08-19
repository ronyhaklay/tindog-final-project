"use server";

import { DECK_PAGE_SIZE } from "@/lib/constants";
import { computeMatchScore } from "@/lib/match-score";
import { distanceBetweenCities } from "@/lib/distance";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult, DeckDog, Profile } from "@/lib/types";
import { deckFiltersSchema, firstError, swipeSchema, type DeckFilters } from "@/lib/validation";

export async function getDeck(filters: DeckFilters): Promise<ActionResult<DeckDog[]>> {
  const parsed = deckFiltersSchema.safeParse(filters);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single<Profile>();
  if (profile?.role !== "adopter") return { ok: true, data: [] };

  const { data, error } = await supabase.rpc("get_swipe_deck", {
    p_listing_type: parsed.data.listingType ?? null,
    p_city: parsed.data.city || null,
    p_size: parsed.data.size ?? null,
    p_energy_level: parsed.data.energyLevel ?? null,
    p_good_with_kids: parsed.data.goodWithKids ?? null,
    p_limit: DECK_PAGE_SIZE,
  });
  if (error) return { ok: false, error: "Could not load dogs. Please try again." };

  const dogs = ((data ?? []) as DeckDog[]).map((dog) => ({
    ...dog,
    match_score: computeMatchScore(profile, dog),
    distance_km: distanceBetweenCities(profile.city, dog.city),
  }));
  return { ok: true, data: dogs };
}

export async function swipe(input: { dogId: string; direction: "like" | "pass" }): Promise<ActionResult> {
  const parsed = swipeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const supabase = await createClient();
  const { error } = await supabase.rpc("record_swipe", { p_dog_id: parsed.data.dogId, p_direction: parsed.data.direction });
  if (error) return { ok: false, error: "Could not record the swipe." };
  return { ok: true };
}
