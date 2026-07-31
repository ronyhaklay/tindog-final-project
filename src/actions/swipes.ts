"use server";

import { DECK_PAGE_SIZE } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult, DeckDog } from "@/lib/types";
import {
  deckFiltersSchema,
  firstError,
  swipeSchema,
  type DeckFilters,
} from "@/lib/validation";

// Fetches the next batch of dogs for the current user via the
// get_swipe_deck() Postgres function (active, not mine, not yet swiped).
export async function getDeck(
  filters: DeckFilters
): Promise<ActionResult<DeckDog[]>> {
  const parsed = deckFiltersSchema.safeParse(filters);
  if (!parsed.success) {
    return { ok: false, error: firstError(parsed.error) };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_swipe_deck", {
    p_listing_type: parsed.data.listingType ?? null,
    p_city: parsed.data.city || null,
    p_limit: DECK_PAGE_SIZE,
  });

  if (error) {
    return { ok: false, error: "Could not load dogs. Please try again." };
  }

  return { ok: true, data: (data ?? []) as DeckDog[] };
}

// Records a swipe; a right-swipe also creates the match request
// atomically inside the record_swipe() Postgres function.
export async function swipe(input: {
  dogId: string;
  direction: "like" | "pass";
}): Promise<ActionResult> {
  const parsed = swipeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstError(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("record_swipe", {
    p_dog_id: parsed.data.dogId,
    p_direction: parsed.data.direction,
  });

  if (error) {
    return { ok: false, error: "Could not record the swipe." };
  }

  return { ok: true };
}
